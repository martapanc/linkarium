import type { PaperInput } from "./types";

/**
 * Parse one or more citations. Three supported formats:
 *
 * Full (underscored):  [Key] Authors, _Title_, Venue, Year[: URL]
 * Minimal (underscored): [Key] [Authors, ]_Title_[: URL]  — year extracted from key
 * Plain (no underscores): [Key] Authors, Title, Venue, Year[: URL]
 *
 * Examples:
 *   [Archer 1999] John Archer, _Assessment..._,  Journal of Interpersonal Violence, 1999: https://...
 *   [Archer 1999] John Archer, Assessment of the Reliability..., Journal of Interpersonal Violence, 1999: https://...
 *   [AlmaLaurea 2025] _Sintesi del Rapporto_: https://...
 */

// [Key] Authors, _Title_, Venue (may have commas), Year[: URL]
const FULL_RE = /^\[([^\]]+)\]\s+(.*?),\s*_(.+?)_,\s*(.*),\s*(\d{4})(?:\s*:\s*(.+?))?\s*$/;

// [Key] [Authors, ]_Title_[: URL]  — no trailing venue/year required
const MINIMAL_RE = /^\[([^\]]+)\]\s+(?:(.+?),\s*)?_(.+?)_(?:\s*:\s*(.+?))?\s*$/;

// [Key] Authors, Title, Venue, Year[: URL]  — no underscore markup
const PLAIN_RE = /^\[([^\]]+)\]\s+(.+?),\s*(\d{4})(?:\s*:\s*(https?:\/\/\S+))?\s*$/;

export interface ParsedCitation extends PaperInput {
  key: string; // the [Key] part, for display/dedup
}

function yearFromKey(key: string): number | undefined {
  const m = key.match(/\b(\d{4})\b/);
  return m ? parseInt(m[1], 10) : undefined;
}

// Words that indicate a segment is NOT a person's name.
// (?!\.) prevents matching single-letter initials like "A." in "Murray A. Straus".
const NON_NAME_RE = /\b(the|a|an|of|in|on|for|or|by|with|to|from|at|about|as|into|through|against|its|among|between|within)\b(?!\.)/i;

function isAuthorSegment(s: string): boolean {
  const words = s.trim().split(/\s+/);
  if (!words.length) return false;
  // Segments with "and" as connector are capped at 5 words (e.g. "Margo Wilson and Martin Daly")
  // vs. titles like "Evolutionary Social Psychology and Family Homicide" (6 words)
  const hasAnd = /\band\b/i.test(s);
  if (words.length > (hasAnd ? 5 : 10)) return false;
  return !NON_NAME_RE.test(s);
}

// Detects volume/issue/page info segments like "Vol. 44", "Issue 3", "No. 1", "pp. 12-30"
function isVolumeSegment(s: string): boolean {
  return /^(?:Vol|No|Issue|pp?)\.?\s*\d/i.test(s.trim());
}

/**
 * Split a plain content string (between [Key] and ", Year: URL") into components.
 * Uses a heuristic: leading segments with no prepositions/articles are authors;
 * trailing volume/issue segments + the preceding journal segment are venue;
 * the middle is the title.
 */
function parseContent(content: string): { authors: string | null; title: string; venue: string | null } {
  const parts = content.split(/,\s*/);

  // Consume author-like segments from the front, leaving at least one for title
  let i = 0;
  while (i < parts.length - 1 && isAuthorSegment(parts[i])) {
    i++;
  }

  const authors = i > 0 ? parts.slice(0, i).join(", ") : null;
  const rest = parts.slice(i);

  if (rest.length === 0) return { authors, title: content, venue: null };
  if (rest.length === 1) return { authors, title: rest[0], venue: null };

  // Determine venue: the last segment, plus any preceding volume/issue segments.
  // e.g. [..., "Social Problems", "Vol. 39 No. 1"] → venue = "Social Problems, Vol. 39 No. 1"
  let venueStart = rest.length - 1;
  while (venueStart > 0 && isVolumeSegment(rest[venueStart])) {
    venueStart--;
  }

  const venue = rest.slice(venueStart).join(", ");
  const title = rest.slice(0, venueStart).join(", ");
  return { authors, title: title || venue, venue: title ? venue : null };
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

  const plain = line.match(PLAIN_RE);
  if (plain) {
    const [, key, content, yearStr, urlStr] = plain;
    const year = parseInt(yearStr, 10);
    const { authors, title, venue } = parseContent(content.trim());
    return {
      key: key.trim(),
      title: title.trim(),
      citation_authors: authors?.trim() || undefined,
      citation_year: year,
      citation_venue: venue?.trim() || undefined,
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
    return FULL_RE.test(t) || MINIMAL_RE.test(t) || PLAIN_RE.test(t);
  });
}