import type { PaperInput } from "./types";

/**
 * Parse one or more citations. Two supported formats:
 *
 * Full:    [Key] Authors, _Title_, Venue, Year[: URL]
 * Minimal: [Key] [Authors, ]_Title_[: URL]  — year extracted from key
 *
 * Examples:
 *   [Archer 1999] John Archer, _Assessment..._,  Journal of Interpersonal Violence, 1999: https://...
 *   [Barlow et al. 2020] A, B, _Putting Coercive Control: Problems and Possibilities_, BJC, 2020: https://...
 *   [AlmaLaurea 2025] _Sintesi del Rapporto_: https://...
 */

// [Key] Authors, _Title_, Venue (may have commas), Year[: URL]
const FULL_RE = /^\[([^\]]+)\]\s+(.*?),\s*_(.+?)_,\s*(.*),\s*(\d{4})(?:\s*:\s*(.+?))?\s*$/;

// [Key] [Authors, ]_Title_[: URL]  — no trailing venue/year required
const MINIMAL_RE = /^\[([^\]]+)\]\s+(?:(.+?),\s*)?_(.+?)_(?:\s*:\s*(.+?))?\s*$/;

export interface ParsedCitation extends PaperInput {
  key: string; // the [Key] part, for display/dedup
}

function yearFromKey(key: string): number | undefined {
  const m = key.match(/\b(\d{4})\b/);
  return m ? parseInt(m[1], 10) : undefined;
}

function parseLine(line: string): ParsedCitation | null {
  const full = line.match(FULL_RE);
  if (full) {
    const [, key, authors, title, venue, yearStr, urlStr] = full;
    return {
      key: key.trim(),
      title: title.trim(),
      citation_authors: authors.trim() || undefined,
      citation_year: parseInt(yearStr, 10),
      citation_venue: venue.trim() || undefined,
      url: urlStr?.trim() || undefined,
    };
  }

  const minimal = line.match(MINIMAL_RE);
  if (minimal) {
    const [, key, authors, title, urlStr] = minimal;
    return {
      key: key.trim(),
      title: title.trim(),
      citation_authors: authors?.trim() || undefined,
      citation_year: yearFromKey(key.trim()),
      url: urlStr?.trim() || undefined,
    };
  }

  return null;
}

export function parseCitations(text: string): ParsedCitation[] {
  return text
    .split(/\n+/)
    .map((line) => parseLine(line.trim()))
    .filter((c): c is ParsedCitation => c !== null);
}

/** Returns true when the text contains at least one parseable citation line. */
export function looksLikeCitations(text: string): boolean {
  return text.split(/\n+/).some((line) => {
    const t = line.trim();
    return FULL_RE.test(t) || MINIMAL_RE.test(t);
  });
}