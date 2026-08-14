import { extractUrlsWithIndex, isValidUrl } from "./url-parser";

/**
 * Extracts structured references and plain URLs from raw text, in reading order.
 *
 * A "reference" is a markdown link `[label](url)` — the kind produced by pasting
 * a bibliography or a blog post's source list. The label is parsed into
 * title / authors / year using common patterns:
 *
 *   [Klinge & Wiesemann - Sex and Gender in Biomedicine (2010)](url)
 *   [WHO - Violence against women prevalence estimates, 2023](url)
 *   [UNODC - Global Study on Homicide 2023](url)
 *   [Wikipedia - Servizio militare di leva in Italia](url)   (no year)
 *   [Some Title With No Dash](url)                            (no authors detected)
 *
 * Anything that looks like a URL but isn't wrapped in `[label](...)` markdown-link
 * syntax is returned as a plain "url" item instead, to be handled by OG scraping.
 */

export interface ParsedReference {
  type: "reference";
  url: string;
  title: string;
  citation_authors?: string;
  citation_year?: number;
}

export interface ParsedPlainUrl {
  type: "url";
  url: string;
}

export type ParsedLinkItem = ParsedReference | ParsedPlainUrl;

const MARKDOWN_LINK_RE = /\[([^[\]]+)\]\(([^()\s]+(?:\([^()\s]*\)[^()\s]*)*)\)/g;

// Trailing year, tried in order of specificity:
const YEAR_IN_PARENS_RE = /\s*\((\d{4})\)\s*$/; // "... (2010)"
const YEAR_WITH_COMMA_RE = /,\s*(\d{4})\s*$/; // "..., 2023"
const YEAR_BARE_RE = /\s(\d{4})\s*$/; // "... 2023"

// A space-dash-space (hyphen or en-dash) that separates "Source/Authors - Title".
// Requires whitespace on both sides so hyphenated words ("Meta-analysis", "Sex-Informed")
// are never mistaken for the separator.
const DASH_SPLIT_RE = /\s[-–]\s/;

// Standard DOI shape: 10.<4-9 digits>/<suffix>. Matches doi.org links as well as
// DOIs embedded in publisher paths (e.g. sagepub.com/doi/10.1177/..., wiley.com/doi/full/10.1111/...).
const DOI_RE = /10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+/;

/** Extract a DOI from a URL, if one is present anywhere in it. */
export function extractDoi(url: string): string | null {
  const m = url.match(DOI_RE);
  return m ? m[0].replace(/[.,;]+$/, "") : null;
}

/** Split a markdown-link label into title / authors / year using common bibliography shapes. */
export function parseReferenceLabel(label: string): {
  title: string;
  citation_authors?: string;
  citation_year?: number;
} {
  let rest = label.trim();
  let citation_year: number | undefined;

  for (const re of [YEAR_IN_PARENS_RE, YEAR_WITH_COMMA_RE, YEAR_BARE_RE]) {
    const m = rest.match(re);
    if (m?.index !== undefined) {
      citation_year = parseInt(m[1], 10);
      rest = rest.slice(0, m.index).trim();
      break;
    }
  }

  rest = rest.replace(/[,;:\s-]+$/, "").trim();

  const dashMatch = rest.match(DASH_SPLIT_RE);
  if (dashMatch?.index !== undefined) {
    const citation_authors = rest.slice(0, dashMatch.index).trim();
    const title = rest.slice(dashMatch.index + dashMatch[0].length).trim();
    if (citation_authors && title) {
      return { title, citation_authors, citation_year };
    }
  }

  return { title: rest, citation_year };
}

/** Replace each [start, end) range in `text` with spaces, preserving length and other offsets. */
function maskRanges(text: string, ranges: Array<[number, number]>): string {
  if (!ranges.length) return text;
  const chars = text.split("");
  for (const [start, end] of ranges) {
    for (let i = start; i < end && i < chars.length; i++) chars[i] = " ";
  }
  return chars.join("");
}

/**
 * Parse raw text into an ordered list of references (markdown links, with
 * title/authors/year extracted from the label) and plain bare URLs. Order
 * matches the order items appear in the source text. Deduplicates by URL,
 * keeping the first occurrence.
 */
export function parseLinksInput(text: string): ParsedLinkItem[] {
  const seenUrls = new Set<string>();

  const refs: Array<{ start: number; end: number } & ParsedReference> = [];
  const mdRegex = new RegExp(MARKDOWN_LINK_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = mdRegex.exec(text))) {
    const label = m[1].trim();
    const rawUrl = m[2].trim();
    if (!label || !isValidUrl(rawUrl) || seenUrls.has(rawUrl)) continue;
    seenUrls.add(rawUrl);
    const parsed = parseReferenceLabel(label);
    refs.push({
      type: "reference",
      start: m.index,
      end: m.index + m[0].length,
      url: rawUrl,
      ...parsed,
    });
  }

  // Blank out the markdown-link spans before scanning for bare URLs, so the
  // URL embedded inside `[label](url)` isn't also picked up as a plain URL.
  const masked = maskRanges(text, refs.map((r): [number, number] => [r.start, r.end]));
  const plainUrls = extractUrlsWithIndex(masked).filter(({ url }) => {
    if (seenUrls.has(url)) return false;
    seenUrls.add(url);
    return true;
  });

  const combined: Array<{ start: number } & ParsedLinkItem> = [
    ...refs.map((r) => ({
      start: r.start,
      type: r.type,
      url: r.url,
      title: r.title,
      citation_authors: r.citation_authors,
      citation_year: r.citation_year,
    })),
    ...plainUrls.map(({ url, index }) => ({ start: index, type: "url" as const, url })),
  ];

  combined.sort((a, b) => a.start - b.start);
  return combined.map(({ start, ...rest }) => rest);
}
