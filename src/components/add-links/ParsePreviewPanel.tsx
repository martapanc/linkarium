"use client";

import { useTranslations } from "next-intl";
import type { PreviewItem } from "@/lib/types";

interface Props {
  items: PreviewItem[];
}

export function ParsePreviewPanel({ items }: Props) {
  const t = useTranslations("addLinks");

  if (items.length === 0) {
    return <p className="text-xs text-sand-600 px-5 py-3">{t("previewEmpty")}</p>;
  }

  return (
    <ul className="divide-y divide-sand-100 max-h-72 overflow-y-auto">
      {items.map((item, i) => (
        <li key={`${item.url}-${i}`} className="px-5 py-2.5 flex items-start gap-3">
          <span
            className={
              "shrink-0 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded " +
              (item.type === "reference"
                ? "bg-coral-500/10 text-coral-600"
                : "bg-sand-100 text-sand-600")
            }
          >
            {item.type === "reference" ? t("previewReferenceBadge") : t("previewUrlBadge")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-sand-900 leading-snug truncate">
              {item.title || item.url}
            </p>
            {item.type === "reference" ? (
              <p className="text-xs text-sand-600 mt-0.5">
                {[item.citation_authors, item.citation_year].filter(Boolean).join(" · ") || (
                  <span className="italic">{t("previewNoAuthorsYear")}</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-sand-600 mt-0.5 truncate">
                {[item.author, item.domain || item.url].filter(Boolean).join(" · ")}
                {item.scrapeFailed && (
                  <span className="text-amber-600 ms-2">{t("previewScrapeFailed")}</span>
                )}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
