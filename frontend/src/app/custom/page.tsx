"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { toast } from "sonner";

export default function CustomPage() {
  const [word, setWord] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isValid = /^[a-zA-Z]{5}$/.test(word);

  const generateLink = () => {
    if (!isValid) {
      toast.error("Enter a valid 5-letter word");
      return;
    }

    // Encode the word in base64 to obscure it in the URL
    const encoded = btoa(word.toLowerCase());
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${baseUrl}/play?mode=custom&word=${encoded}`;
    setGeneratedLink(link);
    setCopied(false);
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="starfield" />
      <Header />

      <main className="flex-1 px-4 py-12 max-w-xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3 tracking-tight">
            Create a Wordle
          </h1>
          <p className="text-[var(--color-muted)] max-w-md mx-auto font-light text-sm">
            Pick a 5-letter word, generate a link, and challenge your friends.
            They won&apos;t see the answer — only the puzzle.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-bright rounded-2xl p-8"
        >
          {/* Word input */}
          <div className="mb-6">
            <label className="block text-xs text-[var(--color-muted)] uppercase tracking-wider mb-2 font-medium">
              Your secret word
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 sm:w-16 sm:h-16 border-2 rounded-xl flex items-center justify-center text-2xl font-bold uppercase transition-all ${
                    word[i]
                      ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-white"
                      : "border-[var(--color-border)] bg-transparent text-[var(--color-muted)]"
                  }`}
                >
                  {word[i] || ""}
                </div>
              ))}
            </div>
            <input
              type="text"
              value={word}
              onChange={(e) => {
                const v = e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5);
                setWord(v);
                setGeneratedLink(null);
              }}
              placeholder="Type a 5-letter word..."
              maxLength={5}
              className="mt-4 w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)]/50 focus:border-[var(--color-primary)] focus:outline-none transition-colors text-center text-lg tracking-widest uppercase font-mono"
              autoFocus
            />
            <p className="text-xs text-[var(--color-muted)] mt-2 text-center">
              {word.length}/5 letters {isValid && "✓"}
            </p>
          </div>

          {/* Generate button */}
          <button
            onClick={generateLink}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed glow-pulse"
          >
            Generate Challenge Link
          </button>

          {/* Generated link */}
          {generatedLink && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-[var(--color-muted)] mb-2">Share this link:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-2 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap font-mono">
                    {generatedLink}
                  </code>
                  <button
                    onClick={copyLink}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                      copied
                        ? "bg-[var(--color-green)]/20 text-[var(--color-green)] border border-[var(--color-green)]/30"
                        : "bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-[var(--color-foreground)] border border-[var(--color-border)]"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-[var(--color-muted)] text-center">
                The word is encoded (not plaintext) in the URL — your friend won&apos;t easily see it.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid grid-cols-3 gap-4 text-center"
        >
          {[
            { step: "1", title: "Pick a word", desc: "Any 5-letter English word" },
            { step: "2", title: "Share the link", desc: "Send it to a friend" },
            { step: "3", title: "They solve it", desc: "Same Wordle, your word" },
          ].map((item) => (
            <div key={item.step} className="glass rounded-xl p-4">
              <div className="text-lg font-bold gradient-text-static mb-1">{item.step}</div>
              <p className="text-xs font-medium text-[var(--color-foreground)]">{item.title}</p>
              <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
