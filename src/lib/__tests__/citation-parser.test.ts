import { describe, test, expect } from "vitest";
import { parseCitations, looksLikeCitations } from "../citation-parser";

// ─── parseCitations ────────────────────────────────────────────────────────

describe("parseCitations — full format: [Key] Authors, _Title_, Venue, Year[: URL]", () => {
  test("parses all fields including URL", () => {
    const result = parseCitations(
      "[Archer 1999] John Archer, _Assessment of the Reliability of the Conflict Tactics Scales_, Journal of Interpersonal Violence, 1999: https://doi.org/10.1177/088626099014006003",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "Archer 1999",
      title: "Assessment of the Reliability of the Conflict Tactics Scales",
      citation_authors: "John Archer",
      citation_venue: "Journal of Interpersonal Violence",
      citation_year: 1999,
      url: "https://doi.org/10.1177/088626099014006003",
    });
  });

  test("parses without URL", () => {
    const result = parseCitations(
      "[Smith 2020] Jane Smith, _New Paper Title_, Nature, 2020",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "Smith 2020",
      title: "New Paper Title",
      citation_authors: "Jane Smith",
      citation_venue: "Nature",
      citation_year: 2020,
    });
    expect(result[0].url).toBeUndefined();
  });

  test("handles multiple authors", () => {
    const result = parseCitations(
      "[Smith et al. 2020] Jane Smith, Bob Lee, _Collaborative Study_, Science, 2020",
    );
    expect(result[0]).toMatchObject({
      key: "Smith et al. 2020",
      citation_authors: "Jane Smith, Bob Lee",
      title: "Collaborative Study",
      citation_venue: "Science",
      citation_year: 2020,
    });
  });

  test("handles title with commas inside underscores", () => {
    const result = parseCitations(
      "[A 2000] Author, _Title: Subtitle, Part 2_, Venue, 2000",
    );
    expect(result[0].title).toBe("Title: Subtitle, Part 2");
  });
});

describe("parseCitations — minimal format: [Key] [Authors, ]_Title_[: URL]", () => {
  test("parses title-only with URL", () => {
    const result = parseCitations(
      "[AlmaLaurea 2025] _Sintesi del Rapporto_: https://example.com/report",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "AlmaLaurea 2025",
      title: "Sintesi del Rapporto",
      citation_year: 2025,
      url: "https://example.com/report",
    });
    expect(result[0].citation_authors).toBeUndefined();
  });

  test("parses with authors but no venue/year field, extracts year from key", () => {
    const result = parseCitations(
      "[Archer 1999] John Archer, _Assessment of the Reliability_",
    );
    expect(result[0]).toMatchObject({
      key: "Archer 1999",
      citation_authors: "John Archer",
      title: "Assessment of the Reliability",
      citation_year: 1999,
    });
    expect(result[0].citation_venue).toBeUndefined();
  });

  test("extracts year from key when year not explicit in body", () => {
    const result = parseCitations("[Report 2023] _Annual Report_");
    expect(result[0].citation_year).toBe(2023);
  });

  test("parses minimal with no authors and no URL", () => {
    const result = parseCitations("[WHO 2022] _World Health Report_");
    expect(result[0]).toMatchObject({
      key: "WHO 2022",
      title: "World Health Report",
      citation_year: 2022,
    });
  });
});

describe("parseCitations — plain format: [Key] Authors, Title, Venue, Year[: URL]", () => {
  // The plain-format author heuristic stops when a segment contains a preposition
  // (of, in, on, etc.), so titles should contain at least one such word.

  test("parses all fields with URL", () => {
    const result = parseCitations(
      "[Smith 2024] Jane Smith, Effects of Technology on Learning, Journal of Education, 2024: https://example.com",
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "Smith 2024",
      title: "Effects of Technology on Learning",
      citation_authors: "Jane Smith",
      citation_year: 2024,
      url: "https://example.com",
    });
  });

  test("parses without URL", () => {
    const result = parseCitations(
      "[Smith 2024] Jane Smith, Effects of Technology on Learning, Journal of Education, 2024",
    );
    expect(result[0]).toMatchObject({
      title: "Effects of Technology on Learning",
      citation_year: 2024,
    });
    expect(result[0].url).toBeUndefined();
  });

  test("handles multiple authors in plain format", () => {
    const result = parseCitations(
      "[Team 2021] Alice Brown, Charlie Davis, Impact of Media on Society, Psychology Today, 2021",
    );
    expect(result[0].citation_authors).toBe("Alice Brown, Charlie Davis");
    expect(result[0].title).toBe("Impact of Media on Society");
  });
});

