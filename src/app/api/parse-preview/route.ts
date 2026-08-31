import { NextRequest, NextResponse } from "next/server";
import { scrapeUrls } from "@/lib/scraper";
import { parseLinksInput } from "@/lib/reference-parser";
import { requireWriteToken } from "@/lib/write-auth";
import type { PreviewItem } from "@/lib/types";

// POST /api/parse-preview — Dry-run the link/reference parser against raw text.
// Performs no database writes; only fetches OG metadata for plain URLs so the
// user can verify extraction quality before actually adding anything to a list.
export async function POST(request: NextRequest) {
  const deny = requireWriteToken(request);
  if (deny) return deny;

  try {
    const { rawText } = await request.json();

    if (!rawText || typeof rawText !== "string") {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }

    const parsed = parseLinksInput(rawText);
    const plainUrls = parsed.filter((i) => i.type === "url").map((i) => i.url);
    const scraped = plainUrls.length > 0 ? await scrapeUrls(plainUrls) : [];
    const scrapedByUrl = new Map(scraped.map((s) => [s.url, s]));

    const items: PreviewItem[] = parsed.map((item) => {
      if (item.type === "reference") {
        return {
          type: "reference",
          url: item.url,
          title: item.title,
          citation_authors: item.citation_authors ?? null,
          citation_year: item.citation_year ?? null,
        };
      }
      const s = scrapedByUrl.get(item.url);
      return {
        type: "url",
        url: item.url,
        title: s?.title ?? null,
        description: s?.description ?? null,
        domain: s?.domain ?? null,
        author: s?.author ?? null,
        scrapeFailed: !s?.title,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/parse-preview] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
