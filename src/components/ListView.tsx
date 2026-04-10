"use client";

import { useState, useMemo, useCallback } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DbList, DbLink, SortConfig, SortField, PaperInput } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useWriteToken } from "@/lib/useWriteToken";
import { LinkCard } from "./LinkCard";
import { AddLinksForm } from "./AddLinksForm";
import { SearchFilterBar } from "./SearchFilterBar";
import { ShareButton } from "./ShareButton";
import { ListHeader } from "./ListHeader";
import { EmptyState } from "./EmptyState";
import { WriteGuard } from "./WriteGuard";
import { LanguageSwitcher } from "./LanguageSwitcher";

function SortableLinkCard(props: React.ComponentProps<typeof LinkCard>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.link.id });

  return (
    <div
      ref={setNodeRef}
      className="min-w-0"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
    >
      <LinkCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

interface Props {
  list: DbList;
  initialLinks: DbLink[];
}

export function ListView({ list, initialLinks }: Props) {
  const router = useRouter();
  const t = useTranslations("listView");
  const t2 = useTranslations("home");
  const { token, authFetch } = useWriteToken();
  const [links, setLinks] = useState<DbLink[]>(initialLinks);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortConfig>({
    field: "position",
    direction: "asc",
  });
  const [isAdding, setIsAdding] = useState(false);

  const canWrite = !!token;

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeLink = useMemo(() => links.find((l) => l.id === activeId) ?? null, [links, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setLinks((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex).map((l, i) => ({
          ...l,
          position: i,
        }));

        authFetch("/api/links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: list.id, orderedIds: reordered.map((l) => l.id) }),
        }).catch(() => toast.error("Failed to save order"));

        return reordered;
      });
      setActiveId(null);
    },
    [list.id, authFetch],
  );

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
          l.url?.toLowerCase().includes(q) ||
          l.title?.toLowerCase().includes(q) ||
          l.citation_authors?.toLowerCase().includes(q) ||
          l.citation_venue?.toLowerCase().includes(q) ||
          l.citation_year?.toString().includes(q) ||
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
        const res = await authFetch("/api/links", {
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
    [list.id, authFetch],
  );

  // Delete link handler
  const handleDelete = useCallback(async (linkId: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== linkId));

    try {
      const res = await authFetch(`/api/links?id=${linkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Link removed");
    } catch {
      toast.error("Failed to remove link");
    }
  }, [authFetch]);

  // Add paper handler
  const handleAddPaper = useCallback(
    async (paper: PaperInput) => {
      setIsAdding(true);
      try {
        const res = await authFetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: list.id, paper }),
        });

        if (!res.ok) throw new Error("Failed to add paper");

        const { links: newLinks, duplicatesSkipped } = await res.json();

        if (newLinks.length > 0) {
          setLinks((prev) => [...prev, ...newLinks]);
          toast.success("Paper reference added");
        } else if (duplicatesSkipped > 0) {
          toast("This paper is already in your list");
        }
      } catch {
        toast.error("Failed to add paper reference");
      } finally {
        setIsAdding(false);
      }
    },
    [list.id, authFetch],
  );

  // Batch add papers handler
  const handleAddPapers = useCallback(
    async (papers: PaperInput[]) => {
      setIsAdding(true);
      try {
        const res = await authFetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: list.id, papers }),
        });

        if (!res.ok) throw new Error("Failed to add papers");

        const { links: newLinks, duplicatesSkipped } = await res.json();

        if (newLinks.length > 0) {
          setLinks((prev) => [...prev, ...newLinks]);
          toast.success(
            `Added ${newLinks.length} paper${newLinks.length !== 1 ? "s" : ""}`,
          );
        }
        if (duplicatesSkipped > 0) {
          toast(`${duplicatesSkipped} already in list — skipped`);
        }
        if (newLinks.length === 0 && duplicatesSkipped === 0) {
          toast.error("No papers were added");
        }
      } catch {
        toast.error("Failed to add paper references");
      } finally {
        setIsAdding(false);
      }
    },
    [list.id, authFetch],
  );

  // Re-scrape handler
  const handleRescrape = useCallback(async (link: DbLink) => {
    try {
      const res = await authFetch("/api/scrape", {
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
  }, [authFetch]);

  // Delete list handler
  const handleDeleteList = useCallback(async () => {
    const res = await authFetch(`/api/lists?id=${list.id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete");
    toast.success("List deleted");
    router.push("/");
  }, [list.id, authFetch, router]);

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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <a
            href="/"
            className="font-display text-xl text-sand-900 tracking-tight hover:text-coral-500 transition-colors"
          >
            Linkarium
          </a>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <WriteGuard />
            <ShareButton listId={list.id} />
          </div>
        </div>
      </nav>

      <main className="flex-1 px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* List header (editable title + description) */}
          <ListHeader list={list} linkCount={links.length} onDelete={handleDeleteList} canWrite={canWrite} />

          {/* Add links — only shown when unlocked */}
          {canWrite && (
            <div className="mt-4 sm:mt-8">
              <AddLinksForm onAdd={handleAddLinks} onAddPaper={handleAddPaper} onAddPapers={handleAddPapers} isAdding={isAdding} />
            </div>
          )}

          {/* Search / filter / sort bar */}
          {links.length > 0 && (
            <div className="mt-4 sm:mt-8">
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
              <p className="text-sand-400 text-sm">{t("noMatch")}</p>
              <button
                onClick={() => {
                  setSearch("");
                  setDomainFilter(null);
                }}
                className="mt-2 text-coral-500 text-sm hover:underline cursor-pointer"
              >
                {t("clearFilters")}
              </button>
            </div>
          ) : (
            <div className="mt-4 sm:mt-6 grid gap-1.5 sm:gap-3">
              {canWrite && sort.field === "position" ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredLinks.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                    {filteredLinks.map((link, i) => (
                      <SortableLinkCard
                        key={link.id}
                        link={link}
                        index={i}
                        onDelete={handleDelete}
                        onRescrape={handleRescrape}
                        canWrite={canWrite}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay dropAnimation={null}>
                    {activeLink && (
                      <LinkCard
                        link={activeLink}
                        index={0}
                        onDelete={handleDelete}
                        onRescrape={handleRescrape}
                        canWrite={canWrite}
                      />
                    )}
                  </DragOverlay>
                </DndContext>
              ) : (
                filteredLinks.map((link, i) => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    index={i}
                    onDelete={handleDelete}
                    onRescrape={handleRescrape}
                    canWrite={canWrite}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sand-200 px-6 py-6 text-center text-xs text-sand-400">
        {canWrite ? (
          <a href="/" className="hover:text-coral-500 transition-colors">
            {t("footer")}
          </a>
        ) : (
          t("footerReadOnly")
        )}
      </footer>
    </div>
  );
}
