import ogs from "open-graph-scraper";
import { extractDomain } from "./url-parser";
import { isYouTubeUrl, scrapeYouTube } from "./youtube";
import type { ScrapeResult } from "./types";

const SCRAPE_TIMEOUT_MS = 8000;

function isPdfUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return /\.pdf$/i.test(path);
  } catch {
    return false;
  }
}

function titleFromPdfUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname;
    const filename = path.split("/").pop() ?? "";
    const name = decodeURIComponent(filename.replace(/\.pdf$/i, ""));
    return name.replace(/[-_]+/g, " ").trim() || null;
  } catch {
    return null;
  }
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const domain = extractDomain(url);

  if (isPdfUrl(url)) {
    return {
      url,
      title: titleFromPdfUrl(url),
      description: null,
      image_url: null,
      favicon_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      domain,
      author: null,
    };
  }

  // YouTube's OG tags carry the description but not the channel name, so pair
  // the regular scrape with a oEmbed lookup and merge the two.
  if (isYouTubeUrl(url)) {
    const [og, youtube] = await Promise.all([scrapeOpenGraph(url), scrapeYouTube(url)]);
    if (!youtube) return og;
    return {
      ...og,
      title: youtube.title || og.title,
      image_url: og.image_url || youtube.image_url,
      author: youtube.author,
    };
  }

  return scrapeOpenGraph(url);
}

async function scrapeOpenGraph(url: string): Promise<ScrapeResult> {
  const domain = extractDomain(url);

  try {
    const { result } = await ogs({
      url,
      timeout: SCRAPE_TIMEOUT_MS,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; Linkarium/1.0; +https://likarium.app)",
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
      author: null,
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
      author: null,
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
