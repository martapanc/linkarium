"use client";

import { useState } from "react";
import clsx from "clsx";
import type { DbLink } from "@/lib/types";

interface EditPayload {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  citation_authors?: string | null;
  citation_year?: number | null;
  citation_venue?: string | null;
}

interface Props {
  link: DbLink;
  onSave: (payload: EditPayload) => Promise<void>;
  onCancel: () => void;
  labels: {
    save: string;
    cancel: string;
    saving: string;
    titleField: string;
    descriptionField: string;
    urlField: string;
    authorsField: string;
    yearField: string;
    venueField: string;
  };
}

const inputClass =
  "w-full text-xs sm:text-sm text-sand-800 bg-sand-50 border border-sand-200 rounded px-2 py-1.5 focus:outline-none focus:border-coral-300 placeholder:text-sand-300";

export function LinkEditForm({ link, onSave, onCancel, labels }: Props) {
  const isPaper = link.link_type === "paper";
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState(link.title ?? "");
  const [description, setDescription] = useState(link.description ?? "");
  const [url, setUrl] = useState(link.url ?? "");
  const [authors, setAuthors] = useState(link.citation_authors ?? "");
  const [year, setYear] = useState(link.citation_year?.toString() ?? "");
  const [venue, setVenue] = useState(link.citation_venue ?? "");

  async function handleSave() {
    setIsSaving(true);
    const payload: EditPayload = {
      title: title.trim() || null,
      description: description.trim() || null,
      url: url.trim() || null,
    };
    if (isPaper) {
      payload.citation_authors = authors.trim() || null;
      payload.citation_year = year.trim() ? parseInt(year.trim(), 10) : null;
      payload.citation_venue = venue.trim() || null;
    }
    await onSave(payload);
    setIsSaving(false);
  }

  return (
    <div className="flex-1 min-w-0 p-3 space-y-2">
      <div className="grid grid-cols-1 gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={labels.titleField}
          className={inputClass}
        />

        {isPaper && (
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder={labels.authorsField}
              className={inputClass}
            />
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder={labels.yearField}
              className={clsx(inputClass, "w-20")}
              min={1000}
              max={9999}
            />
          </div>
        )}

        {isPaper && (
          <input
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder={labels.venueField}
            className={inputClass}
          />
        )}

        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={labels.urlField}
          className={inputClass}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={labels.descriptionField}
          rows={2}
          className={clsx(inputClass, "resize-none")}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="text-xs text-sand-600 hover:text-sand-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          {labels.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={clsx(
            "text-xs font-medium px-3 py-1.5 rounded-md transition-colors cursor-pointer",
            "bg-coral-500 hover:bg-coral-600 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isSaving ? labels.saving : labels.save}
        </button>
      </div>
    </div>
  );
}
