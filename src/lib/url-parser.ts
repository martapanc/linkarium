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

export function extractUrls(input: string): string[] {
  const matches = input.match(URL_REGEX);
  if (!matches) return [];

  // Deduplicate, preserving order
  return [...new Set(matches)];
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
