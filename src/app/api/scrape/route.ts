import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { scrapeUrl } from "@/lib/scraper";
import { isValidUrl } from "@/lib/url-parser";

// POST /api/scrape — Scrape (or re-scrape) metadata for a link
export async function POST(request: NextRequest) {
  try {
    const { url, linkId } = await request.json();

    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Valid URL required" }, { status: 400 });
    }

    const result = await scrapeUrl(url);

    // If a linkId is provided, update the existing link record
    if (linkId) {
      const supabase = await createServerSupabase();
      await supabase
        .from("links")
        .update({
          title: result.title,
          description: result.description,
          image_url: result.image_url,
          favicon_url: result.favicon_url,
          domain: result.domain,
          scraped_at: new Date().toISOString(),
        })
        .eq("id", linkId);
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("[api/scrape] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
