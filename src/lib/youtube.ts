import { extractDomain } from "./url-parser";
import type { ScrapeResult } from "./types";

const OEMBED_TIMEOUT_MS = 6000;

interface YouTubeOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

/**
 * Extract the 11-char video id from any common YouTube URL shape:
 * watch?v=, youtu.be/, /embed/, /shorts/, /live/.
 */
export function extractYouTubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const isValid = (id: string | undefined | null) =>
    id && /^[\w-]{11}$/.test(id) ? id : null;

  if (host === "youtu.be") {
    return isValid(parsed.pathname.split("/")[1]);
  }

  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtube-nocookie.com") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments[0] === "watch") {
    return isValid(parsed.searchParams.get("v"));
  }
  if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) {
    return isValid(segments[1]);
  }

  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Fetch title + channel name via YouTube's public oEmbed endpoint (no API key).
 * Returns null when the video is unavailable or the request fails, so callers
 * can fall back to regular OG scraping.
 */
export async function scrapeYouTube(url: string): Promise<ScrapeResult | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as YouTubeOEmbed;
    if (!data.title) return null;

    return {
      url,
      title: data.title,
      description: null,
      image_url: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      favicon_url: "https://www.youtube.com/favicon.ico",
      domain: extractDomain(url),
      author: data.author_name || null,
    };
  } catch (error) {
    console.warn(`[youtube] oEmbed lookup failed for ${url}:`, error);
    return null;
  }
}
