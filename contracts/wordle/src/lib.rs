#![no_std]
//! Stellar Wordle — a daily word game fully on Stellar Soroban.
//!
//! The daily word, every guess, the feedback, player stats and the
//! leaderboard all live in this contract (see ADR-001..ADR-004 in
//! `data/decisions/`). Reads are free simulations; `start_game` and
//! `submit_guess` are signed, fee-paying writes.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, vec, Address, Env, String,
    Vec,
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
    Word,
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

#[contractevent]
pub struct WordSet {
    #[topic]
    pub day: u32,
    pub word: String,
}

#[contractevent]
pub struct GameStarted {
    #[topic]
    pub player: Address,
    pub day: u32,
}

#[contractevent]
pub struct GuessMade {
    #[topic]
    pub player: Address,
    pub day: u32,
    pub guess: String,
    pub feedback: Vec<u32>,
}

#[contractevent]
pub struct GameWon {
    #[topic]
    pub player: Address,
    pub day: u32,
    pub guesses: u32,
}

#[contractevent]
pub struct GameLost {
    #[topic]
    pub player: Address,
    pub day: u32,
    pub word: String,
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

    /// Admin-only: rotate the daily word. Returns the new day number.
    pub fn set_word(env: Env, word: String) -> Result<u32, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if !is_valid_word(&env, &word) {
            return Err(Error::WordInvalid);
        }

        let day: u32 = env.storage().instance().get(&DataKey::Day).unwrap_or(0);
        let day = day + 1;
        env.storage().instance().set(&DataKey::Word, &word);
        env.storage().instance().set(&DataKey::Day, &day);
        env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);

        WordSet { day, word }.publish(&env);
        Ok(day)
    }

    /// Current daily word. Public by design (ADR-001): storage is readable,
    /// word secrecy is a game-master trust assumption.
    pub fn get_word(env: Env) -> Result<String, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Word)
            .ok_or(Error::WordNotSet)
    }

    /// Current word-rotation day number.
    pub fn get_day(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Day).unwrap_or(0)
    }

    /// Idempotent: starts a game for the player against the current day.
    /// Returns the game day. One active game per player per day.
    pub fn start_game(env: Env, player: Address) -> Result<u32, Error> {
        player.require_auth();
        let day = env.storage().instance().get(&DataKey::Day).unwrap_or(0);
        if day == 0 {
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
                GameStarted { player, day }.publish(&env);
                Ok(day)
            }
        }
    }

    /// Submit a 5-letter guess. Returns the per-letter feedback
    /// [0=gray, 1=yellow, 2=green] (ADR-003: green-first, count-limited).
    pub fn submit_guess(env: Env, player: Address, guess: String) -> Result<Vec<u32>, Error> {
        player.require_auth();
        let day = env.storage().instance().get(&DataKey::Day).unwrap_or(0);
        let answer: String = env
            .storage()
            .instance()
            .get(&DataKey::Word)
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

        let guess_bytes = validate_guess(&env, &guess)?;
        if already_guessed(&env, &game.guesses, &guess) {
            return Err(Error::AlreadyGuessed);
        }

        let answer_bytes = word_bytes(&env, &answer)?;
        let feedback = compute_feedback(&answer_bytes, &guess_bytes);

        let mut won = true;
        for i in 0..WORD_LEN {
            if feedback[i as usize] != GREEN {
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
            let stats = self::update_stats_win(&env, &player, guesses.len());
            let _ = stats;
            env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
            GameWon {
                player: player.clone(),
                day,
                guesses: guesses.len(),
            }
            .publish(&env);
        } else if guesses.len() >= MAX_GUESSES {
            game.status = STATUS_LOST;
            env.storage()
                .instance()
                .set(&DataKey::PlayerGame(player.clone()), &game);
            self::update_stats_loss(&env, &player);
            env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
            GameLost {
                player: player.clone(),
                day,
                word: answer,
            }
            .publish(&env);
        } else {
            env.storage()
                .instance()
                .set(&DataKey::PlayerGame(player.clone()), &game);
            env.storage().instance().extend_ttl(60 * 17280, 90 * 17280);
            GuessMade {
                player: player.clone(),
                day,
                guess,
                feedback: feedback.clone(),
            }
            .publish(&env);
        }

        Ok(feedback)
    }

    /// Read-only evaluation of a guess against the current word.
    /// Simulation only — zero fees, no auth required.
    pub fn evaluate(env: Env, guess: String) -> Result<Vec<u32>, Error> {
        let answer: String = env
            .storage()
            .instance()
            .get(&DataKey::Word)
            .ok_or(Error::WordNotSet)?;
        let guess_bytes = validate_guess(&env, &guess)?;
        let answer_bytes = word_bytes(&env, &answer)?;
        Ok(compute_feedback(&answer_bytes, &guess_bytes))
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

fn is_valid_word(env: &Env, word: &String) -> bool {
    if word.len() != WORD_LEN {
        return false;
    }
    for i in 0..WORD_LEN {
        let b = word.get(i).unwrap_or(0);
        if b < b'a' || b > b'z' {
            return false;
        }
    }
    let _ = env;
    true
}

fn validate_guess(env: &Env, guess: &String) -> Result<[u8; WORD_LEN as usize], Error> {
    if guess.len() != WORD_LEN {
        return Err(Error::GuessInvalid);
    }
    let mut arr = [0u8; WORD_LEN as usize];
    for i in 0..WORD_LEN {
        let b = guess.get(i).unwrap_or(0);
        if b < b'a' || b > b'z' {
            return Err(Error::GuessInvalid);
        }
        arr[i as usize] = b;
    }
    let _ = env;
    Ok(arr)
}

fn word_bytes(env: &Env, word: &String) -> Result<[u8; WORD_LEN as usize], Error> {
    if word.len() != WORD_LEN {
        return Err(Error::WordInvalid);
    }
    let mut arr = [0u8; WORD_LEN as usize];
    for i in 0..WORD_LEN {
        arr[i as usize] = word.get(i).unwrap_or(0);
    }
    let _ = env;
    Ok(arr)
}

fn already_guessed(env: &Env, guesses: &Vec<String>, guess: &String) -> bool {
    let mut i = 0;
    while i < guesses.len() {
        if guesses.get(i).unwrap_or_else(|| String::from_bytes(env, b"")) == *guess {
            return true;
        }
        i += 1;
    }
    false
}

/// ADR-003 feedback: green pass first (count-limited), then yellow pass.
fn compute_feedback(answer: &[u8; WORD_LEN as usize], guess: &[u8; WORD_LEN as usize]) -> Vec<u32> {
    let mut result = [GRAY; WORD_LEN as usize];
    let mut remaining = [0u32; 26];

    for i in 0..WORD_LEN as usize {
        if guess[i] == answer[i] {
            result[i] = GREEN;
        } else {
            remaining[(answer[i] - b'a') as usize] += 1;
        }
    }
    for i in 0..WORD_LEN as usize {
        if result[i] != GREEN {
            let idx = (guess[i] - b'a') as usize;
            if remaining[idx] > 0 {
                result[i] = YELLOW;
                remaining[idx] -= 1;
            }
        }
    }
    result.to_vec()
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

fn update_stats_win(env: &Env, player: &Address, guesses: u32) -> PlayerStats {
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
    stats
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