export interface CrossrefResult {
  title: string;
  authors: string;
  year: number | null;
  venue: string | null;
  doi: string;
  url: string;
}

/**
 * Resolve a DOI via the Crossref API and return structured metadata.
 * Works in both browser and Node environments.
 */
export async function resolveDoi(rawDoi: string): Promise<CrossrefResult | null> {
  const doi = rawDoi.trim().replace(/^https?:\/\/doi\.org\//i, "");

  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      {
        headers: {
          "User-Agent":
            "Linkarium/1.0 (https://linkarium.app; mailto:admin@linkarium.app)",
        },
      },
    );
    if (!res.ok) return null;

    const data = await res.json();
    const work = data.message;

    const title: string = work.title?.[0] ?? doi;

    const authors: string = ((work.author as Array<{ given?: string; family?: string }>) ?? [])
      .map((a) => [a.given, a.family].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", ");

    const year: number | null =
      work.published?.["date-parts"]?.[0]?.[0] ??
      work["published-print"]?.["date-parts"]?.[0]?.[0] ??
      null;

    const venue: string | null = work["container-title"]?.[0] ?? null;

    return { title, authors, year, venue, doi, url: `https://doi.org/${doi}` };
  } catch {
    return null;
  }
}

/** Returns true if the string looks like a bare DOI or a doi.org URL. */
export function isDoiPattern(str: string): boolean {
  return /^(?:https?:\/\/doi\.org\/)?10\.\d{4,9}\/.+$/i.test(str.trim());
}