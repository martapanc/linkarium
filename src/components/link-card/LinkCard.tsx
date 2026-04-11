"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import type { DbLink } from "@/lib/types";
import { LinkCardThumbnail } from "./LinkCardThumbnail";
import { PaperCardContent } from "./PaperCardContent";
import { LinkCardContent } from "./LinkCardContent";
import { LinkCardActions } from "./LinkCardActions";

interface Props {
  link: DbLink;
  index: number;
  onDelete: (id: string) => void;
  onRescrape: (link: DbLink) => void;
  canWrite: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function LinkCard({ link, index, onDelete, onRescrape, canWrite, dragHandleProps }: Props) {
  const t = useTranslations("linkCard");
  const isPaper = link.link_type === "paper";

  const content = (
    <div className="flex items-center gap-2 p-1 sm:p-2 min-w-0">
      <LinkCardThumbnail
        isPaper={isPaper}
        url={link.url}
        image_url={link.image_url}
        favicon_url={link.favicon_url}
      />
      <div className="flex-1 min-w-0">
        {isPaper ? (
          <PaperCardContent
            title={link.title}
            url={link.url}
            citation_authors={link.citation_authors}
            citation_venue={link.citation_venue}
            citation_year={link.citation_year}
            doi={link.doi}
            pdf_url={link.pdf_url}
            noPublicLinkLabel={t("noPublicLink")}
          />
        ) : (
          <LinkCardContent title={link.title} url={link.url} domain={link.domain} />
        )}
      </div>
    </div>
  );

  return (
    <div
      className="animate-fade-up flex min-w-0 bg-white rounded-lg border border-sand-200 hover:border-sand-300 transition-all duration-200 hover:shadow-sm"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {link.url && isPaper ? (
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(link.url!, "_blank", "noopener,noreferrer")}>
          {content}
        </div>
      ) : link.url ? (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
          {content}
        </a>
      ) : (
        <div className="flex-1 min-w-0">{content}</div>
      )}

      {canWrite && (
        <LinkCardActions
          link={link}
          isPaper={isPaper}
          onDelete={onDelete}
          onRescrape={onRescrape}
          dragHandleProps={dragHandleProps}
          labels={{
            dragToReorder: t("dragToReorder"),
            copyUrl: t("copyUrl"),
            copyTitle: t("copyTitle"),
            refreshMetadata: t("refreshMetadata"),
            remove: t("remove"),
          }}
        />
      )}
    </div>
  );
}
