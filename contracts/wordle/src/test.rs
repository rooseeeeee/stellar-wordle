#![cfg(test)]
extern crate std;
use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

fn s(env: &Env, word: &str) -> String {
    String::from_str(env, word)
}

fn setup() -> (Env, WordleClient<'static>, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let contract_id = env.register(Wordle, (&admin,));
    let client = WordleClient::new(&env, &contract_id);
    (env, client, admin, alice, bob)
}

// ---------------------------------------------------------------------------
// Admin / word rotation
// ---------------------------------------------------------------------------

#[test]
fn constructor_and_word_set() {
    let (env, client, _, _, _) = setup();
    assert_eq!(client.get_day(), 0);

    let day = client.set_word(&s(&env, "crane"));
    assert_eq!(day, 1);
    assert_eq!(client.get_day(), 1);

    // get_word_hash returns a hash, not the plaintext
    let hash = client.get_word_hash();
    assert_eq!(hash.len(), 32); // SHA-256 produces 32 bytes

    // Setting a new word changes the hash
    let day = client.set_word(&s(&env, "space"));
    assert_eq!(day, 2);
    let new_hash = client.get_word_hash();
    assert_ne!(hash, new_hash);
}

#[test]
fn verify_word_works() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "crane"));

    // Correct word verifies true
    assert_eq!(client.verify_word(&s(&env, "crane")), true);

    // Wrong word verifies false
    assert_eq!(client.verify_word(&s(&env, "space")), false);
}

#[test]
fn set_word_rejects_invalid_words() {
    let (env, client, _, _, _) = setup();
    for bad in ["cran", "cranes", "CRANE", "cra1e", "cra ne"] {
        assert_eq!(
            client.try_set_word(&s(&env, bad)),
            Err(Ok(Error::WordInvalid)),
            "word {:?} should be rejected",
            bad
        );
    }
}

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------

#[test]
fn start_game_requires_word() {
    let (_, client, _, alice, _) = setup();
    assert_eq!(client.try_start_game(&alice), Err(Ok(Error::WordNotSet)));
}

#[test]
fn start_game_is_idempotent_for_the_day() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));

    assert_eq!(client.start_game(&alice), 1);
    let game = client.get_player_game(&alice).unwrap();
    assert_eq!(game.day, 1);
    assert_eq!(game.guesses.len(), 0);
    assert_eq!(game.status, STATUS_ACTIVE);

    // Second call same day → still day 1, no new game
    assert_eq!(client.start_game(&alice), 1);
    assert_eq!(client.get_player_game(&alice).unwrap().guesses.len(), 0);
}

#[test]
fn start_game_rotates_with_new_word() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.set_word(&s(&env, "space"));

    assert_eq!(client.start_game(&alice), 2);
    let game = client.get_player_game(&alice).unwrap();
    assert_eq!(game.day, 2);
    assert_eq!(game.guesses.len(), 0);
}

#[test]
fn submit_before_start_rejected() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "crane")),
        Err(Ok(Error::GameNotStarted))
    );
}

#[test]
fn stale_day_requires_restart() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "sober"));
    client.set_word(&s(&env, "space"));

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "space")),
        Err(Ok(Error::GameNotStarted))
    );
}

#[test]
fn invalid_guesses_rejected() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);

    for bad in ["crn", "cranes", "CRANE", "cr4ne"] {
        assert_eq!(
            client.try_submit_guess(&alice, &s(&env, bad)),
            Err(Ok(Error::GuessInvalid)),
            "guess {:?} should be rejected",
            bad
        );
    }
}

#[test]
fn duplicate_guess_rejected() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "sober"));

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "sober")),
        Err(Ok(Error::AlreadyGuessed))
    );
}

#[test]
fn guess_after_win_rejected() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane"));

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "sober")),
        Err(Ok(Error::GameFinished))
    );
}

#[test]
fn guess_limit_reached_on_loss() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);

    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&alice, &s(&env, g));
    }

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "sugar")),
        Err(Ok(Error::GameFinished))
    );
    let game = client.get_player_game(&alice).unwrap();
    assert_eq!(game.status, STATUS_LOST);
    assert_eq!(game.guesses.len(), 6);
}

// ---------------------------------------------------------------------------
// Feedback correctness (ADR-003)
// ---------------------------------------------------------------------------

#[test]
fn evaluate_exact_match_all_green() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "crane"));
    assert_eq!(
        client.evaluate(&s(&env, "crane")),
        vec![&env, GREEN, GREEN, GREEN, GREEN, GREEN]
    );
}

#[test]
fn evaluate_apple_vs_april() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "apple"));
    // a green, p green, r gray, i gray, l yellow
    assert_eq!(
        client.evaluate(&s(&env, "april")),
        vec![&env, GREEN, GREEN, GRAY, GRAY, YELLOW]
    );
}

