import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DbList, DbLink } from "@/lib/types";
import { ListView } from "@/components/ListView";

interface PageProps {
  params: Promise<{ locale: string; listId: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { listId } = await params;
  const supabase = await createServerSupabase();

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", listId)
    .is("deleted_at", null)
    .single();

  if (!list) {
    return { title: "List not found" };
  }

  const { count } = await supabase
    .from("links")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId);

  const title = list.title || "My Links";
  const description =
    list.description ||
    `A collection of ${count ?? 0} link${count !== 1 ? "s" : ""} shared via Linkarium`;

  return {
    title: `${title} — Linkarium`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function ListPage({ params }: PageProps) {
  const { listId } = await params;
  const supabase = await createServerSupabase();

  const { data: list } = await supabase
    .from("lists")
    .select("*")
    .eq("id", listId)
    .is("deleted_at", null)
    .single();

  if (!list) notFound();

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("list_id", listId)
    .order("position", { ascending: true });

  return (
    <ListView
      list={list as DbList}
      initialLinks={(links as DbLink[]) || []}
    />
  );
}
