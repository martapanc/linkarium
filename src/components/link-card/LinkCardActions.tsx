"use client";

import { useState } from "react";
import type React from "react";
import clsx from "clsx";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { DbLink } from "@/lib/types";

interface Props {
  link: DbLink;
  isPaper: boolean;
  onDelete: (id: string) => void;
  onRescrape: (link: DbLink) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  labels: {
    dragToReorder: string;
    copyUrl: string;
    copyTitle: string;
    refreshMetadata: string;
    remove: string;
  };
}

const menuItemClass = "flex items-center gap-2 px-3 py-2 text-sm text-sand-700 hover:bg-sand-50 cursor-pointer outline-none";

export function LinkCardActions({ link, isPaper, onDelete, onRescrape, dragHandleProps, labels }: Props) {
  const [isRescraping, setIsRescraping] = useState(false);

  async function handleRescrape() {
    setIsRescraping(true);
    await onRescrape(link);
    setIsRescraping(false);
  }

  return (
    <DropdownMenu.Root>
      <div className="shrink-0 flex flex-col items-center border-l border-sand-100">
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            className="flex-1 px-3 text-sand-200 hover:text-sand-400 transition-colors duration-150 cursor-grab active:cursor-grabbing touch-none rounded-tr-xl"
            aria-label={labels.dragToReorder}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
            </svg>
          </button>
        )}
        <DropdownMenu.Trigger asChild>
          <button
            className="flex-1 px-3 text-sand-300 hover:text-sand-600 hover:bg-sand-50 transition-colors duration-150 cursor-pointer rounded-br-xl"
            aria-label={labels.copyUrl}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
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
              className={menuItemClass}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
              </svg>
              {labels.copyUrl}
            </DropdownMenu.Item>
          )}
          {link.title && (
            <DropdownMenu.Item
              onSelect={() => navigator.clipboard.writeText(link.title!)}
              className={menuItemClass}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              {labels.copyTitle}
            </DropdownMenu.Item>
          )}
          {!isPaper && (
            <DropdownMenu.Item
              onSelect={handleRescrape}
              disabled={isRescraping}
              className={clsx(menuItemClass, "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed")}
            >
              <svg className={clsx("w-4 h-4", isRescraping && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              {labels.refreshMetadata}
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
            {labels.remove}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
