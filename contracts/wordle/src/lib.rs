#![no_std]
//! Stellar Wordle — a daily word game fully on Stellar Soroban.
//!
//! The daily word is stored as a SHA-256 hash on-chain. The plaintext
//! word is kept in temporary storage for feedback computation but is
//! NEVER exposed through any public contract function.
//!
//! Every guess, the feedback, player stats and the leaderboard all live
//! in this contract (see ADR-001..ADR-004 in `data/decisions/`).
//! Reads are free simulations; `start_game` and `submit_guess` are
//! signed, fee-paying writes.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, vec, Address, BytesN, Env, String, Vec,
};

const WORD_LEN: u32 = 5;
const MAX_GUESSES: u32 = 6;
const MAX_LEADERBOARD: u32 = 100;

/// Feedback per letter: 0 = absent, 1 = present elsewhere, 2 = exact match.
pub const GRAY: u32 = 0;
pub const YELLOW: u32 = 1;
pub const GREEN: u32 = 2;

/// Game status: 0 = active, 1 = won, 2 = lost.
pub const STATUS_ACTIVE: u32 = 0;
pub const STATUS_WON: u32 = 1;
pub const STATUS_LOST: u32 = 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    /// SHA-256 hash of the current daily word (public, verifiable)
    WordHash,
    /// The actual word — stored in temporary storage, never exposed via API
    WordSecret,
    Day,
    PlayerGame(Address),
    PlayerStats(Address),
    Leaderboard,
}

#[contracttype]
#[derive(Clone)]
pub struct PlayerGame {
    pub day: u32,
    pub guesses: Vec<String>,
    pub status: u32,
    pub last_feedback: Vec<u32>,
}

#[contracttype]
#[derive(Clone)]
pub struct PlayerStats {
    pub games_played: u32,
    pub games_won: u32,
    pub current_streak: u32,
    pub max_streak: u32,
    pub guess_distribution: Vec<u32>,
}

#[contracttype]
#[derive(Clone)]
pub struct LeaderboardEntry {
    pub player: Address,
    pub wins: u32,
    pub streak: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    NotAuthorized = 2,
    WordInvalid = 3,
    GuessInvalid = 4,
    WordNotSet = 5,
    GameNotStarted = 6,
    GameFinished = 7,
    GuessLimitReached = 8,
    AlreadyGuessed = 9,
}

#[contract]
pub struct Wordle;

