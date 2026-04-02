import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createServerSupabase } from "@/lib/supabase/server";
import { scrapeUrls } from "@/lib/scraper";
import { extractUrls } from "@/lib/url-parser";
import type { CreateListRequest } from "@/lib/types";

// POST /api/lists — Create a new list, optionally with initial URLs
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateListRequest;
    const supabase = await createServerSupabase();

    const listId = nanoid(7); // Short, URL-safe ID

    // Create the list
    const { data: list, error: listError } = await supabase
      .from("lists")
      .insert({
        id: listId,
        title: body.title?.trim() || "My Links",
        description: body.description?.trim() || "",
      })
      .select()
      .single();

    if (listError) {
      console.error("[api/lists] Insert error:", listError);
      return NextResponse.json(
        { error: "Failed to create list" },
        { status: 500 },
      );
    }

    let links: unknown[] = [];

    // If URLs were provided, scrape them and add to the list
    if (body.urls && body.urls.length > 0) {
      const validUrls = extractUrls(body.urls.join("\n"));
      const scraped = await scrapeUrls(validUrls);

      const linksToInsert = scraped.map((s, i) => ({
        list_id: listId,
        url: s.url,
        title: s.title,
        description: s.description,
        image_url: s.image_url,
        favicon_url: s.favicon_url,
        domain: s.domain,
        position: i,
        scraped_at: new Date().toISOString(),
      }));

      if (linksToInsert.length > 0) {
        const { data: insertedLinks, error: linksError } = await supabase
          .from("links")
          .insert(linksToInsert)
          .select();

        if (linksError) {
          console.error("[api/lists] Links insert error:", linksError);
        } else {
          links = insertedLinks || [];
        }
      }
    }

    return NextResponse.json({ list, links }, { status: 201 });
  } catch (error) {
    console.error("[api/lists] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/lists — Update list title/description
export async function PATCH(request: NextRequest) {
  try {
    const { id, title, description } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "List ID required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();

    const { data, error } = await supabase
      .from("lists")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update list" },
        { status: 500 },
      );
    }

    return NextResponse.json({ list: data });
  } catch (error) {
    console.error("[api/lists] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
