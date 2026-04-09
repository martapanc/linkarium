"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import type { DbList } from "@/lib/types";

interface Props {
  list: DbList;
  linkCount: number;
  onDelete: () => Promise<void>;
}

export function ListHeader({ list, linkCount, onDelete }: Props) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) titleRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDesc && descRef.current) descRef.current.focus();
  }, [isEditingDesc]);

  async function saveField(field: "title" | "description", value: string) {
    try {
      await fetch("/api/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: list.id, [field]: value }),
      });
    } catch {
      toast.error("Failed to save");
    }
  }

  function handleTitleBlur() {
    setIsEditingTitle(false);
    if (title.trim() !== list.title) {
      saveField("title", title.trim() || "My Links");
    }
  }

  function handleDescBlur() {
    setIsEditingDesc(false);
    if (description.trim() !== (list.description || "")) {
      saveField("description", description.trim());
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      toast.error("Failed to delete list");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div>
      {/* Title */}
      {isEditingTitle ? (
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTitleBlur();
            if (e.key === "Escape") {
              setTitle(list.title);
              setIsEditingTitle(false);
            }
          }}
          maxLength={100}
          className="
            w-full font-display text-3xl md:text-4xl text-sand-900
            bg-transparent border-b-2 border-coral-400
            focus:outline-none pb-1
          "
        />
      ) : (
        <h1
          onClick={() => setIsEditingTitle(true)}
          className="font-display text-3xl md:text-4xl text-sand-900 cursor-text hover:text-coral-600 transition-colors leading-tight"
          title="Click to edit"
        >
          {title}
        </h1>
      )}

      {/* Description */}
      {isEditingDesc ? (
        <textarea
          ref={descRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDescription(list.description || "");
              setIsEditingDesc(false);
            }
          }}
          rows={2}
          maxLength={500}
          className="
            w-full mt-2 text-sand-500 text-[15px]
            bg-transparent border-b border-coral-300
            focus:outline-none resize-none leading-relaxed
          "
        />
      ) : (
        <p
          onClick={() => setIsEditingDesc(true)}
          className="mt-2 text-sand-400 text-[15px] cursor-text hover:text-sand-500 transition-colors leading-relaxed"
          title="Click to edit"
        >
          {description || "Click to add a description…"}
        </p>
      )}

      {/* Meta + delete */}
      <div className="mt-3 flex items-center gap-4">
        <p className="text-xs text-sand-400">
          {linkCount} link{linkCount !== 1 ? "s" : ""} · created{" "}
          {new Date(list.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>

        {confirmDelete ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-sand-500">Delete this list?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50 cursor-pointer transition-colors"
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sand-400 hover:text-sand-600 cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-sand-300 hover:text-red-400 transition-colors cursor-pointer"
          >
            Delete list
          </button>
        )}
      </div>
    </div>
  );
}