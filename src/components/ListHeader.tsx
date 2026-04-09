"use client";

import { useState, useRef, useEffect } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { toast } from "sonner";
import type { DbList } from "@/lib/types";

interface Props {
  list: DbList;
  linkCount: number;
  onDelete: () => Promise<void>;
  canWrite: boolean;
}

export function ListHeader({ list, linkCount, onDelete, canWrite }: Props) {
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
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
    }
  }

  return (
    <div>
      {/* Title */}
      {canWrite && isEditingTitle ? (
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
          onClick={() => canWrite && setIsEditingTitle(true)}
          className={`font-display text-3xl md:text-4xl text-sand-900 leading-tight ${canWrite ? "cursor-text hover:text-coral-600 transition-colors" : ""}`}
          title={canWrite ? "Click to edit" : undefined}
        >
          {title}
        </h1>
      )}

      {/* Description */}
      {canWrite && isEditingDesc ? (
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
          onClick={() => canWrite && setIsEditingDesc(true)}
          className={`mt-2 text-[15px] leading-relaxed ${canWrite ? "text-sand-400 cursor-text hover:text-sand-500 transition-colors" : "text-sand-400"}`}
          title={canWrite ? "Click to edit" : undefined}
        >
          {description || (canWrite ? "Click to add a description…" : "")}
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

        {canWrite && <AlertDialog.Root>
          <AlertDialog.Trigger asChild>
            <button className="text-xs text-sand-300 hover:text-red-400 transition-colors cursor-pointer">
              Delete list
            </button>
          </AlertDialog.Trigger>

          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-40 bg-black/30 animate-in fade-in-0" />
            <AlertDialog.Content className="
              fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-md bg-white rounded-2xl shadow-xl p-6
              animate-in fade-in-0 zoom-in-95
            ">
              <AlertDialog.Title className="text-lg font-semibold text-sand-900">
                Delete this list?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-sand-500">
                This will permanently delete <span className="font-medium text-sand-700">"{title}"</span> and all its links. This action cannot be undone.
              </AlertDialog.Description>

              <div className="mt-6 flex justify-end gap-3">
                <AlertDialog.Cancel asChild>
                  <button className="px-4 py-2 text-sm font-medium text-sand-600 bg-sand-100 hover:bg-sand-200 rounded-lg transition-colors cursor-pointer">
                    Cancel
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? "Deleting…" : "Yes, delete"}
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>}
      </div>
    </div>
  );
}