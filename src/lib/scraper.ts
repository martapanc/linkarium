import ogs from "open-graph-scraper";
import { extractDomain } from "./url-parser";
import type { ScrapeResult } from "./types";

const SCRAPE_TIMEOUT_MS = 8000;

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const domain = extractDomain(url);

  try {
    const { result } = await ogs({
      url,
      timeout: SCRAPE_TIMEOUT_MS,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; LinkDrop/1.0; +https://linkdrop.app)",
        },
      },
    });

    const imageUrl =
      result.ogImage?.[0]?.url ||
      result.twitterImage?.[0]?.url ||
      null;

    // Attempt to build a favicon URL
    const favicon = buildFaviconUrl(url, result.favicon);

    return {
      url,
      title: result.ogTitle || result.dcTitle || result.twitterTitle || null,
      description:
        result.ogDescription ||
        result.dcDescription ||
        result.twitterDescription ||
        null,
      image_url: imageUrl,
      favicon_url: favicon,
      domain,
    };
  } catch (error) {
    console.warn(`[scraper] Failed to scrape ${url}:`, error);
    return {
      url,
      title: null,
      description: null,
      image_url: null,
      favicon_url: buildFaviconUrl(url, undefined),
      domain,
    };
  }
}

/**
 * Scrape multiple URLs concurrently with a concurrency limit.
 */
export async function scrapeUrls(
  urls: string[],
  concurrency = 5,
): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(scrapeUrl));

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }
  }

  return results;
}

function buildFaviconUrl(
  pageUrl: string,
  faviconPath: string | undefined,
): string {
  try {
    const parsed = new URL(pageUrl);

    // If OGS found a favicon path, resolve it
    if (faviconPath) {
      return new URL(faviconPath, parsed.origin).href;
    }

    // Fallback: Google's favicon service
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return "";
  }
}
