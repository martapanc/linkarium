"use client";

import { useState } from "react";
import type React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslations } from "next-intl";
import type { DbLink } from "@/lib/types";

function PaperFavicon({ url }: { url: string }) {
  const [error, setError] = useState(false);
  let hostname = "";
  try { hostname = new URL(url).hostname; } catch { /* ignore */ }

  if (error || !hostname) {
    return (
      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-coral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
      alt=""
      className="w-5 h-5 sm:w-6 sm:h-6"
      onError={() => setError(true)}
    />
  );
}

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
  const [imgError, setImgError] = useState(false);
  const [isRescraping, setIsRescraping] = useState(false);

  const isPaper = link.link_type === "paper";
  const hasImage = !isPaper && link.image_url && !imgError;

  async function handleRescrape() {
    setIsRescraping(true);
    await onRescrape(link);
    setIsRescraping(false);
  }

  const cardContent = (
    <div className="flex items-start gap-4 p-4 sm:p-5">
      {/* Thumbnail / icon */}
      <div className="shrink-0 mt-0.5">
        {isPaper ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-coral-50 flex items-center justify-center overflow-hidden">
            {link.url ? (
              <PaperFavicon url={link.url} />
            ) : (
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-coral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            )}
          </div>
        ) : hasImage ? (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-sand-100">
            <img
              src={link.image_url!}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-sand-100 flex items-center justify-center">
            {link.favicon_url ? (
              <img
                src={link.favicon_url}
                alt=""
                className="w-5 h-5 sm:w-6 sm:h-6"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <svg
                className="w-5 h-5 text-sand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.12 7.48l-3.5 3.5a4.5 4.5 0 01-6.364-6.364l1.591-1.591M10.82 15.312a4.5 4.5 0 01-1.12-7.48l3.5-3.5a4.5 4.5 0 016.364 6.364l-1.591 1.591"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isPaper ? (
          <>
            <p className="text-[15px] font-medium text-sand-900 leading-snug line-clamp-3">
              {link.citation_authors && <>{link.citation_authors}, </>}
              {link.title && <em>{link.title}</em>}
              {link.citation_venue && <>, {link.citation_venue}</>}
              {link.citation_year && <>, {link.citation_year}</>}
            </p>
            {link.url && (
              <p className="text-xs text-sand-400 truncate mt-1">
                {link.url}
              </p>
            )}
            {link.description && (
              <p className="text-sm text-sand-400 mt-1 line-clamp-2 leading-relaxed">
                {link.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {link.doi && (
                <span className="text-xs bg-coral-50 text-coral-500 px-1.5 py-0.5 rounded font-mono shrink-0">
                  DOI
                </span>
              )}
              {link.pdf_url && (
                <a
                  href={link.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-1.5 py-0.5 rounded font-medium shrink-0 transition-colors"
                >
                  PDF
                </a>
              )}
              {!link.url && !link.pdf_url && (
                <span className="text-xs text-sand-300 shrink-0">{t("noPublicLink")}</span>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 className={`text-[15px] font-medium text-sand-900 leading-snug line-clamp-2 ${!link.title ? "break-all" : ""}`}>
              {link.title || link.url || "Untitled"}
            </h3>
            {link.description && (
              <p className="text-sm text-sand-500 mt-0.5 line-clamp-2 leading-relaxed">
                {link.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5 min-w-0">
              <span className="text-xs text-sand-400 truncate min-w-0">
                {link.domain || link.url}
              </span>
              <svg
                className="w-3 h-3 text-sand-300 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-4.5-6h6m0 0v6m0-6L9.75 14.25"
                />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="animate-fade-up flex min-w-0 bg-white rounded-xl border border-sand-200 hover:border-sand-300 transition-all duration-200 hover:shadow-sm"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      {/* Main clickable area */}
      {link.url && isPaper ? (
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => window.open(link.url!, "_blank", "noopener,noreferrer")}
        >
          {cardContent}
        </div>
      ) : link.url ? (
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
          {cardContent}
        </a>
      ) : (
        <div className="flex-1 min-w-0">{cardContent}</div>
      )}

      {/* Action column — only shown when write access is granted */}
      {canWrite && <DropdownMenu.Root>
        <div className="shrink-0 flex flex-col items-center border-l border-sand-100">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="flex-1 px-3 text-sand-200 hover:text-sand-400 transition-colors duration-150 cursor-grab active:cursor-grabbing touch-none"
              aria-label={t("dragToReorder")}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
              </svg>
            </button>
          )}
          <DropdownMenu.Trigger asChild>
            <button
              className="flex-1 px-3 text-sand-300 hover:text-sand-600 hover:bg-sand-50 transition-colors duration-150 cursor-pointer rounded-r-xl"
              aria-label={t("copyUrl")}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </DropdownMenu.Trigger>
        </div>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 bg-white rounded-lg border border-sand-200 shadow-lg py-1 min-w-40 animate-in fade-in-0 zoom-in-95"
          >
            {link.url && (
              <DropdownMenu.Item
                onSelect={() => navigator.clipboard.writeText(link.url!)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-sand-700 hover:bg-sand-50 cursor-pointer outline-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                {t("copyUrl")}
              </DropdownMenu.Item>
            )}
            {!isPaper && (
              <DropdownMenu.Item
                onSelect={handleRescrape}
                disabled={isRescraping}
                className="flex items-center gap-2 px-3 py-2 text-sm text-sand-700 hover:bg-sand-50 cursor-pointer outline-none data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${isRescraping ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                {t("refreshMetadata")}
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Separator className="border-t border-sand-100 my-1" />
            <DropdownMenu.Item
              onSelect={() => onDelete(link.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              {t("remove")}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>}
    </div>
  );
}