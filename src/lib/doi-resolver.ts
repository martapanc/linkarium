const MAILTO = "admin@linkarium.app"; // OpenAlex / Unpaywall polite pool

export interface PaperMetadata {
  title: string;
  authors: string;
  year: number | null;
  venue: string | null;
  doi: string | null; // bare DOI, e.g. "10.1145/123"
  url: string | null; // https://doi.org/<doi>
  pdf_url: string | null; // direct OA PDF link if available
}

// ── OpenAlex helpers ─────────────────────────────────────────────────────────

function parseOpenAlexWork(work: Record<string, unknown>): PaperMetadata {
  const rawDoi = (work.doi as string | null) ?? null;
  const doi = rawDoi ? rawDoi.replace(/^https?:\/\/doi\.org\//i, "") : null;

  const authorships = (work.authorships as Array<{ author?: { display_name?: string } }>) ?? [];
  const authors = authorships
    .map((a) => a.author?.display_name)
    .filter(Boolean)
    .join(", ");

  const primaryLocation = work.primary_location as Record<string, unknown> | null;
  const venue =
    (primaryLocation?.source as Record<string, unknown> | null)?.display_name as string | null ?? null;

  const bestOa = work.best_oa_location as Record<string, unknown> | null;
  const openAccess = work.open_access as Record<string, unknown> | null;
  const pdf_url =
    (bestOa?.pdf_url as string | null) ??
    (openAccess?.oa_url as string | null) ??
    null;

  return {
    title: (work.title as string | null) ?? "",
    authors,
    year: (work.publication_year as number | null) ?? null,
    venue,
    doi,
    url: doi ? `https://doi.org/${doi}` : null,
    pdf_url,
  };
}

/**
 * Resolve a DOI via OpenAlex (returns metadata + OA PDF URL if available).
 * Falls back to Crossref for metadata when OpenAlex returns nothing.
 */
export async function resolveDoi(rawDoi: string): Promise<PaperMetadata | null> {
  const doi = rawDoi.trim().replace(/^https?:\/\/doi\.org\//i, "");

  // Primary: OpenAlex
  try {
    const res = await fetch(
      `https://api.openalex.org/works/https://doi.org/${encodeURIComponent(doi)}?mailto=${MAILTO}`,
    );
    if (res.ok) {
      return parseOpenAlexWork(await res.json());
    }
  } catch {
    // fall through to Crossref
  }

  // Fallback: Crossref (no PDF URL, but reliable metadata)
  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      { headers: { "User-Agent": `Linkarium/1.0 (mailto:${MAILTO})` } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const work = data.message;

    const authors = (
      (work.author as Array<{ given?: string; family?: string }>) ?? []
    )
      .map((a) => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");

    return {
      title: (work.title as string[])?.[0] ?? doi,
      authors,
      year:
        work.published?.["date-parts"]?.[0]?.[0] ??
        work["published-print"]?.["date-parts"]?.[0]?.[0] ??
        null,
      venue: (work["container-title"] as string[])?.[0] ?? null,
      doi,
      url: `https://doi.org/${doi}`,
      pdf_url: null,
    };
  } catch {
    return null;
  }
}

/**
 * Search for a paper by title (and optionally year) via OpenAlex.
 * Returns the top match.
 */
export async function searchPaper(
  title: string,
  year?: number | null,
): Promise<PaperMetadata | null> {
  const params = new URLSearchParams({
    search: title,
    per_page: "3",
    select: "id,doi,title,publication_year,authorships,primary_location,best_oa_location,open_access",
    mailto: MAILTO,
  });
  if (year) params.set("filter", `publication_year:${year}`);

  try {
    const res = await fetch(`https://api.openalex.org/works?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as { results?: Record<string, unknown>[] };
    const results = data.results ?? [];
    if (!results.length) return null;
    return parseOpenAlexWork(results[0]);
  } catch {
    return null;
  }
}

/**
 * Given a DOI, attempt to find a free PDF URL via Unpaywall.
 * Use as a fallback when OpenAlex doesn't have one.
 */
export async function getPdfUrlUnpaywall(doi: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${MAILTO}`,
    );
    if (!res.ok) return null;
    const data = await res.json() as { best_oa_location?: { url_for_pdf?: string } };
    return data.best_oa_location?.url_for_pdf ?? null;
  } catch {
    return null;
  }
}

/** Returns true if the string looks like a bare DOI or a doi.org URL. */
export function isDoiPattern(str: string): boolean {
  return /^(?:https?:\/\/doi\.org\/)?10\.\d{4,9}\/.+$/i.test(str.trim());
}
