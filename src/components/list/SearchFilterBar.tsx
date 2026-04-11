"use client";

import clsx from "clsx";
import * as Select from "@radix-ui/react-select";
import { useTranslations } from "next-intl";
import type { SortConfig, SortField } from "@/lib/types";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  domains: string[];
  domainFilter: string | null;
  onDomainFilterChange: (v: string | null) => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  totalCount: number;
  filteredCount: number;
}

const ChevronDownIcon = () => (
  <svg className="w-3.5 h-3.5 text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export function SearchFilterBar({
  search,
  onSearchChange,
  domains,
  domainFilter,
  onDomainFilterChange,
  sort,
  onSortChange,
  totalCount,
  filteredCount,
}: Props) {
  const t = useTranslations("searchFilter");

  const SORT_OPTIONS: { field: SortField; label: string }[] = [
    { field: "position", label: t("sortManual") },
    { field: "created_at", label: t("sortDate") },
    { field: "title", label: t("sortTitle") },
    { field: "domain", label: t("sortDomain") },
  ];

  const isFiltered = search.trim() || domainFilter;

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-2.5
            bg-white border border-sand-200 rounded-lg
            text-sm text-sand-800 placeholder:text-sand-300
            focus:outline-none focus:border-sand-300
            transition-colors
          "
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Domain filter */}
        {domains.length > 1 && (
          <Select.Root
            value={domainFilter ?? "__all__"}
            onValueChange={(v) => onDomainFilterChange(v === "__all__" ? null : v)}
          >
            <Select.Trigger className={clsx(
              "inline-flex items-center gap-1.5 min-w-32 text-xs px-3 py-1.5",
              "bg-white border border-sand-200 rounded-lg text-sand-600",
              "hover:border-sand-300 focus:outline-none cursor-pointer transition-colors",
              "data-[state=open]:border-coral-300 data-[state=open]:text-coral-600"
            )}>
              <Select.Value>{domainFilter ?? t("allDomains")}</Select.Value>
              <Select.Icon><ChevronDownIcon /></Select.Icon>
            </Select.Trigger>

            <Select.Portal>
              <Select.Content position="popper" sideOffset={4} className={clsx(
                "z-50 min-w-40 max-h-60 overflow-hidden",
                "bg-white rounded-lg border border-sand-200 shadow-lg",
                "animate-in fade-in-0 zoom-in-95"
              )}>
                <Select.Viewport className="p-1">
                  <Select.Item value="__all__" className={clsx(
                    "flex items-center justify-between px-3 py-2 rounded-md",
                    "text-xs text-sand-700 cursor-pointer outline-none",
                    "hover:bg-sand-50 data-highlighted:bg-sand-50"
                  )}>
                    <Select.ItemText>{t("allDomains")}</Select.ItemText>
                    <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                  </Select.Item>
                  <Select.Separator className="border-t border-sand-100 my-1" />
                  {domains.map((d) => (
                    <Select.Item key={d} value={d} className={clsx(
                      "flex items-center justify-between px-3 py-2 rounded-md",
                      "text-xs text-sand-700 cursor-pointer outline-none",
                      "hover:bg-sand-50 data-highlighted:bg-sand-50"
                    )}>
                      <Select.ItemText>{d}</Select.ItemText>
                      <Select.ItemIndicator><CheckIcon /></Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        )}

        {/* Sort */}
        <div className="flex flex-wrap items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.field}
              onClick={() => onSortChange(opt.field)}
              className={clsx(
                "text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer",
                sort.field === opt.field
                  ? "bg-sand-900 text-white"
                  : "bg-sand-100 text-sand-700 hover:bg-sand-200"
              )}
            >
              {opt.label}
              {sort.field === opt.field && (
                <span className="ml-1">{sort.direction === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          ))}
        </div>

        {/* Result count */}
        {isFiltered && (
          <span className="text-xs text-sand-600 ml-auto">
            {t("resultCount", { filtered: filteredCount, total: totalCount })}
          </span>
        )}
      </div>
    </div>
  );
}
