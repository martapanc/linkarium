"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { resolveDoi, isDoiPattern } from "@/lib/doi-resolver";
import type { PaperInput } from "@/lib/types";
import { SpinnerIcon } from "../ui/SpinnerIcon";
import { FormToolbar } from "../ui/FormToolbar";

interface Props {
  onSubmit: (paper: PaperInput) => Promise<void>;
  onCancel: () => void;
  isAdding: boolean;
}

export function ManualPaperForm({ onSubmit, onCancel, isAdding }: Props) {
  const t = useTranslations("addLinks");
  const [doi, setDoi] = useState("");
  const [paperTitle, setPaperTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  async function handleLookupDoi() {
    const input = doi.trim();
    if (!input) return;

    if (!isDoiPattern(input)) {
      setResolveError(t("invalidDoi"));
      return;
    }

    setIsResolving(true);
    setResolveError("");

    const result = await resolveDoi(input);
    setIsResolving(false);

    if (!result) {
      setResolveError(t("doiNotFound"));
      return;
    }

    setPaperTitle(result.title);
    setAuthors(result.authors);
    setYear(result.year ? String(result.year) : "");
    setVenue(result.venue ?? "");
    setPdfUrl(result.pdf_url ?? "");
  }

  async function handleSubmit() {
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

    await onSubmit(paper);
    setDoi("");
    setPaperTitle("");
    setAuthors("");
    setYear("");
    setVenue("");
    setNotes("");
    setPdfUrl("");
    setResolveError("");
  }

  const inputClass = "w-full text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300";

  return (
    <div className="px-5 pt-4 pb-2">
      <div className="flex gap-2 mb-4">
        <input
          autoFocus
          type="text"
          placeholder={t("doiPlaceholder")}
          value={doi}
          onChange={(e) => { setDoi(e.target.value); setResolveError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleLookupDoi(); }}
          className="flex-1 text-sm text-sand-800 placeholder:text-sand-300 font-mono border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300"
        />
        <button
          onClick={handleLookupDoi}
          disabled={isResolving || !doi.trim()}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-sand-200 text-sand-600 hover:border-coral-300 hover:text-coral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isResolving ? <SpinnerIcon /> : t("lookUp")}
        </button>
      </div>

      {resolveError && <p className="text-xs text-amber-600 mb-3">{resolveError}</p>}

      <input type="text" placeholder={t("titleField")} value={paperTitle} onChange={(e) => setPaperTitle(e.target.value)} className={`${inputClass} mb-2.5`} />
      <div className="flex gap-2 mb-2.5">
        <input type="text" placeholder={t("authorsField")} value={authors} onChange={(e) => setAuthors(e.target.value)} className="flex-1 text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300" />
        <input type="number" placeholder={t("yearField")} value={year} onChange={(e) => setYear(e.target.value)} className="w-24 text-sm text-sand-800 placeholder:text-sand-300 border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:border-coral-300" />
      </div>
      <input type="text" placeholder={t("venueField")} value={venue} onChange={(e) => setVenue(e.target.value)} className={`${inputClass} mb-2.5`} />
      <textarea placeholder={t("notesField")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} mb-2.5 resize-none`} />
      <div className="relative">
        <input type="url" placeholder={t("pdfUrlField")} value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className={`${inputClass} pr-20`} />
        {pdfUrl && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium">
            PDF
          </span>
        )}
      </div>

      <FormToolbar
        onCancel={onCancel}
        cancelLabel={t("cancel")}
        onSubmit={handleSubmit}
        submitLabel={t("addPaper")}
        loadingLabel={t("saving")}
        isLoading={isAdding}
        disabled={!paperTitle.trim()}
      />
    </div>
  );
}
