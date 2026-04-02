"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const urls = rawText
        .split(/[\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "My Links",
          urls: urls.length > 0 ? urls : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create list");

      const { list } = await res.json();
      router.push(`/${list.id}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-sand-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-display text-2xl text-sand-900 tracking-tight">
            LinkDrop
          </span>
          <a
            href="https://github.com/your-repo/linkdrop"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sand-500 hover:text-sand-700 transition-colors"
          >
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-24 md:pt-24">
        <div className="max-w-2xl w-full text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-sand-900 mb-4 tracking-tight leading-tight">
            Drop your links.
            <br />
            <span className="text-coral-500 italic">Share the list.</span>
          </h1>
          <p className="text-lg text-sand-500 max-w-md mx-auto">
            Paste a bunch of URLs, get a clean shareable page with previews.
            No signup needed.
          </p>
        </div>

        {/* Create form */}
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl border border-sand-200 shadow-sm overflow-hidden">
            {/* Title input */}
            <div className="border-b border-sand-100 px-5 py-3">
              <input
                type="text"
                placeholder="List title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-medium text-sand-900 placeholder:text-sand-300 focus:outline-none"
                maxLength={100}
              />
            </div>

            {/* URL textarea */}
            <div className="px-5 py-4">
              <textarea
                placeholder={"Paste your links here — one per line, or just a block of text with URLs mixed in...\n\nhttps://example.com\nhttps://github.com/cool-project\nhttps://dev.to/interesting-article"}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                className="w-full bg-transparent text-sand-800 placeholder:text-sand-300 text-[15px] leading-relaxed resize-none focus:outline-none font-mono"
              />
            </div>

            {/* Actions */}
            <div className="border-t border-sand-100 px-5 py-4 flex items-center justify-between">
              <span className="text-xs text-sand-400">
                {rawText.trim()
                  ? `~${rawText.split(/https?:\/\//).length - 1} link(s) detected`
                  : "You can also add links later"}
              </span>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="
                  bg-coral-500 hover:bg-coral-600 active:bg-coral-600
                  text-white font-medium text-sm
                  px-6 py-2.5 rounded-xl
                  transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer
                "
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating…
                  </span>
                ) : (
                  "Create list"
                )}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                step: "1",
                title: "Paste links",
                desc: "Drop in URLs one by one, or paste a whole block of text — we'll find them.",
              },
              {
                step: "2",
                title: "Get previews",
                desc: "Each link is scraped for its title, description, and image automatically.",
              },
              {
                step: "3",
                title: "Share the page",
                desc: "Copy your list's short URL and send it to anyone. They'll see a clean, searchable page.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-coral-500/10 text-coral-500 font-display text-xl mb-3">
                  {item.step}
                </div>
                <h3 className="font-display text-xl text-sand-800 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-sand-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-200 px-6 py-6 text-center text-xs text-sand-400">
        LinkDrop — open source link list sharing
      </footer>
    </div>
  );
}
