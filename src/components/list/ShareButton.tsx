"use client";

import { useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

interface Props {
  listId: string;
}

export function ShareButton({ listId }: Props) {
  const t = useTranslations("shareButton");
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/${listId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-sand-100 hover:bg-sand-200 text-sand-700",
        "text-sm font-medium transition-all duration-150 cursor-pointer"
      )}
    >
      {copied ? (
        <>
          <svg
            className="w-4 h-4 text-teal-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {t("copied")}
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>
          {t("share")}
        </>
      )}
    </button>
  );
}
