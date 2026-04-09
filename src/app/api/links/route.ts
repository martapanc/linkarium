import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { scrapeUrls } from "@/lib/scraper";
import { extractUrls } from "@/lib/url-parser";
import { searchPaper, getPdfUrlUnpaywall } from "@/lib/doi-resolver";

// POST /api/links — Add links (URLs or paper references) to an existing list
export async function POST(request: NextRequest) {
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

      // Filter duplicates first, then enrich in parallel
      const toEnrich: Array<{ p: typeof paperList[0]; index: number }> = [];

      for (let i = 0; i < paperList.length; i++) {
        const p = paperList[i];
        if (!p?.title?.trim()) { duplicatesSkipped++; continue; }

        const cleanDoi = p.doi?.trim() || null;

        if (cleanDoi && existingDois.has(cleanDoi)) { duplicatesSkipped++; continue; }
        if (!cleanDoi && existingTitles.has(p.title.trim().toLowerCase())) {
          duplicatesSkipped++;
          continue;
        }

        if (cleanDoi) existingDois.add(cleanDoi);
        existingTitles.add(p.title.trim().toLowerCase());
        toEnrich.push({ p, index: i });
      }

      // Enrich with OpenAlex (title search) for papers that came without a DOI
      // and without a pre-filled pdf_url (i.e. from batch citation paste)
      const CONCURRENCY = 3;
      const enriched: Array<{
        p: typeof paperList[0];
        index: number;
        doi: string | null;
        pdf_url: string | null;
        title: string;
        authors: string | null;
        year: number | null;
        venue: string | null;
      }> = [];

      for (let i = 0; i < toEnrich.length; i += CONCURRENCY) {
        const batch = toEnrich.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map(async ({ p, index }) => {
            let doi = p.doi?.trim() || null;
            let pdf_url = p.pdf_url?.trim() || null;
            let title = p.title.trim();
            let authors = p.citation_authors?.trim() || null;
            let year = p.citation_year ?? null;
            let venue = p.citation_venue?.trim() || null;

            // Only search OpenAlex when the paper was pasted without a DOI
            if (!doi) {
              const found = await searchPaper(title, year);
              if (found) {
                doi = found.doi;
                pdf_url = pdf_url ?? found.pdf_url;
                // Prefer provided metadata over OpenAlex for title/authors/venue
                // (the user's citation is the source of truth)
                if (!authors) authors = found.authors || null;
                if (!venue) venue = found.venue;
              }
            }

            // If we have a DOI but no PDF, try Unpaywall
            if (doi && !pdf_url) {
              pdf_url = await getPdfUrlUnpaywall(doi);
            }

            return { p, index, doi, pdf_url, title, authors, year, venue };
          }),
        );
        enriched.push(...results);
      }

      const rows = enriched.map(({ p, index, doi, pdf_url, title, authors, year, venue }) => ({
        list_id: listId,
        link_type: "paper",
        url: doi ? `https://doi.org/${doi}` : null,
        title,
        description: p.description?.trim() || null,
        image_url: null,
        favicon_url: null,
        domain: doi ? "doi.org" : null,
        position: nextPosition + index,
        doi,
        citation_authors: authors,
        citation_year: year,
        citation_venue: venue,
        pdf_url,
      }));

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

    // ── URL path ─────────────────────────────────────────────────────────────
    const { rawText } = body;

    if (!rawText) {
      return NextResponse.json(
        { error: "rawText, paper, or papers is required" },
        { status: 400 },
      );
    }

    // Get existing URLs to detect duplicates
    const { data: existingLinks } = await supabase
      .from("links")
      .select("url")
      .eq("list_id", listId);

    const existingUrls = new Set(
      (existingLinks ?? []).map((l) => l.url).filter(Boolean),
    );

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

    const scraped = await scrapeUrls(urls);

    const linksToInsert = scraped.map((s, i) => ({
      list_id: listId,
      link_type: "url",
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
