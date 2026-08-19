#![cfg(test)]
extern crate std;
use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events},
    vec, Address, Env, String, Symbol,
};

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
    let (env, client, admin, _, _) = setup();
    assert_eq!(client.get_day(), 0);
    assert!(client.get_word().is_err());

    let day = client.set_word(&admin, &s(&env, "crane"));
    assert_eq!(day, 1);
    assert_eq!(client.get_word().unwrap(), s(&env, "crane"));
    assert_eq!(client.get_day(), 1);

    let day = client.set_word(&admin, &s(&env, "space"));
    assert_eq!(day, 2);
    assert_eq!(client.get_word().unwrap(), s(&env, "space"));
}

#[test]
fn set_word_rejects_invalid_words() {
    let (env, client, admin, _, _) = setup();
    for bad in ["cran", "cranes", "CRANE", "cra1e", "cra ne"] {
        assert_eq!(
            client.try_set_word(&admin, &s(&env, bad)),
            Err(Ok(Error::WordInvalid)),
            "word {:?} should be rejected",
            bad
        );
    }
}

#[test]
fn set_word_requires_admin_auth() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let contract_id = env.register(Wordle, (&admin,));
    let client = WordleClient::new(&env, &contract_id);

    env.set_auths(&[attacker.require_auth_for(&attacker)]);
    assert!(client.try_set_word(&admin, &s(&env, "crane")).is_err());
}

#[test]
fn word_set_event_published() {
    let (env, client, admin, _, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));

    let events = env.events().all();
    let (contract, symbol, _) = &events[0];
    assert_eq!(contract, client.address);
    assert_eq!(symbol, &Symbol::new(&env, "WordSet"));
}

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------

#[test]
fn start_game_requires_word() {
    let (env, client, _, alice, _) = setup();
    assert_eq!(
        client.try_start_game(&alice),
        Err(Ok(Error::WordNotSet))
    );
}

#[test]
fn start_game_is_idempotent_for_the_day() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));

    assert_eq!(client.start_game(&alice), 1);
    let game = client.get_player_game(&alice).unwrap();
    assert_eq!(game.day, 1);
    assert_eq!(game.guesses.len(), 0);
    assert_eq!(game.status, STATUS_ACTIVE);

    assert_eq!(client.start_game(&alice), 1);
    assert_eq!(client.get_player_game(&alice).unwrap().guesses.len(), 0);
}

#[test]
fn start_game_rotates_with_new_word() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.set_word(&admin, &s(&env, "space"));

    assert_eq!(client.start_game(&alice), 2);
    let game = client.get_player_game(&alice).unwrap();
    assert_eq!(game.day, 2);
    assert_eq!(game.guesses.len(), 0);
}

#[test]
fn submit_before_start_rejected() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "crane")),
        Err(Ok(Error::GameNotStarted))
    );
}

#[test]
fn stale_day_requires_restart() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "sober"));
    client.set_word(&admin, &s(&env, "space"));

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "space")),
        Err(Ok(Error::GameNotStarted))
    );
}

#[test]
fn invalid_guesses_rejected() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);

    for bad in ["crn", "cranes", "CRANE", "cr4ne", "crane!"] {
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
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "sober"));

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "sober")),
        Err(Ok(Error::AlreadyGuessed))
    );
}

#[test]
fn guess_after_win_rejected() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane"));

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "sober")),
        Err(Ok(Error::GameFinished))
    );
}

