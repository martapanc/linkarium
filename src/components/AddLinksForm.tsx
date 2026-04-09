"use client";

import { useState } from "react";
import { resolveDoi, isDoiPattern } from "@/lib/doi-resolver";
import { parseCitations, looksLikeCitations } from "@/lib/citation-parser";
import type { PaperInput } from "@/lib/types";

interface Props {
  onAdd: (rawText: string) => Promise<void>;
  onAddPaper: (paper: PaperInput) => Promise<void>;
  onAddPapers: (papers: PaperInput[]) => Promise<void>;
  isAdding: boolean;
}

type Mode = "closed" | "links" | "paper";

export function AddLinksForm({ onAdd, onAddPaper, onAddPapers, isAdding }: Props) {
  const [mode, setMode] = useState<Mode>("closed");
  const [text, setText] = useState("");
  const [paperTab, setPaperTab] = useState<"manual" | "batch">("manual");
  const [batchText, setBatchText] = useState("");
  const [parsedCount, setParsedCount] = useState(0);

  // Paper form state
  const [doi, setDoi] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  function resetPaperForm() {
    setDoi("");
    setPaperTitle("");
    setAuthors("");
    setYear("");
    setVenue("");
    setNotes("");
    setPdfUrl("");
    setResolveError("");
  }

  function close() {
    setMode("closed");
    setText("");
    setBatchText("");
    setParsedCount(0);
    setPaperTab("manual");
    resetPaperForm();
  }

  function handleBatchTextChange(value: string) {
    setBatchText(value);
    setParsedCount(parseCitations(value).length);
  }

  async function handleAddBatch() {
    const papers = parseCitations(batchText);
    if (!papers.length) return;
    await onAddPapers(papers);
    setBatchText("");
    setParsedCount(0);
    setMode("closed");
  }

  async function handleAddLinks() {
    if (!text.trim()) return;
    await onAdd(text);
    setText("");
    setMode("closed");
  }

  async function handleLookupDoi() {
    const input = doi.trim();
    if (!input) return;

    if (!isDoiPattern(input)) {
      setResolveError("Doesn't look like a valid DOI. Example: 10.1145/3290605.3300756");
      return;
    }

    setIsResolving(true);
    setResolveError("");

    const result = await resolveDoi(input);
    setIsResolving(false);

    if (!result) {
      setResolveError("DOI not found. You can still fill in the fields manually.");
      return;
    }

    setPaperTitle(result.title);
    setAuthors(result.authors);
    setYear(result.year ? String(result.year) : "");
    setVenue(result.venue ?? "");
    setPdfUrl(result.pdf_url ?? "");
  }

  async function handleAddPaper() {
    if (!paperTitle.trim()) return;

    const paper: PaperInput = {
      title: paperTitle.trim(),
      doi: doi.trim() || undefined,
      citation_authors: authors.trim() || undefined,
      citation_year: year ? parseInt(year, 10) : undefined,
      citation_venue: venue.trim() || undefined,
      description: notes.trim() || undefined,
      pdf_url: pdfUrl.trim() || undefined,
    };

    await onAddPaper(paper);
    resetPaperForm();
    setMode("closed");
  }

  if (mode === "closed") {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setMode("links")}
          className="
            flex-1 border-2 border-dashed border-sand-200 rounded-xl
            py-4 px-5
            text-sand-400 hover:text-coral-500 hover:border-coral-300
            transition-all duration-200
            flex items-center justify-center gap-2
            text-sm font-medium
            cursor-pointer
          "
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add links
        </button>
      </div>
    );
  }

  if (mode === "links") {
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
            onClick={close}
            className="text-sm text-sand-400 hover:text-sand-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleAddLinks}
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
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

  const spinnerIcon = (
    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  // mode === "paper"
  return (
    <div className="bg-white rounded-xl border border-sand-200 overflow-hidden shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-sand-100">
        {(["manual", "batch"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setPaperTab(tab)}
            className={`
              flex-1 py-3 text-sm font-medium transition-colors cursor-pointer
              ${paperTab === tab
                ? "text-coral-500 border-b-2 border-coral-400 -mb-px"
                : "text-sand-400 hover:text-sand-600"
              }
            `}
          >
            {tab === "manual" ? "Single paper" : "Paste citations"}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4 pb-2">
        {paperTab === "batch" ? (
          <>
            <p className="text-xs text-sand-400 mb-3 leading-relaxed">
              Paste citations in the format:
              <br />
              <span className="font-mono text-sand-500">
                [Key] Authors, _Title_, Journal / Venue, Year: URL
              </span>
            </p>
            <textarea
              autoFocus
              placeholder={
                "[Archer 1999] John Archer, _Assessment of the Reliability of the Conflict Tactics Scales_, Journal of Interpersonal Violence, 1999: https://example.com/paper.pdf\n\n[Smith et al. 2020] Jane Smith, Bob Lee, _Title of the Paper_, Nature, 2020: https://doi.org/10.1234/example"
              }
              value={batchText}
              onChange={(e) => handleBatchTextChange(e.target.value)}
              rows={8}
              className="w-full text-sm text-sand-800 placeholder:text-sand-300 font-mono border border-sand-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-coral-300"
            />
            {batchText.trim() && (
              <p className={`text-xs mt-1.5 ${parsedCount > 0 ? "text-coral-500" : "text-amber-500"}`}>
                {parsedCount > 0
                  ? `${parsedCount} citation${parsedCount !== 1 ? "s" : ""} detected`
                  : "No citations recognised — check the format"}
              </p>
            )}
          </>
        ) : (
          <>
            {/* DOI row */}
            <div className="flex gap-2 mb-4">
              <input
                autoFocus
                type="text"
                placeholder="DOI — e.g. 10.1145/3290605.3300756"
                value={doi}
                onChange={(e) => {
                  setDoi(e.target.value);
                  setResolveError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLookupDoi();
                }}
                className="flex-1 text-sm text-sand-800 placeholder:text-sand-300 font-mono border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300"
              />
              <button
                onClick={handleLookupDoi}
                disabled={isResolving || !doi.trim()}
                className="
                  text-sm font-medium px-4 py-2 rounded-lg
                  border border-sand-200 text-sand-600 hover:border-coral-300 hover:text-coral-600
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                  cursor-pointer shrink-0
                "
              >
                {isResolving ? spinnerIcon : "Look up"}
              </button>
            </div>

            {resolveError && (
              <p className="text-xs text-amber-600 mb-3">{resolveError}</p>
            )}

            <input
              type="text"
              placeholder="Title *"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              className="w-full text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 mb-2.5 focus:outline-none focus:border-coral-300"
            />

            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                placeholder="Authors"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="flex-1 text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300"
              />
              <input
                type="number"
                placeholder="Year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-24 text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300"
              />
            </div>

            <input
              type="text"
              placeholder="Journal / Conference"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 mb-2.5 focus:outline-none focus:border-coral-300"
            />

            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 mb-2.5 resize-none focus:outline-none focus:border-coral-300"
            />

            {/* PDF URL — auto-filled from OpenAlex, editable */}
            <div className="relative">
              <input
                type="url"
                placeholder="PDF URL (auto-filled if openly available)"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                className="w-full text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 pr-20 focus:outline-none focus:border-coral-300"
              />
              {pdfUrl && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
                  PDF
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-sand-100 px-5 py-3 flex items-center justify-between">
        <button
          onClick={close}
          className="text-sm text-sand-400 hover:text-sand-600 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        {paperTab === "batch" ? (
          <button
            onClick={handleAddBatch}
            disabled={isAdding || parsedCount === 0}
            className="
              bg-coral-500 hover:bg-coral-600 text-white
              text-sm font-medium px-5 py-2 rounded-lg
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            "
          >
            {isAdding ? (
              <span className="flex items-center gap-2">{spinnerIcon} Saving…</span>
            ) : (
              `Add ${parsedCount > 0 ? parsedCount : ""} paper${parsedCount !== 1 ? "s" : ""}`
            )}
          </button>
        ) : (
          <button
            onClick={handleAddPaper}
            disabled={isAdding || !paperTitle.trim()}
            className="
              bg-coral-500 hover:bg-coral-600 text-white
              text-sm font-medium px-5 py-2 rounded-lg
              transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            "
          >
            {isAdding ? (
              <span className="flex items-center gap-2">{spinnerIcon} Saving…</span>
            ) : (
              "Add paper"
            )}
          </button>
        )}
      </div>
    </div>
  );
}