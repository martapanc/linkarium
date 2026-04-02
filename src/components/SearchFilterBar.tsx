"use client";

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

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "position", label: "Manual order" },
  { field: "created_at", label: "Date added" },
  { field: "title", label: "Title" },
  { field: "domain", label: "Domain" },
];

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
          placeholder="Search links…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="
            w-full pl-10 pr-4 py-2.5
            bg-white border border-sand-200 rounded-xl
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
          <select
            value={domainFilter || ""}
            onChange={(e) =>
              onDomainFilterChange(e.target.value || null)
            }
            className="
              text-xs px-3 py-1.5
              bg-white border border-sand-200 rounded-lg
              text-sand-600
              focus:outline-none focus:border-sand-300
              cursor-pointer
            "
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.field}
              onClick={() => onSortChange(opt.field)}
              className={`
                text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer
                ${
                  sort.field === opt.field
                    ? "bg-sand-900 text-white"
                    : "bg-sand-100 text-sand-500 hover:bg-sand-200"
                }
              `}
            >
              {opt.label}
              {sort.field === opt.field && (
                <span className="ml-1">
                  {sort.direction === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Result count */}
        {isFiltered && (
          <span className="text-xs text-sand-400 ml-auto">
            {filteredCount} of {totalCount}
          </span>
        )}
      </div>
    </div>
  );
}