describe("parseCitations — multi-line input", () => {
  test("parses multiple citations from a block of text", () => {
    const input = [
      "[Archer 1999] John Archer, _Assessment of the Reliability_, Journal, 1999",
      "[Smith 2020] Jane Smith, _New Paper_, Nature, 2020",
      "[Lee 2023] Bob Lee, Plain Title, Conference, 2023",
    ].join("\n");
    const result = parseCitations(input);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.key)).toEqual(["Archer 1999", "Smith 2020", "Lee 2023"]);
  });

  test("skips non-citation lines silently", () => {
    const input = [
      "[Archer 1999] John Archer, _Title_, Journal, 1999",
      "Not a citation",
      "https://example.com",
      "[Smith 2020] Jane Smith, _Another Title_, Nature, 2020",
    ].join("\n");
    const result = parseCitations(input);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe("Archer 1999");
    expect(result[1].key).toBe("Smith 2020");
  });

  test("blank lines between citations are ignored", () => {
    const input = [
      "[A 2000] Author, _Title A_, Venue, 2000",
      "",
      "[B 2001] Author, _Title B_, Venue, 2001",
    ].join("\n");
    expect(parseCitations(input)).toHaveLength(2);
  });

  test("mixed formats in a single batch all parse correctly", () => {
    const input = [
      "[Full 1999] Author, _Full Format Title_, Venue, 1999",
      "[Minimal 2000] _Minimal Format Title_: https://example.com",
      // Plain format: title must contain a preposition for the author heuristic to work
      "[Plain 2001] Author, Study of Learning in Schools, Conference, 2001",
    ].join("\n");
    const result = parseCitations(input);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Full Format Title");
    expect(result[1].title).toBe("Minimal Format Title");
    expect(result[2].title).toBe("Study of Learning in Schools");
  });
});

describe("parseCitations — edge cases", () => {
  test("returns empty array for empty string", () => {
    expect(parseCitations("")).toEqual([]);
  });

  test("returns empty array for plain URLs", () => {
    expect(parseCitations("https://example.com\nhttps://example.org")).toEqual([]);
  });

  test("returns empty array for plain prose", () => {
    expect(parseCitations("Hello world, this is not a citation.")).toEqual([]);
  });

  test("includes the key field on each result", () => {
    const result = parseCitations("[Cushman 2006] Penni Cushman, _Study_, Journal, 2006");
    expect(result[0].key).toBe("Cushman 2006");
  });
});

// ─── looksLikeCitations ────────────────────────────────────────────────────

describe("looksLikeCitations", () => {
  test("returns true for a full-format citation", () => {
    expect(
      looksLikeCitations("[Archer 1999] John Archer, _Title_, Journal, 1999"),
    ).toBe(true);
  });

  test("returns true for a minimal-format citation", () => {
    expect(looksLikeCitations("[Report 2023] _Annual Report_")).toBe(true);
  });

  test("returns true for a plain-format citation", () => {
    expect(
      looksLikeCitations("[Smith 2024] Jane Smith, Title, Journal, 2024"),
    ).toBe(true);
  });

  test("returns true for mixed text that contains at least one citation line", () => {
    const input =
      "https://example.com\n[Smith 2020] Jane Smith, _Title_, Nature, 2020";
    expect(looksLikeCitations(input)).toBe(true);
  });

  test("returns false for plain URLs only", () => {
    expect(
      looksLikeCitations("https://example.com\nhttps://example.org"),
    ).toBe(false);
  });

  test("returns false for plain prose", () => {
    expect(looksLikeCitations("hello world\nno citations here")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(looksLikeCitations("")).toBe(false);
  });
});
