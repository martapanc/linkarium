"use client";

import clsx from "clsx";
import * as Tabs from "@radix-ui/react-tabs";
import { useTranslations } from "next-intl";
import type { PaperInput } from "@/lib/types";
import { ManualPaperForm } from "./ManualPaperForm";
import { BatchCitationForm } from "./BatchCitationForm";

interface Props {
  onAddPaper: (paper: PaperInput) => Promise<void>;
  onAddPapers: (papers: PaperInput[]) => Promise<void>;
  onCancel: () => void;
  isAdding: boolean;
}

export function AddPaperPanel({ onAddPaper, onAddPapers, onCancel, isAdding }: Props) {
  const t = useTranslations("addLinks");

  return (
    <Tabs.Root
      defaultValue="manual"
      className="bg-white rounded-lg border border-sand-200 overflow-hidden shadow-sm"
    >
      <Tabs.List className="flex border-b border-sand-100">
        {(["manual", "batch"] as const).map((tab) => (
          <Tabs.Trigger
            key={tab}
            value={tab}
            className={clsx(
              "flex-1 py-3 text-sm font-medium cursor-pointer focus-visible:outline-none",
              "text-sand-600 hover:text-sand-800 transition-colors",
              "data-[state=active]:text-coral-500 data-[state=active]:border-b-2",
              "data-[state=active]:border-coral-400 data-[state=active]:-mb-px"
            )}
          >
            {tab === "manual" ? t("tabSingle") : t("tabBatch")}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="manual">
        <ManualPaperForm onSubmit={onAddPaper} onCancel={onCancel} isAdding={isAdding} />
      </Tabs.Content>

      <Tabs.Content value="batch">
        <BatchCitationForm onSubmit={onAddPapers} onCancel={onCancel} isAdding={isAdding} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
