"use client";

import { useState } from "react";
import { useWriteToken } from "@/lib/useWriteToken";

interface Props {
  /** Called after the user successfully unlocks. Pass a function that verifies the token. */
  onUnlock?: () => void;
}

export function WriteGuard({ onUnlock }: Props) {
  const { token, ready, save, clear } = useWriteToken();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  if (!ready) return null;

  const unlocked = !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setIsVerifying(true);
    setError("");

    // Probe a write endpoint with the candidate token to verify it server-side
    const res = await fetch("/api/auth/verify-write-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-write-token": input.trim(),
      },
    });

    setIsVerifying(false);

    if (res.ok) {
      save(input.trim());
      setOpen(false);
      setInput("");
      onUnlock?.();
    } else {
      setError("Wrong passphrase.");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (unlocked) {
            clear();
          } else {
            setOpen((o) => !o);
            setError("");
          }
        }}
        title={unlocked ? "Click to lock" : "Enter passphrase to edit"}
        className="flex items-center gap-1.5 text-xs text-sand-400 hover:text-sand-600 transition-colors cursor-pointer"
      >
        {unlocked ? (
          <svg className="w-4 h-4 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 11V7a2 2 0 114 0v4" />
          </svg>
        )}
      </button>

      {open && !unlocked && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="absolute right-0 top-8 z-50 bg-white rounded-xl border border-sand-200 shadow-lg p-4 w-64"
          >
            <p className="text-xs font-medium text-sand-700 mb-2">Enter passphrase</p>
            <input
              autoFocus
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              placeholder="••••••••"
              className="w-full text-sm border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300 mb-2"
            />
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <button
              type="submit"
              disabled={isVerifying || !input.trim()}
              className="w-full bg-coral-500 hover:bg-coral-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? "Checking…" : "Unlock"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
