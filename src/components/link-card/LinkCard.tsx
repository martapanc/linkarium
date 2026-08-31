"use client";

import { useState } from "react";
import type React from "react";
import { useTranslations } from "next-intl";
import type { DbLink } from "@/lib/types";
import { LinkCardThumbnail } from "./LinkCardThumbnail";
import { PaperCardContent } from "./PaperCardContent";
import { LinkCardContent } from "./LinkCardContent";
import { LinkCardActions } from "./LinkCardActions";
import { LinkEditForm } from "./LinkEditForm";

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
  index: number;
  onDelete: (id: string) => void;
  onRescrape: (link: DbLink) => void;
  onEdit: (id: string, payload: EditPayload) => Promise<void>;
  canWrite: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function LinkCard({ link, index, onDelete, onRescrape, onEdit, canWrite, dragHandleProps }: Props) {
  const t = useTranslations("linkCard");
  const isPaper = link.link_type === "paper";
  const [isEditing, setIsEditing] = useState(false);

  async function handleSave(payload: EditPayload) {
    await onEdit(link.id, payload);
    setIsEditing(false);
  }

  const displayContent = (
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
          <LinkCardContent title={link.title} url={link.url} domain={link.domain} author={link.author} />
        )}
      </div>
    </div>
  );

  return (
    <div
      className="animate-fade-up flex min-w-0 bg-white rounded-lg border border-sand-200 hover:border-sand-300 transition-all duration-200 hover:shadow-sm"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {isEditing ? (
        <LinkEditForm
          link={link}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          labels={{
            save: t("save"),
            cancel: t("cancel"),
            saving: t("saving"),
            titleField: t("titleField"),
            descriptionField: t("descriptionField"),
            urlField: t("urlField"),
            authorsField: t("authorsField"),
            yearField: t("yearField"),
            venueField: t("venueField"),
          }}
        />
      ) : link.url && isPaper ? (
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => window.open(link.url!, "_blank", "noopener,noreferrer")}>
          {displayContent}
        </div>
      ) : link.url ? (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
          {displayContent}
        </a>
      ) : (
        <div className="flex-1 min-w-0">{displayContent}</div>
      )}

      {canWrite && !isEditing && (
        <LinkCardActions
          link={link}
          isPaper={isPaper}
          onDelete={onDelete}
          onRescrape={onRescrape}
          onEdit={() => setIsEditing(true)}
          dragHandleProps={dragHandleProps}
          labels={{
            dragToReorder: t("dragToReorder"),
            copyUrl: t("copyUrl"),
            copyTitle: t("copyTitle"),
            refreshMetadata: t("refreshMetadata"),
            edit: t("edit"),
            remove: t("remove"),
          }}
        />
      )}
    </div>
  );
}