#[test]
fn guess_limit_reached_on_loss() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);

    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&alice, &s(&env, g));
    }

    assert_eq!(
        client.try_submit_guess(&alice, &s(&env, "sugar")),
        Err(Ok(Error::GuessLimitReached))
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
    let (env, client, admin, _, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    assert_eq!(
        client.evaluate(&s(&env, "crane")),
        vec![&env, GREEN, GREEN, GREEN, GREEN, GREEN]
    );
}

#[test]
fn evaluate_apple_vs_april() {
    let (env, client, admin, _, _) = setup();
    client.set_word(&admin, &s(&env, "apple"));
    // a green, p green, r gray, i gray, l yellow
    assert_eq!(
        client.evaluate(&s(&env, "april")),
        vec![&env, GREEN, GREEN, GRAY, GRAY, YELLOW]
    );
}

#[test]
fn evaluate_double_letter_handling() {
    let (env, client, admin, _, _) = setup();
    client.set_word(&admin, &s(&env, "eerie"));
    // e green, a gray, g gray, l gray, e green — the second 'e' in guess is green
    assert_eq!(
        client.evaluate(&s(&env, "eagle")),
        vec![&env, GREEN, GRAY, GRAY, GRAY, GREEN]
    );
}

#[test]
fn evaluate_double_letter_count_limited() {
    let (env, client, admin, _, _) = setup();
    client.set_word(&admin, &s(&env, "apple"));
    // answer has one 'p'; guess "puppy": p,y? — p yellow (misplaced, only one),
    // second p gray (count exhausted), u gray, p gray, y gray
    assert_eq!(
        client.evaluate(&s(&env, "puppy")),
        vec![&env, YELLOW, GRAY, GRAY, GRAY, GRAY]
    );
}

// ---------------------------------------------------------------------------
// Stats, streaks, leaderboard
// ---------------------------------------------------------------------------

#[test]
fn win_updates_stats_and_distribution() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
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
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
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
    let (env, client, admin, alice, _) = setup();

    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane")); // day 1: win

    client.set_word(&admin, &s(&env, "space"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "space")); // day 2: win

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.games_won, 2);
    assert_eq!(stats.current_streak, 2);
    assert_eq!(stats.max_streak, 2);

    client.set_word(&admin, &s(&env, "apple"));
    client.start_game(&alice);
    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&alice, &s(&env, g)); // day 3: loss
    }

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.games_played, 3);
    assert_eq!(stats.current_streak, 0);
    assert_eq!(stats.max_streak, 2);

    client.set_word(&admin, &s(&env, "grain"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "grain")); // day 4: win

    let stats = client.get_player_stats(&alice);
    assert_eq!(stats.current_streak, 1);
    assert_eq!(stats.max_streak, 2);
}

#[test]
fn leaderboard_orders_by_wins_then_streak() {
    let (env, client, admin, alice, bob, _) = setup();

    // day 1: alice wins, bob wins
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane"));
    client.start_game(&bob);
    client.submit_guess(&bob, &s(&env, "crane"));

    // day 2: alice wins again, bob loses
    client.set_word(&admin, &s(&env, "space"));
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
    assert_eq!(second.streak, 0);
}

#[test]
fn leaderboard_updates_existing_entry() {
    let (env, client, admin, alice, _) = setup();

    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "crane"));

    client.set_word(&admin, &s(&env, "space"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "space"));

    let leaderboard = client.get_leaderboard();
    assert_eq!(leaderboard.len(), 1);
    let entry = leaderboard.get(0).unwrap();
    assert_eq!(entry.player, alice);
    assert_eq!(entry.wins, 2);
    assert_eq!(entry.streak, 2);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[test]
fn game_events_published() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    client.submit_guess(&alice, &s(&env, "sober"));
    client.submit_guess(&alice, &s(&env, "crane"));

    let events = env.events().all();
    let symbols: Vec<Symbol> = events
        .iter()
        .map(|(_, s, _)| s)
        .collect();

    assert!(symbols.contains(&Symbol::new(&env, "WordSet")));
    assert!(symbols.contains(&Symbol::new(&env, "GameStarted")));
    assert!(symbols.contains(&Symbol::new(&env, "GuessMade")));
    assert!(symbols.contains(&Symbol::new(&env, "GameWon")));
}

#[test]
fn lost_game_reveals_word_event() {
    let (env, client, admin, alice, _) = setup();
    client.set_word(&admin, &s(&env, "crane"));
    client.start_game(&alice);
    for g in ["sober", "limit", "hasty", "world", "grown", "tiger"] {
        client.submit_guess(&alice, &s(&env, g));
    }

    let events = env.events().all();
    let symbols: Vec<Symbol> = events.iter().map(|(_, s, _)| s).collect();
    assert!(symbols.contains(&Symbol::new(&env, "GameLost")));
}