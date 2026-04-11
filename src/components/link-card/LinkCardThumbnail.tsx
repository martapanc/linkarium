"use client";

import { useState } from "react";

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
  isPaper: boolean;
  url: string | null;
  image_url: string | null;
  favicon_url: string | null;
}

export function LinkCardThumbnail({ isPaper, url, image_url, favicon_url }: Props) {
  const [imgError, setImgError] = useState(false);
  const hasImage = !isPaper && image_url && !imgError;

  return (
    <div className="shrink-0 mt-0.5">
      {isPaper ? (
        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg bg-coral-50 flex items-center justify-center overflow-hidden">
          {url ? (
            <PaperFavicon url={url} />
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-coral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          )}
        </div>
      ) : hasImage ? (
        <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-sand-100">
          <img
            src={image_url!}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-sand-100 flex items-center justify-center">
          {favicon_url ? (
            <img
              src={favicon_url}
              alt=""
              className="w-5 h-5 sm:w-6 sm:h-6"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <svg className="w-5 h-5 text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.12 7.48l-3.5 3.5a4.5 4.5 0 01-6.364-6.364l1.591-1.591M10.82 15.312a4.5 4.5 0 01-1.12-7.48l3.5-3.5a4.5 4.5 0 016.364 6.364l-1.591 1.591" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
