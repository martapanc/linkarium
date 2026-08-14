/**
 * Extract valid URLs from raw text input.
 * Handles:
 *  - Newline-separated URLs
 *  - Space-separated URLs
 *  - URLs mixed with plain text
 *  - Deduplication
 * Requires https?:// prefix to avoid false positives (e.g. author initials like M.A.)
 */

const URL_REGEX =
  /https?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

/**
 * Strip trailing punctuation that terminates a sentence rather than a URL.
 * Handles:
 *  - Unbalanced trailing ) from markdown [text](url) or prose (url)
 *  - Trailing . , ; : ! ? from sentence punctuation
 * Preserves balanced parens for Wikipedia-style URLs like /wiki/Foo_(bar).
 */
function trimTrailingPunctuation(url: string): string {
  let result = url;
  let changed = true;
  while (changed) {
    changed = false;
    const stripped = result.replace(/[.,;:!?]+$/, "");
    if (stripped !== result) {
      result = stripped;
      changed = true;
      continue;
    }
    if (result.endsWith(")")) {
      const opens = (result.match(/\(/g) ?? []).length;
      const closes = (result.match(/\)/g) ?? []).length;
      if (closes > opens) {
        result = result.slice(0, -1);
        changed = true;
      }
    }
  }
  return result;
}

/** Like extractUrls, but also returns each match's character offset in the input. */
export function extractUrlsWithIndex(input: string): { url: string; index: number }[] {
  const regex = new RegExp(URL_REGEX.source, "gi");
  const out: { url: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(input))) {
    const url = trimTrailingPunctuation(m[0]);
    if (url) out.push({ url, index: m.index });
  }
  return out;
}

export function extractUrls(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const { url } of extractUrlsWithIndex(input)) {
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
