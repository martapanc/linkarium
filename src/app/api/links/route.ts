import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { scrapeUrls } from "@/lib/scraper";
import { extractUrls } from "@/lib/url-parser";

// POST /api/links — Add links to an existing list
export async function POST(request: NextRequest) {
  try {
    const { listId, rawText } = await request.json();

    if (!listId || !rawText) {
      return NextResponse.json(
        { error: "listId and rawText are required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();

    // Verify list exists
    const { data: list } = await supabase
      .from("lists")
      .select("id")
      .eq("id", listId)
      .single();

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Get current max position
    const { data: existing } = await supabase
      .from("links")
      .select("position, url")
      .eq("list_id", listId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing?.[0]?.position != null
      ? existing[0].position + 1
      : 0;

    // Get existing URLs to detect duplicates
    const { data: existingLinks } = await supabase
      .from("links")
      .select("url")
      .eq("list_id", listId);

    const existingUrls = new Set(existingLinks?.map((l) => l.url) || []);

    // Extract and deduplicate URLs
    const urls = extractUrls(rawText).filter((u) => !existingUrls.has(u));

    if (urls.length === 0) {
      return NextResponse.json(
        {
          links: [],
          duplicatesSkipped: extractUrls(rawText).length - urls.length,
        },
        { status: 200 },
      );
    }

    // Scrape metadata
    const scraped = await scrapeUrls(urls);

    const linksToInsert = scraped.map((s, i) => ({
      list_id: listId,
      url: s.url,
      title: s.title,
      description: s.description,
      image_url: s.image_url,
      favicon_url: s.favicon_url,
      domain: s.domain,
      position: nextPosition + i,
      scraped_at: new Date().toISOString(),
    }));

    const { data: insertedLinks, error } = await supabase
      .from("links")
      .insert(linksToInsert)
      .select();

    if (error) {
      console.error("[api/links] Insert error:", error);
      return NextResponse.json(
        { error: "Failed to add links" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      links: insertedLinks,
      duplicatesSkipped: extractUrls(rawText).length - urls.length,
    });
  } catch (error) {
    console.error("[api/links] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/links — Remove a link by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("id");

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();

    const { error } = await supabase.from("links").delete().eq("id", linkId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete link" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/links] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/links — Reorder links
export async function PUT(request: NextRequest) {
  try {
    const { listId, orderedIds } = await request.json();

    if (!listId || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "listId and orderedIds are required" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();

    // Update each link's position
    const updates = orderedIds.map((id: string, index: number) =>
      supabase.from("links").update({ position: index }).eq("id", id),
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/links] PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
