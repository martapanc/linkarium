"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { parseCitations } from "@/lib/citation-parser";
import type { PaperInput } from "@/lib/types";
import { FormToolbar } from "../ui/FormToolbar";

interface Props {
  onSubmit: (papers: PaperInput[]) => Promise<void>;
  onCancel: () => void;
  isAdding: boolean;
}

export function BatchCitationForm({ onSubmit, onCancel, isAdding }: Props) {
  const t = useTranslations("addLinks");
  const [batchText, setBatchText] = useState("");
  const [parsedCount, setParsedCount] = useState(0);

  function handleTextChange(value: string) {
    setBatchText(value);
    setParsedCount(parseCitations(value).length);
  }

  async function handleSubmit() {
    const papers = parseCitations(batchText);
    if (!papers.length) return;
    await onSubmit(papers);
    setBatchText("");
    setParsedCount(0);
  }

  return (
    <div className="px-5 pt-4 pb-2">
      <p className="text-xs text-sand-600 mb-3 leading-relaxed">
        {t("batchFormat")}
        <br />
        <span className="font-mono text-sand-700">{t("batchFormatExample")}</span>
      </p>
      <textarea
        autoFocus
        placeholder={
          "[Archer 1999] John Archer, _Assessment of the Reliability of the Conflict Tactics Scales_, Journal of Interpersonal Violence, 1999: https://example.com/paper.pdf\n\n[Smith et al. 2020] Jane Smith, Bob Lee, _Title of the Paper_, Nature, 2020: https://doi.org/10.1234/example"
        }
        value={batchText}
        onChange={(e) => handleTextChange(e.target.value)}
        rows={8}
        className="w-full text-sm text-sand-800 placeholder:text-sand-300 font-mono border border-sand-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-coral-300"
      />
      {batchText.trim() && (
        <p className={clsx("text-xs mt-1.5", parsedCount > 0 ? "text-coral-500" : "text-amber-500")}>
          {parsedCount > 0
            ? t("citationsDetected", { count: parsedCount })
            : t("noCitationsRecognised")}
        </p>
      )}

      <FormToolbar
        onCancel={onCancel}
        cancelLabel={t("cancel")}
        onSubmit={handleSubmit}
        submitLabel={t("addPapers", { count: parsedCount })}
        loadingLabel={t("saving")}
        isLoading={isAdding}
        disabled={parsedCount === 0}
      />
    </div>
  );
}
