import { describe, test, expect } from "vitest";
import { parseReferenceLabel, extractDoi, parseLinksInput } from "../reference-parser";

// ─── parseReferenceLabel ───────────────────────────────────────────────────

describe("parseReferenceLabel", () => {
  test("authors - title (year)", () => {
    expect(
      parseReferenceLabel(
        "Klinge & Wiesemann - Sex and Gender in Biomedicine: Theories, Methodologies, Results (2010)",
      ),
    ).toEqual({
      title: "Sex and Gender in Biomedicine: Theories, Methodologies, Results",
      citation_authors: "Klinge & Wiesemann",
      citation_year: 2010,
    });
  });

  test("source - title, year", () => {
    expect(
      parseReferenceLabel("WHO - Violence against women prevalence estimates, 2023"),
    ).toEqual({
      title: "Violence against women prevalence estimates",
      citation_authors: "WHO",
      citation_year: 2023,
    });
  });

  test("source - title year (bare trailing year, no comma or parens)", () => {
    expect(parseReferenceLabel("UNODC - Global Study on Homicide 2023")).toEqual({
      title: "Global Study on Homicide",
      citation_authors: "UNODC",
      citation_year: 2023,
    });
  });

  test("source - title, no year", () => {
    expect(parseReferenceLabel("Wikipedia - Servizio militare di leva in Italia")).toEqual({
      title: "Servizio militare di leva in Italia",
      citation_authors: "Wikipedia",
      citation_year: undefined,
    });
  });

  test("no dash separator — whole label becomes the title", () => {
    expect(parseReferenceLabel("Some Title With No Dash")).toEqual({
      title: "Some Title With No Dash",
      citation_authors: undefined,
      citation_year: undefined,
    });
  });

  test("multi-word source containing a preposition is still split (no author-name heuristic)", () => {
    expect(
      parseReferenceLabel("Our World in Data - Life expectancy at birth, by sex"),
    ).toEqual({
      title: "Life expectancy at birth, by sex",
      citation_authors: "Our World in Data",
      citation_year: undefined,
    });
  });

  test("hyphenated words in the title don't trigger a false split", () => {
    expect(
      parseReferenceLabel(
        "Zhang et al. - Epidemiology of Hikikomori: A Systematic Review and Meta-analysis of 19 Studies (2025)",
      ),
    ).toEqual({
      title: "Epidemiology of Hikikomori: A Systematic Review and Meta-analysis of 19 Studies",
      citation_authors: "Zhang et al.",
      citation_year: 2025,
    });
  });

  test("only strips the trailing parenthesised year, not an earlier one in the title", () => {
    expect(
      parseReferenceLabel(
        "O'Malley et al. - An Exploration of the Involuntary Celibate (Incel) Subculture Online (2022)",
      ),
    ).toEqual({
      title: "An Exploration of the Involuntary Celibate (Incel) Subculture Online",
      citation_authors: "O'Malley et al.",
      citation_year: 2022,
    });
  });

  test("non-year parenthetical at the end is preserved in the title", () => {
    expect(
      parseReferenceLabel("OECD - Programme for International Student Assessment (PISA)"),
    ).toEqual({
      title: "Programme for International Student Assessment (PISA)",
      citation_authors: "OECD",
      citation_year: undefined,
    });
  });
});

// ─── extractDoi ─────────────────────────────────────────────────────────────

describe("extractDoi", () => {
  test("extracts DOI from a doi.org URL", () => {
    expect(extractDoi("https://doi.org/10.1177/088626099014012003")).toBe(
      "10.1177/088626099014012003",
    );
  });

  test("extracts DOI embedded in a publisher path (sagepub)", () => {
    expect(
      extractDoi("https://journals.sagepub.com/doi/10.1177/1077801210387747"),
    ).toBe("10.1177/1077801210387747");
  });

  test("extracts DOI embedded in a publisher path (wiley, with /full/)", () => {
    expect(
      extractDoi("https://onlinelibrary.wiley.com/doi/full/10.1111/pcn.13768"),
    ).toBe("10.1111/pcn.13768");
  });

  test("returns null when there is no DOI", () => {
    expect(extractDoi("https://www.who.int/publications/i/item/9789240116962")).toBeNull();
  });
});

// ─── parseLinksInput ────────────────────────────────────────────────────────

describe("parseLinksInput", () => {
  test("parses a single markdown-link reference", () => {
    const input =
      "[Klinge & Wiesemann - Sex and Gender in Biomedicine (2010)](https://tile.loc.gov/example.pdf)";
    const result = parseLinksInput(input);
    expect(result).toEqual([
      {
        type: "reference",
        url: "https://tile.loc.gov/example.pdf",
        title: "Sex and Gender in Biomedicine",
        citation_authors: "Klinge & Wiesemann",
        citation_year: 2010,
      },
    ]);
  });

  test("parses multiple references separated by ' | ' on one line", () => {
    const input =
      "> Fonti: [WHO - Violence against women, 2023](https://who.int/a) | [CDC - NISVS](https://cdc.gov/b)";
    const result = parseLinksInput(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ type: "reference", url: "https://who.int/a", citation_year: 2023 });
    expect(result[1]).toMatchObject({ type: "reference", url: "https://cdc.gov/b", title: "NISVS" });
  });

  test("does not double-count the URL inside a markdown link as a bare URL", () => {
    const input = "[Some Source - A Title (2020)](https://example.com/report.pdf)";
    const result = parseLinksInput(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("reference");
  });

  test("plain URLs not wrapped in markdown-link syntax are returned as 'url' items", () => {
    const input = "See https://example.com/plain for more.";
    expect(parseLinksInput(input)).toEqual([{ type: "url", url: "https://example.com/plain" }]);
  });

  test("mixes references and plain URLs, preserving reading order", () => {
    const input = [
      "Intro text.",
      "[Author - Title (2019)](https://example.com/ref)",
      "Then a bare link: https://example.com/bare",
    ].join("\n");
    const result = parseLinksInput(input);
    expect(result.map((r) => r.url)).toEqual([
      "https://example.com/ref",
      "https://example.com/bare",
    ]);
    expect(result[0].type).toBe("reference");
    expect(result[1].type).toBe("url");
  });

  test("ignores relative (internal) markdown links", () => {
    const input = "[internal page](/some/internal/path) and [external](https://example.com/x)";
    const result = parseLinksInput(input);
    expect(result).toEqual([
      { type: "reference", url: "https://example.com/x", title: "external" },
    ]);
  });

  test("deduplicates a URL that appears twice, keeping the first occurrence", () => {
    const input = [
      "[Ministero - Report A](https://interno.gov.it/x)",
      "[Ministero - Report B](https://interno.gov.it/x)",
    ].join("\n");
    const result = parseLinksInput(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ title: "Report A" });
  });

  test("returns an empty array for text with no links", () => {
    expect(parseLinksInput("Just plain prose, nothing to see here.")).toEqual([]);
  });
});
