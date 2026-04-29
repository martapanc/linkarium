import { describe, test, expect } from "vitest";
import { extractUrls, extractDomain, isValidUrl } from "../url-parser";

// ─── extractUrls ───────────────────────────────────────────────────────────

describe("extractUrls", () => {
  test("extracts a single https URL", () => {
    expect(extractUrls("https://example.com")).toEqual(["https://example.com"]);
  });

  test("extracts a single http URL", () => {
    expect(extractUrls("http://example.com")).toEqual(["http://example.com"]);
  });

  test("extracts multiple newline-separated URLs", () => {
    const input =
      "https://example.com\nhttps://example.org\nhttps://playwright.dev";
    expect(extractUrls(input)).toEqual([
      "https://example.com",
      "https://example.org",
      "https://playwright.dev",
    ]);
  });

  test("extracts URLs embedded in prose", () => {
    const input = "Check out https://example.com and also https://example.org for more";
    expect(extractUrls(input)).toEqual([
      "https://example.com",
      "https://example.org",
    ]);
  });

  test("deduplicates repeated URLs, preserving first occurrence", () => {
    const input =
      "https://example.com\nhttps://example.org\nhttps://example.com";
    expect(extractUrls(input)).toEqual([
      "https://example.com",
      "https://example.org",
    ]);
  });

  test("preserves order of first occurrences", () => {
    const input = "https://b.com\nhttps://a.com\nhttps://b.com\nhttps://c.com";
    expect(extractUrls(input)).toEqual([
      "https://b.com",
      "https://a.com",
      "https://c.com",
    ]);
  });

  test("ignores bare domains without protocol", () => {
    expect(extractUrls("example.com\nwww.example.org")).toEqual([]);
  });

  test("extracts URL with path, query params, and fragment", () => {
    const url = "https://example.com/path/to/page?q=test&page=1#section";
    expect(extractUrls(url)).toEqual([url]);
  });

  test("extracts DOI URLs", () => {
    const url = "https://doi.org/10.1177/088626099014006003";
    expect(extractUrls(url)).toContain(url);
  });

  test("handles URLs in citation text (embedded at end of citation line)", () => {
    const input =
      "[Archer 1999] John Archer, _Title_, Journal, 1999: https://doi.org/10.1234";
    expect(extractUrls(input)).toEqual(["https://doi.org/10.1234"]);
  });

  test("returns empty array for empty input", () => {
    expect(extractUrls("")).toEqual([]);
  });

  test("returns empty array for text with no URLs", () => {
    expect(extractUrls("hello world, no links here")).toEqual([]);
  });

  test("returns empty array for citation text without embedded URLs", () => {
    const input = "[Smith 2020] Jane Smith, _Title_, Nature, 2020";
    expect(extractUrls(input)).toEqual([]);
  });

  // ─── trailing punctuation stripping ───────────────────────────────────

  test("strips unbalanced trailing ) from markdown [text](url) syntax", () => {
    const input =
      "Vedi [dati di traffico](https://www.ilpost.it/2025/08/28/chiusura-phica-eu/), poco prima";
    expect(extractUrls(input)).toEqual([
      "https://www.ilpost.it/2025/08/28/chiusura-phica-eu/",
    ]);
  });

  test("preserves balanced parentheses in Wikipedia-style URLs", () => {
    const url =
      "https://en.wikipedia.org/wiki/Python_(programming_language)";
    expect(extractUrls(url)).toEqual([url]);
  });

  test("strips trailing period from URL at end of sentence", () => {
    expect(extractUrls("See https://example.com.")).toEqual([
      "https://example.com",
    ]);
  });

  test("strips trailing comma after URL in prose", () => {
    const input = "Try https://example.com, then https://example.org.";
    expect(extractUrls(input)).toEqual([
      "https://example.com",
      "https://example.org",
    ]);
  });

  test("does not strip trailing / (valid URL component)", () => {
    expect(extractUrls("https://example.com/path/")).toEqual([
      "https://example.com/path/",
    ]);
  });
});

// ─── extractDomain ─────────────────────────────────────────────────────────

describe("extractDomain", () => {
  test("strips www. prefix", () => {
    expect(extractDomain("https://www.example.com/path")).toBe("example.com");
  });

  test("keeps non-www subdomains", () => {
    expect(extractDomain("https://blog.example.com")).toBe("blog.example.com");
  });

  test("handles URL without path", () => {
    expect(extractDomain("https://example.com")).toBe("example.com");
  });

  test("handles URL with port", () => {
    expect(extractDomain("https://example.com:8080/path")).toBe("example.com");
  });

  test("returns the input unchanged for invalid URLs", () => {
    expect(extractDomain("not-a-url")).toBe("not-a-url");
  });
});

// ─── isValidUrl ────────────────────────────────────────────────────────────

describe("isValidUrl", () => {
  test("returns true for https URL", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  test("returns true for http URL", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  test("returns true for URL with path and params", () => {
    expect(isValidUrl("https://example.com/path?q=1")).toBe(true);
  });

  test("returns false for bare domain without protocol", () => {
    expect(isValidUrl("example.com")).toBe(false);
  });

  test("returns false for ftp URL", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });

  test("returns false for plain text", () => {
    expect(isValidUrl("not a url at all")).toBe(false);
  });
});
