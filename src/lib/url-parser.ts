/**
 * Extract valid URLs from raw text input.
 * Handles:
 *  - Newline-separated URLs
 *  - Space-separated URLs
 *  - URLs mixed with plain text
 *  - URLs with or without protocol
 *  - Deduplication
 */

const URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

export function extractUrls(input: string): string[] {
  const matches = input.match(URL_REGEX);
  if (!matches) return [];

  const normalised = matches.map((url) => {
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  });

  // Deduplicate, preserving order
  return [...new Set(normalised)];
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
