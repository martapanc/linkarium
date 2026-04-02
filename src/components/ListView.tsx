"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type { DbList, DbLink, SortConfig, SortField } from "@/lib/types";
import { LinkCard } from "./LinkCard";
import { AddLinksForm } from "./AddLinksForm";
import { SearchFilterBar } from "./SearchFilterBar";
import { ShareButton } from "./ShareButton";
import { ListHeader } from "./ListHeader";
import { EmptyState } from "./EmptyState";

interface Props {
  list: DbList;
  initialLinks: DbLink[];
}

export function ListView({ list, initialLinks }: Props) {
  const [links, setLinks] = useState<DbLink[]>(initialLinks);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortConfig>({
    field: "position",
    direction: "asc",
  });
  const [isAdding, setIsAdding] = useState(false);

  // Unique domains for filter dropdown
  const domains = useMemo(() => {
    const set = new Set(links.map((l) => l.domain).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [links]);

  // Filter and sort links
  const filteredLinks = useMemo(() => {
    let result = [...links];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.url.toLowerCase().includes(q) ||
          l.title?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.domain?.toLowerCase().includes(q),
      );
    }

    // Domain filter
    if (domainFilter) {
      result = result.filter((l) => l.domain === domainFilter);
    }

    // Sort
    result.sort((a, b) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      const field = sort.field;

      if (field === "position") return (a.position - b.position) * dir;
      if (field === "created_at")
        return (
          (new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()) *
          dir
        );

      const aVal = (a[field] || "").toLowerCase();
      const bVal = (b[field] || "").toLowerCase();
      return aVal.localeCompare(bVal) * dir;
    });

    return result;
  }, [links, search, domainFilter, sort]);

  // Add links handler
  const handleAddLinks = useCallback(
    async (rawText: string) => {
      setIsAdding(true);
      try {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: list.id, rawText }),
        });

        if (!res.ok) throw new Error("Failed to add links");

        const { links: newLinks, duplicatesSkipped } = await res.json();

        if (newLinks.length > 0) {
          setLinks((prev) => [...prev, ...newLinks]);
          toast.success(
            `Added ${newLinks.length} link${newLinks.length !== 1 ? "s" : ""}`,
          );
        }

        if (duplicatesSkipped > 0) {
          toast(`${duplicatesSkipped} duplicate(s) skipped`);
        }

        if (newLinks.length === 0 && duplicatesSkipped === 0) {
          toast.error("No valid URLs found in your input");
        }
      } catch {
        toast.error("Failed to add links");
      } finally {
        setIsAdding(false);
      }
    },
    [list.id],
  );

  // Delete link handler
  const handleDelete = useCallback(async (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));

    try {
      const res = await fetch(`/api/links?id=${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Link removed");
    } catch {
      // Revert on failure — refetch
      toast.error("Failed to remove link");
    }
  }, []);

  // Re-scrape handler
  const handleRescrape = useCallback(async (link: DbLink) => {
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link.url, linkId: link.id }),
      });

      if (!res.ok) throw new Error();

      const { result } = await res.json();
      setLinks((prev) =>
        prev.map((l) =>
          l.id === link.id
            ? {
                ...l,
                title: result.title,
                description: result.description,
                image_url: result.image_url,
                favicon_url: result.favicon_url,
                domain: result.domain,
                scraped_at: new Date().toISOString(),
              }
            : l,
        ),
      );
      toast.success("Metadata refreshed");
    } catch {
      toast.error("Failed to refresh metadata");
    }
  }, []);

  // Sort change handler
  const handleSortChange = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-sand-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="font-display text-xl text-sand-900 tracking-tight hover:text-coral-500 transition-colors"
          >
            LinkDrop
          </a>
          <ShareButton listId={list.id} />
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* List header (editable title + description) */}
          <ListHeader list={list} linkCount={links.length} />

          {/* Add links */}
          <div className="mt-8">
            <AddLinksForm onAdd={handleAddLinks} isAdding={isAdding} />
          </div>

          {/* Search / filter / sort bar */}
          {links.length > 0 && (
            <div className="mt-8">
              <SearchFilterBar
                search={search}
                onSearchChange={setSearch}
                domains={domains}
                domainFilter={domainFilter}
                onDomainFilterChange={setDomainFilter}
                sort={sort}
                onSortChange={handleSortChange}
                totalCount={links.length}
                filteredCount={filteredLinks.length}
              />
            </div>
          )}

          {/* Links grid */}
          {links.length === 0 ? (
            <EmptyState />
          ) : filteredLinks.length === 0 ? (
            <div className="mt-12 text-center">
              <p className="text-sand-400 text-sm">
                No links match your search.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setDomainFilter(null);
                }}
                className="mt-2 text-coral-500 text-sm hover:underline cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {filteredLinks.map((link, i) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  index={i}
                  onDelete={handleDelete}
                  onRescrape={handleRescrape}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-200 px-6 py-6 text-center">
        <a
          href="/"
          className="text-xs text-sand-400 hover:text-coral-500 transition-colors"
        >
          Create your own list with LinkDrop
        </a>
      </footer>
    </div>
  );
}
