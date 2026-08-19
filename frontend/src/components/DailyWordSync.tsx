"use client";

import { useEffect, useRef } from "react";

/**
 * Invisible component that ensures today's word is set on-chain
 * when the frontend first loads. Calls the server-side API route
 * which uses the deployer key to set_word if needed.
 * 
 * Only fires once per session.
 */
export function DailyWordSync() {
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Fire and forget — don't block the UI
    fetch("/api/set-daily-word")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "set") {
          console.log(`[Wordle] Daily word set: day ${data.dayNumber}`);
        }
      })
      .catch(() => {
        // Silent fail — word might already be set
      });
  }, []);

  return null;
}