#[test]
fn evaluate_double_letter_handling() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "eerie"));
    // e green, a gray, g gray, l gray, e green
    assert_eq!(
        client.evaluate(&s(&env, "eagle")),
        vec![&env, GREEN, GRAY, GRAY, GRAY, GREEN]
    );
}

#[test]
fn evaluate_double_letter_count_limited() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "apple"));
    // answer = a,p,p,l,e; guess = p,u,p,p,y
    // Green pass: p[2]==p[2] → GREEN. Remaining: a(1),p(1),l(1),e(1)
    // Yellow pass: p[0] → remaining[p]=1 → YELLOW, remaining[p]=0;
    //              u → no; p[3] → remaining[p]=0 → GRAY; y → no
    assert_eq!(
        client.evaluate(&s(&env, "puppy")),
        vec![&env, YELLOW, GRAY, GREEN, GRAY, GRAY]
    );
}

// ---------------------------------------------------------------------------
// Hashing: word is NOT exposed, only hash is public
// ---------------------------------------------------------------------------

#[test]
fn word_hash_is_deterministic() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "crane"));
    let hash1 = client.get_word_hash();

    // Same word should produce same hash
    client.set_word(&s(&env, "crane"));
    let hash2 = client.get_word_hash();
    assert_eq!(hash1, hash2);
}

#[test]
fn different_words_produce_different_hashes() {
    let (env, client, _, _, _) = setup();
    client.set_word(&s(&env, "crane"));
    let hash1 = client.get_word_hash();

    client.set_word(&s(&env, "space"));
    let hash2 = client.get_word_hash();
    assert_ne!(hash1, hash2);
}

// ---------------------------------------------------------------------------
// Stats, streaks, leaderboard
// ---------------------------------------------------------------------------

#[test]
fn win_updates_stats_and_distribution() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);

    client.submit_guess(&alice, &s(&env, "sober"));
    client.submit_guess(&alice, &s(&env, "crane"));

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.games_played, 1);
    assert_eq!(stats.games_won, 1);
    assert_eq!(stats.current_streak, 1);
    assert_eq!(stats.max_streak, 1);
    assert_eq!(stats.guess_distribution, vec![&env, 0, 1, 0, 0, 0, 0]);

    let game = client.get_player_game(&alice).unwrap();
    assert_eq!(game.status, STATUS_WON);
    assert_eq!(game.guesses.len(), 2);
    assert_eq!(
        game.last_feedback,
        vec![&env, GREEN, GREEN, GREEN, GREEN, GREEN]
    );
}

#[test]
fn loss_resets_streak_and_counts_play() {
    let (env, client, _, alice, _) = setup();
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&alice, &s(&env, g));
    }

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.games_played, 1);
    assert_eq!(stats.games_won, 0);
    assert_eq!(stats.current_streak, 0);
    assert_eq!(stats.max_streak, 0);
}

#[test]
fn streak_tracks_across_days() {
    let (env, client, _, alice, _) = setup();

    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane")); // day 1: win

    client.set_word(&s(&env, "space"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "space")); // day 2: win

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.games_won, 2);
    assert_eq!(stats.current_streak, 2);
    assert_eq!(stats.max_streak, 2);

    client.set_word(&s(&env, "apple"));
    client.start_game(&alice);
    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&alice, &s(&env, g)); // day 3: loss
    }

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.games_played, 3);
    assert_eq!(stats.current_streak, 0);
    assert_eq!(stats.max_streak, 2);

    client.set_word(&s(&env, "grain"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "grain")); // day 4: win

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.current_streak, 1);
    assert_eq!(stats.max_streak, 2);
}

#[test]
fn leaderboard_orders_by_wins_then_streak() {
    let (env, client, _, alice, bob) = setup();

    // day 1: alice wins, bob wins
    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane"));
    client.start_game(&bob);
    client.submit_guess(&bob, &s(&env, "crane"));

    // day 2: alice wins again, bob loses
    client.set_word(&s(&env, "space"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "space"));
    client.start_game(&bob);
    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&bob, &s(&env, g));
    }

    let leaderboard = client.get_leaderboard();
    assert_eq!(leaderboard.len(), 2);
    let first = leaderboard.get(0).unwrap();
    let second = leaderboard.get(1).unwrap();
    assert_eq!(first.player, alice);
    assert_eq!(first.wins, 2);
    assert_eq!(first.streak, 2);
    assert_eq!(second.player, bob);
    assert_eq!(second.wins, 1);
    assert_eq!(second.streak, 1); // streak=1 from day 1 win; leaderboard only updates on win
}

#[test]
fn leaderboard_updates_existing_entry() {
    let (env, client, _, alice, _) = setup();

    client.set_word(&s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane"));

    client.set_word(&s(&env, "space"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "space"));

    let leaderboard = client.get_leaderboard();
    assert_eq!(leaderboard.len(), 1);
    let entry = leaderboard.get(0).unwrap();
    assert_eq!(entry.player, alice);
    assert_eq!(entry.wins, 2);
    assert_eq!(entry.streak, 2);
}
