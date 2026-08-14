"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { parseCitations, looksLikeCitations } from "@/lib/citation-parser";
import type { PaperInput, PreviewItem } from "@/lib/types";
import { SpinnerIcon } from "../ui/SpinnerIcon";
import { AddPaperPanel } from "./AddPaperPanel";
import { ParsePreviewPanel } from "./ParsePreviewPanel";

interface Props {
  onAdd: (rawText: string) => Promise<void>;
  onAddPaper: (paper: PaperInput) => Promise<void>;
  onAddPapers: (papers: PaperInput[]) => Promise<void>;
  onPreview: (rawText: string) => Promise<PreviewItem[]>;
  isAdding: boolean;
}

type Mode = "closed" | "links" | "paper";

export function AddLinksForm({ onAdd, onAddPaper, onAddPapers, onPreview, isAdding }: Props) {
  const t = useTranslations("addLinks");
  const [mode, setMode] = useState<Mode>("closed");
  const [text, setText] = useState("");
  const [previewItems, setPreviewItems] = useState<PreviewItem[] | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  function close() {
    setMode("closed");
    setText("");
    setPreviewItems(null);
  }

  async function handlePreview() {
    if (!text.trim()) return;
    setIsPreviewing(true);
    setPreviewItems(null);
    try {
      const items = await onPreview(text);
      setPreviewItems(items);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleAddLinks() {
    if (!text.trim()) return;
    if (looksLikeCitations(text)) {
      const papers = parseCitations(text);
      if (papers.length) {
        // Also collect any non-citation lines (plain URLs) so they aren't silently dropped
        const urlOnlyText = text
          .split(/\n+/)
          .filter(line => !line.trim().startsWith("["))
          .join("\n")
          .trim();
        await onAddPapers(papers);
        if (urlOnlyText) {
          await onAdd(urlOnlyText);
        }
        setText("");
        setMode("closed");
        return;
      }
    }
    await onAdd(text);
    setText("");
    setMode("closed");
  }

  if (mode === "closed") {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setMode("links")}
          className={clsx(
            "flex-1 flex items-center justify-center gap-2 py-4 px-5",
            "border-2 border-dashed border-sand-200 rounded-lg",
            "text-sm font-medium text-sand-600",
            "hover:text-coral-500 hover:border-coral-300 transition-all duration-200 cursor-pointer"
          )}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("addButton")}
        </button>
      </div>
    );
  }

  if (mode === "links") {
    return (
      <div className="bg-white rounded-lg border border-sand-200 overflow-hidden shadow-sm">
        <textarea
          autoFocus
          placeholder={t("textareaPlaceholder")}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreviewItems(null);
          }}
          rows={4}
          className="w-full px-5 py-4 text-sm text-sand-800 placeholder:text-sand-300 font-mono resize-none focus:outline-none bg-transparent"
        />

        {previewItems !== null && (
          <div className="border-t border-sand-100">
            <ParsePreviewPanel items={previewItems} />
          </div>
        )}

        <div className="border-t border-sand-100 px-5 py-3 flex items-center justify-between gap-3">
          <button onClick={close} className="text-sm text-sand-600 hover:text-sand-800 transition-colors cursor-pointer">
            {t("cancel")}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              disabled={isPreviewing || isAdding || !text.trim()}
              className={clsx(
                "text-sm font-medium px-4 py-2 rounded-lg border border-sand-200 text-sand-600",
                "hover:border-coral-300 hover:text-coral-600 transition-colors cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isPreviewing ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon /> {t("previewing")}
                </span>
              ) : (
                t("previewButton")
              )}
            </button>
            <button
              onClick={handleAddLinks}
              disabled={isAdding || !text.trim()}
              className={clsx(
                "bg-coral-500 hover:bg-coral-600 text-white",
                "text-sm font-medium px-5 py-2 rounded-lg",
                "transition-colors duration-150 cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <SpinnerIcon /> {t("scraping")}
                </span>
              ) : (
                t("addLinks")
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AddPaperPanel
      onAddPaper={onAddPaper}
      onAddPapers={onAddPapers}
      onCancel={close}
      isAdding={isAdding}
    />
  );
}
