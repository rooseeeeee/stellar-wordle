export type KeyState = "unused" | "absent" | "present" | "correct";
export type GameStatus = "idle" | "loading" | "playing" | "won" | "lost";

export interface GameState {
  guesses: string[];
  feedbacks: number[][];
  won: boolean;
}

export interface GameMode {
  type: "daily" | "campaign";
  level?: number;
}