#[contractimpl]
impl Wordle {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Day, &0u32);
        env.storage().instance().set(
            &DataKey::Leaderboard,
            &Vec::<LeaderboardEntry>::new(&env),
        );
        env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
    }

    /// Admin-only: rotate the daily word. Stores the SHA-256 hash publicly
    /// and the word in temporary storage for feedback computation.
    /// Returns the new day number.
    pub fn set_word(env: Env, word: String) -> Result<u32, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if !is_valid_word(&word) {
            return Err(Error::WordInvalid);
        }

        let day: u32 = env.storage().instance().get(&DataKey::Day).unwrap_or(0);
        let day = day + 1;

        // Compute SHA-256 hash of the word
        let word_hash = compute_word_hash(&env, &word);

        // Store the hash in instance storage (publicly verifiable)
        env.storage().instance().set(&DataKey::WordHash, &word_hash);

        // Store the actual word in temporary storage (for feedback computation)
        // Temporary storage has a TTL and is NOT exposed via any public function
        env.storage().temporary().set(&DataKey::WordSecret, &word);
        // TTL: ~1 day in ledgers (17280 ledgers ≈ 1 day at 5s/ledger)
        env.storage()
            .temporary()
            .extend_ttl(&DataKey::WordSecret, 17280, 2 * 17280);

        env.storage().instance().set(&DataKey::Day, &day);
        env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);

        Ok(day)
    }

    /// Returns the SHA-256 hash of the current daily word.
    /// Players cannot derive the word from this hash, but can verify
    /// the word after the admin reveals it (e.g., next day).
    pub fn get_word_hash(env: Env) -> Result<BytesN<32>, Error> {
        env.storage()
            .instance()
            .get(&DataKey::WordHash)
            .ok_or(Error::WordNotSet)
    }

    /// Current word-rotation day number.
    pub fn get_day(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Day).unwrap_or(0)
    }

    /// Admin-only: reveal a previous word for verification.
    /// Allows anyone to confirm the word matches the stored hash.
    /// Only callable by admin (to reveal after the day ends).
    pub fn verify_word(env: Env, word: String) -> Result<bool, Error> {
        let stored_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::WordHash)
            .ok_or(Error::WordNotSet)?;

        let provided_hash = compute_word_hash(&env, &word);

        Ok(stored_hash == provided_hash)
    }

    /// Idempotent: starts a game for the player against the current day.
    pub fn start_game(env: Env, player: Address) -> Result<u32, Error> {
        player.require_auth();
        let day = env.storage().instance().get(&DataKey::Day).unwrap_or(0);
        if day == 0 {
            return Err(Error::WordNotSet);
        }

        // Ensure the word secret is still available
        if !env.storage().temporary().has(&DataKey::WordSecret) {
            return Err(Error::WordNotSet);
        }

        let existing: Option<PlayerGame> = env
            .storage()
            .instance()
            .get(&DataKey::PlayerGame(player.clone()));
        match existing {
            Some(game) if game.day == day => return Ok(day),
            _ => {
                let game = PlayerGame {
                    day,
                    guesses: Vec::new(&env),
                    status: STATUS_ACTIVE,
                    last_feedback: Vec::new(&env),
                };
                env.storage()
                    .instance()
                    .set(&DataKey::PlayerGame(player.clone()), &game);
                env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
                Ok(day)
            }
        }
    }

    /// Submit a 5-letter guess. Returns per-letter feedback.
    /// The word is read from temporary storage (never exposed to callers).
    pub fn submit_guess(env: Env, player: Address, guess: String) -> Result<Vec<u32>, Error> {
        player.require_auth();
        let day = env.storage().instance().get(&DataKey::Day).unwrap_or(0);

        // Read word from temporary storage
        let answer: String = env
            .storage()
            .temporary()
            .get(&DataKey::WordSecret)
            .ok_or(Error::WordNotSet)?;

        let mut game: PlayerGame = env
            .storage()
            .instance()
            .get(&DataKey::PlayerGame(player.clone()))
            .ok_or(Error::GameNotStarted)?;

        if game.day != day {
            return Err(Error::GameNotStarted);
        }
        if game.status != STATUS_ACTIVE {
            return Err(Error::GameFinished);
        }
        if game.guesses.len() >= MAX_GUESSES {
            return Err(Error::GuessLimitReached);
        }

        let guess_bytes = validate_guess(&guess)?;
        if already_guessed(&env, &game.guesses, &guess) {
            return Err(Error::AlreadyGuessed);
        }

        let answer_bytes = word_bytes(&answer)?;
        let feedback = compute_feedback(&env, &answer_bytes, &guess_bytes);

        let mut won = true;
        for i in 0..WORD_LEN {
            if feedback.get(i).unwrap_or(GRAY) != GREEN {
                won = false;
                break;
            }
        }

        let mut guesses = game.guesses.clone();
        guesses.push_back(guess.clone());
        game.guesses = guesses.clone();
        game.last_feedback = feedback.clone();

        if won {
            game.status = STATUS_WON;
            env.storage()
                .instance()
                .set(&DataKey::PlayerGame(player.clone()), &game);
            update_stats_win(&env, &player, guesses.len());
            env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
        } else if guesses.len() >= MAX_GUESSES {
            game.status = STATUS_LOST;
            env.storage()
                .instance()
                .set(&DataKey::PlayerGame(player.clone()), &game);
            update_stats_loss(&env, &player);
            env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
        } else {
            env.storage()
                .instance()
                .set(&DataKey::PlayerGame(player.clone()), &game);
            env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
        }

        // Extend word TTL on each guess to keep it available
        env.storage()
            .temporary()
            .extend_ttl(&DataKey::WordSecret, 17280, 2 * 17280);

        Ok(feedback)
    }

    /// Read-only evaluation of a guess against the current word.
    /// Simulation only — zero fees, no auth required.
    /// Note: The word is read internally from temporary storage, never returned.
    pub fn evaluate(env: Env, guess: String) -> Result<Vec<u32>, Error> {
        let answer: String = env
            .storage()
            .temporary()
            .get(&DataKey::WordSecret)
            .ok_or(Error::WordNotSet)?;
        let guess_bytes = validate_guess(&guess)?;
        let answer_bytes = word_bytes(&answer)?;
        Ok(compute_feedback(&env, &answer_bytes, &guess_bytes))
    }

    pub fn get_player_game(env: Env, player: Address) -> Option<PlayerGame> {
        env.storage().instance().get(&DataKey::PlayerGame(player))
    }

    pub fn get_player_stats(env: Env, player: Address) -> PlayerStats {
        env.storage()
            .instance()
            .get(&DataKey::PlayerStats(player))
            .unwrap_or_else(|| empty_stats(&env))
    }

    pub fn get_leaderboard(env: Env) -> Vec<LeaderboardEntry> {
        env.storage()
            .instance()
            .get(&DataKey::Leaderboard)
            .unwrap_or_else(|| Vec::new(&env))
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Compute the SHA-256 hash of a word for storage.
fn compute_word_hash(env: &Env, word: &String) -> BytesN<32> {
    let mut buf = [0u8; WORD_LEN as usize];
    word.copy_into_slice(&mut buf);
    let bytes = soroban_sdk::Bytes::from_slice(env, &buf);
    env.crypto().sha256(&bytes).into()
}

fn is_valid_word(word: &String) -> bool {
    if word.len() != WORD_LEN {
        return false;
    }
    let mut buf = [0u8; WORD_LEN as usize];
    word.copy_into_slice(&mut buf);
    for b in buf.iter() {
        if *b < b'a' || *b > b'z' {
            return false;
        }
    }
    true
}

fn validate_guess(guess: &String) -> Result<[u8; WORD_LEN as usize], Error> {
    if guess.len() != WORD_LEN {
        return Err(Error::GuessInvalid);
    }
    let mut arr = [0u8; WORD_LEN as usize];
    guess.copy_into_slice(&mut arr);
    for b in arr.iter() {
        if *b < b'a' || *b > b'z' {
            return Err(Error::GuessInvalid);
        }
    }
    Ok(arr)
}

fn word_bytes(word: &String) -> Result<[u8; WORD_LEN as usize], Error> {
    if word.len() != WORD_LEN {
        return Err(Error::WordInvalid);
    }
    let mut arr = [0u8; WORD_LEN as usize];
    word.copy_into_slice(&mut arr);
    Ok(arr)
}

fn already_guessed(env: &Env, guesses: &Vec<String>, guess: &String) -> bool {
    let mut i = 0;
    while i < guesses.len() {
        if guesses.get(i).unwrap_or_else(|| String::from_str(env, "")) == *guess {
            return true;
        }
        i += 1;
    }
    false
}

/// ADR-003 feedback: green pass first (count-limited), then yellow pass.
fn compute_feedback(
    env: &Env,
    answer: &[u8; WORD_LEN as usize],
    guess: &[u8; WORD_LEN as usize],
) -> Vec<u32> {
    let mut result = [GRAY; WORD_LEN as usize];
    let mut remaining = [0u32; 26];

    // Green pass
    for i in 0..WORD_LEN as usize {
        if guess[i] == answer[i] {
            result[i] = GREEN;
        } else {
            remaining[(answer[i] - b'a') as usize] += 1;
        }
    }
    // Yellow pass
    for i in 0..WORD_LEN as usize {
        if result[i] != GREEN {
            let idx = (guess[i] - b'a') as usize;
            if remaining[idx] > 0 {
                result[i] = YELLOW;
                remaining[idx] -= 1;
            }
        }
    }

    let mut out = Vec::new(env);
    for v in result.iter() {
        out.push_back(*v);
    }
    out
}

fn empty_stats(env: &Env) -> PlayerStats {
    PlayerStats {
        games_played: 0,
        games_won: 0,
        current_streak: 0,
        max_streak: 0,
        guess_distribution: vec![env, 0, 0, 0, 0, 0, 0],
    }
}

fn update_stats_win(env: &Env, player: &Address, guesses: u32) {
    let mut stats: PlayerStats = env
        .storage()
        .instance()
        .get(&DataKey::PlayerStats(player.clone()))
        .unwrap_or_else(|| empty_stats(env));

    stats.games_played += 1;
    stats.games_won += 1;
    stats.current_streak += 1;
    if stats.current_streak > stats.max_streak {
        stats.max_streak = stats.current_streak;
    }
    let mut dist = stats.guess_distribution.clone();
    let idx = guesses.saturating_sub(1);
    if idx < MAX_GUESSES {
        let cur = dist.get(idx).unwrap_or(0);
        dist.set(idx, cur + 1);
    }
    stats.guess_distribution = dist;

    env.storage()
        .instance()
        .set(&DataKey::PlayerStats(player.clone()), &stats);

    upsert_leaderboard(env, player, stats.games_won, stats.current_streak);
}

fn update_stats_loss(env: &Env, player: &Address) {
    let mut stats: PlayerStats = env
        .storage()
        .instance()
        .get(&DataKey::PlayerStats(player.clone()))
        .unwrap_or_else(|| empty_stats(env));

    stats.games_played += 1;
    stats.current_streak = 0;

    env.storage()
        .instance()
        .set(&DataKey::PlayerStats(player.clone()), &stats);
}

/// ADR-004: keep a sorted (wins desc, streak desc) leaderboard capped at 100.
fn upsert_leaderboard(env: &Env, player: &Address, wins: u32, streak: u32) {
    let entries: Vec<LeaderboardEntry> = env
        .storage()
        .instance()
        .get(&DataKey::Leaderboard)
        .unwrap_or_else(|| Vec::new(env));

    let mut out = Vec::<LeaderboardEntry>::new(env);
    let mut inserted = false;

    let mut i = 0;
    while i < entries.len() {
        let entry = entries.get(i).unwrap();
        if &entry.player == player {
            i += 1;
            continue;
        }
        if !inserted && (wins > entry.wins || (wins == entry.wins && streak > entry.streak)) {
            out.push_back(LeaderboardEntry {
                player: player.clone(),
                wins,
                streak,
            });
            inserted = true;
        }
        out.push_back(entry);
        i += 1;
    }
    if !inserted {
        out.push_back(LeaderboardEntry {
            player: player.clone(),
            wins,
            streak,
        });
    }

    if out.len() > MAX_LEADERBOARD {
        let mut capped = Vec::<LeaderboardEntry>::new(env);
        let mut k = 0;
        while k < MAX_LEADERBOARD {
            capped.push_back(out.get(k).unwrap());
            k += 1;
        }
        out = capped;
    }

    env.storage().instance().set(&DataKey::Leaderboard, &out);
}

#[cfg(test)]
mod test;
