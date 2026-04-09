import type { PaperInput } from "./types";

/**
 * Parse one or more citations in the format:
 * [Key] Authors, _Title_, Venue, Year
 *
 * Examples:
 *   [Archer 1999] John Archer, _Assessment of the Reliability..._, Journal of Interpersonal Violence, 1999
 *   [Desmarais et al. 2012] Sarah L. Desmarais, ..., _Prevalence..._, Partner Abuse, Vol 3 n.2, 2012
 */

// Matches: [Key] Authors, _Title_, Venue (may have commas), Year[: URL]
const CITATION_RE = /^\[([^\]]+)\]\s+(.*?),\s*_(.+?)_,\s*(.*),\s*(\d{4})(?:\s*:\s*(.+?))?\s*$/;

export interface ParsedCitation extends PaperInput {
  key: string; // the [Key] part, for display/dedup
}

export function parseCitations(text: string): ParsedCitation[] {
  const results: ParsedCitation[] = [];

  for (const rawLine of text.split(/\n+/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const m = line.match(CITATION_RE);
    if (!m) continue;

    const [, key, authors, title, venue, yearStr, urlStr] = m;

    results.push({
      key: key.trim(),
      title: title.trim(),
      citation_authors: authors.trim() || undefined,
      citation_year: parseInt(yearStr, 10),
      citation_venue: venue.trim() || undefined,
      url: urlStr?.trim() || undefined,
    });
  }

  return results;
}

/** Returns true when the text contains at least one parseable citation line. */
export function looksLikeCitations(text: string): boolean {
  return text.split(/\n+/).some((line) => CITATION_RE.test(line.trim()));
}