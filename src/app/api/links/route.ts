import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { scrapeUrls } from "@/lib/scraper";
import { extractDomain } from "@/lib/url-parser";
import { parseLinksInput, extractDoi, type ParsedReference } from "@/lib/reference-parser";
import { requireWriteToken } from "@/lib/write-auth";

// POST /api/links — Add links (URLs or paper references) to an existing list
export async function POST(request: NextRequest) {
  const deny = requireWriteToken(request);
  if (deny) return deny;

  try {
    const body = await request.json();
    const { listId } = body;

    if (!listId) {
      return NextResponse.json({ error: "listId is required" }, { status: 400 });
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
      .select("position")
      .eq("list_id", listId)
      .order("position", { ascending: false })
      .limit(1);

    const nextPosition = existing?.[0]?.position != null
      ? existing[0].position + 1
      : 0;

    // ── Paper reference(s) path ───────────────────────────────────────────────
    // Normalise: `paper` (single) → `papers` (array of one)
    const paperList: Array<typeof body.paper> =
      body.papers ?? (body.paper ? [body.paper] : null);

    if (paperList) {
      if (!paperList.length) {
        return NextResponse.json({ links: [], duplicatesSkipped: 0 });
      }

      // Existing titles in this list (for dedup when there's no DOI)
      const { data: existingPapers } = await supabase
        .from("links")
        .select("doi, title")
        .eq("list_id", listId)
        .eq("link_type", "paper");

      const existingDois = new Set(
        (existingPapers ?? []).map((p) => p.doi).filter(Boolean),
      );
      const existingTitles = new Set(
        (existingPapers ?? []).map((p) => p.title?.toLowerCase()).filter(Boolean),
      );

      let duplicatesSkipped = 0;
      const rows: Array<Record<string, unknown>> = [];

      for (let i = 0; i < paperList.length; i++) {
        const p = paperList[i];
        if (!p?.title?.trim()) { duplicatesSkipped++; continue; }

        const providedUrl = p.url?.trim() || null;

        // Dedup: check title, then URL, then DOI extracted from doi.org URLs
        if (existingTitles.has(p.title.trim().toLowerCase())) { duplicatesSkipped++; continue; }

        const doi = providedUrl ? extractDoi(providedUrl) : null;

        if (doi && existingDois.has(doi)) { duplicatesSkipped++; continue; }

        // Detect direct PDF link
        const pdf_url = providedUrl && /\.pdf(\?.*)?$/i.test(providedUrl) ? providedUrl : null;

        let domain: string | null = null;
        if (providedUrl) {
          try { domain = new URL(providedUrl).hostname; } catch { /* invalid URL */ }
        }

        if (doi) existingDois.add(doi);
        existingTitles.add(p.title.trim().toLowerCase());

        rows.push({
          list_id: listId,
          link_type: "paper",
          url: providedUrl,
          title: p.title.trim(),
          description: p.description?.trim() || null,
          image_url: null,
          favicon_url: null,
          domain,
          position: nextPosition + rows.length,
          doi,
          citation_authors: p.citation_authors?.trim() || null,
          citation_year: p.citation_year ?? null,
          citation_venue: p.citation_venue?.trim() || null,
          pdf_url,
        });
      }

      if (rows.length === 0) {
        return NextResponse.json({ links: [], duplicatesSkipped });
      }

      const { data: insertedLinks, error } = await supabase
        .from("links")
        .insert(rows)
        .select();

      if (error) {
        console.error("[api/links] Paper insert error:", error);
        return NextResponse.json({ error: "Failed to add paper" }, { status: 500 });
      }

      return NextResponse.json({ links: insertedLinks, duplicatesSkipped });
    }

    // ── Raw text path ────────────────────────────────────────────────────────
    // Extracts both markdown-link references (`[Author - Title (Year)](url)`,
    // parsed into paper-style rows with no scraping needed) and plain bare URLs
    // (scraped for OG metadata as before), preserving the order they appear in.
    const { rawText } = body;

    if (!rawText) {
      return NextResponse.json(
        { error: "rawText, paper, or papers is required" },
        { status: 400 },
      );
    }

    // Get existing links to detect duplicates (by URL, and by DOI/title for references)
    const { data: existingLinks } = await supabase
      .from("links")
      .select("url, doi, title")
      .eq("list_id", listId);

    const existingUrls = new Set((existingLinks ?? []).map((l) => l.url).filter(Boolean));
    const existingDois = new Set((existingLinks ?? []).map((l) => l.doi).filter(Boolean));
    const existingTitles = new Set(
      (existingLinks ?? []).map((l) => l.title?.toLowerCase()).filter(Boolean),
    );

    const items = parseLinksInput(rawText);
    const totalExtracted = items.length;

    const rows: Array<Record<string, unknown>> = [];
    let position = nextPosition;

    const references = items.filter((i): i is ParsedReference => i.type === "reference");
    for (const ref of references) {
      if (existingUrls.has(ref.url)) continue;
      const doi = extractDoi(ref.url);
      if (doi && existingDois.has(doi)) continue;
      if (existingTitles.has(ref.title.toLowerCase())) continue;

      existingUrls.add(ref.url);
      if (doi) existingDois.add(doi);
      existingTitles.add(ref.title.toLowerCase());

      rows.push({
        list_id: listId,
        link_type: "paper",
        url: ref.url,
        title: ref.title,
        description: null,
        image_url: null,
        favicon_url: null,
        domain: extractDomain(ref.url),
        position: position++,
        doi,
        citation_authors: ref.citation_authors ?? null,
        citation_year: ref.citation_year ?? null,
        citation_venue: null,
        pdf_url: /\.pdf(\?.*)?$/i.test(ref.url) ? ref.url : null,
      });
    }

    const plainUrls = items
      .filter((i) => i.type === "url")
      .map((i) => i.url)
      .filter((u) => !existingUrls.has(u));

    if (plainUrls.length > 0) {
      const scraped = await scrapeUrls(plainUrls);
      for (const s of scraped) {
        rows.push({
          list_id: listId,
          link_type: "url",
          url: s.url,
          title: s.title,
          description: s.description,
          image_url: s.image_url,
          favicon_url: s.favicon_url,
          domain: s.domain,
          position: position++,
          scraped_at: new Date().toISOString(),
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { links: [], duplicatesSkipped: totalExtracted },
        { status: 200 },
      );
    }

    const { data: insertedLinks, error } = await supabase
      .from("links")
      .insert(rows)
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
      duplicatesSkipped: totalExtracted - rows.length,
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
  const deny = requireWriteToken(request);
  if (deny) return deny;

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

// PATCH /api/links — Update a link's editable fields
export async function PATCH(request: NextRequest) {
  const deny = requireWriteToken(request);
  if (deny) return deny;

  try {
    const { id, title, description, url, citation_authors, citation_year, citation_venue } =
      await request.json();

    if (!id) {
      return NextResponse.json({ error: "Link ID required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title?.trim() || null;
    if (description !== undefined) updates.description = description?.trim() || null;
    if (url !== undefined) {
      updates.url = url?.trim() || null;
      try {
        updates.domain = url?.trim() ? new URL(url.trim()).hostname.replace(/^www\./, "") : null;
      } catch {
        updates.domain = null;
      }
    }
    if (citation_authors !== undefined) updates.citation_authors = citation_authors?.trim() || null;
    if (citation_year !== undefined) updates.citation_year = citation_year ?? null;
    if (citation_venue !== undefined) updates.citation_venue = citation_venue?.trim() || null;

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[api/links] PATCH error:", error);
      return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
    }

    return NextResponse.json({ link: data });
  } catch (error) {
    console.error("[api/links] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/links — Reorder links
export async function PUT(request: NextRequest) {
  const deny = requireWriteToken(request);
  if (deny) return deny;

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
