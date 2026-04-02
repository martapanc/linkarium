"use client";

export function EmptyState() {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mb-5">
        <svg
          className="w-7 h-7 text-sand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.12 7.48l-3.5 3.5a4.5 4.5 0 01-6.364-6.364l1.591-1.591M10.82 15.312a4.5 4.5 0 01-1.12-7.48l3.5-3.5a4.5 4.5 0 016.364 6.364l-1.591 1.591"
          />
        </svg>
      </div>
      <h2 className="font-display text-2xl text-sand-700 mb-2">No links yet</h2>
      <p className="text-sm text-sand-400 max-w-xs">
        Click <span className="font-medium text-sand-500">"Add links"</span>{" "}
        above to start building your list. Paste individual URLs or a whole
        block of text — we&apos;ll find and scrape the links for you.
      </p>
    </div>
  );
}
