"use client";

import { useState } from "react";

interface Props {
  onAdd: (rawText: string) => Promise<void>;
  isAdding: boolean;
}

export function AddLinksForm({ onAdd, isAdding }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");

  async function handleSubmit() {
    if (!text.trim()) return;
    await onAdd(text);
    setText("");
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="
          w-full border-2 border-dashed border-sand-200 rounded-xl
          py-4 px-5
          text-sand-400 hover:text-coral-500 hover:border-coral-300
          transition-all duration-200
          flex items-center justify-center gap-2
          text-sm font-medium
          cursor-pointer
        "
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add links
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-sand-200 overflow-hidden shadow-sm">
      <textarea
        autoFocus
        placeholder="Paste URLs here — one per line or mixed in with text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full px-5 py-4 text-sm text-sand-800 placeholder:text-sand-300 font-mono resize-none focus:outline-none bg-transparent"
      />
      <div className="border-t border-sand-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={() => {
            setIsOpen(false);
            setText("");
          }}
          className="text-sm text-sand-400 hover:text-sand-600 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isAdding || !text.trim()}
          className="
            bg-coral-500 hover:bg-coral-600 text-white
            text-sm font-medium px-5 py-2 rounded-lg
            transition-colors duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
          "
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Scraping…
            </span>
          ) : (
            "Add links"
          )}
        </button>
      </div>
    </div>
  );
}
