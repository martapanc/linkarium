"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { parseCitations, looksLikeCitations } from "@/lib/citation-parser";
import type { PaperInput } from "@/lib/types";
import { SpinnerIcon } from "../ui/SpinnerIcon";
import { AddPaperPanel } from "./AddPaperPanel";

interface Props {
  onAdd: (rawText: string) => Promise<void>;
  onAddPaper: (paper: PaperInput) => Promise<void>;
  onAddPapers: (papers: PaperInput[]) => Promise<void>;
  isAdding: boolean;
}

type Mode = "closed" | "links" | "paper";

export function AddLinksForm({ onAdd, onAddPaper, onAddPapers, isAdding }: Props) {
  const t = useTranslations("addLinks");
  const [mode, setMode] = useState<Mode>("closed");
  const [text, setText] = useState("");

  function close() {
    setMode("closed");
    setText("");
  }

  async function handleAddLinks() {
    if (!text.trim()) return;
    if (looksLikeCitations(text)) {
      const papers = parseCitations(text);
      if (papers.length) {
        await onAddPapers(papers);
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
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full px-5 py-4 text-sm text-sand-800 placeholder:text-sand-300 font-mono resize-none focus:outline-none bg-transparent"
        />
        <div className="border-t border-sand-100 px-5 py-3 flex items-center justify-between">
          <button onClick={close} className="text-sm text-sand-600 hover:text-sand-800 transition-colors cursor-pointer">
            {t("cancel")}
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
