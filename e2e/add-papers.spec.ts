/**
 * E2E tests for adding paper/citation references to an existing list.
 *
 * When citation-formatted text is pasted into the "Add links" textarea,
 * looksLikeCitations() detects it and the form routes to the papers API.
 * These tests verify that the UI handles the auto-detection and renders
 * paper cards correctly.
 *
 * POST /api/links is mocked so no Crossref or OG scraping occurs.
 */
import { type Page } from "@playwright/test";
import { test, expect, injectWriteToken, makePaperFixture, makeLinkFixture } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await injectWriteToken(page);
});

// ─── helpers ──────────────────────────────────────────────────────────────

function mockLinksPost(
  page: Page,
  papers: ReturnType<typeof makePaperFixture>[],
  duplicatesSkipped = 0,
) {
  return page.route("**/api/links", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ links: papers, duplicatesSkipped }),
      });
    } else {
      await route.continue();
    }
  });
}

async function openAddLinksForm(page: Page) {
  await page.getByRole("button", { name: "Add links" }).click();
}

async function fillAndSubmit(
  page: Page,
  text: string,
) {
  await page.getByRole("textbox").fill(text);
  await page.getByRole("button", { name: "Add links" }).last().click();
}

// ─── tests ────────────────────────────────────────────────────────────────

test("adds a full-format citation (_Title_ with underscores)", async ({
  page,
  listId,
}) => {
  const paper = makePaperFixture(listId, {
    title: "Assessment of the Reliability of the Conflict Tactics Scales",
    citation_authors: "John Archer",
    citation_year: 1999,
    citation_venue: "Journal of Interpersonal Violence",
  });
  await mockLinksPost(page, [paper]);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  const citation =
    "[Archer 1999] John Archer, _Assessment of the Reliability of the Conflict Tactics Scales_, Journal of Interpersonal Violence, 1999";
  await fillAndSubmit(page, citation);

  await expect(page.getByText("Added 1 paper")).toBeVisible();
  await expect(
    page.getByText("Assessment of the Reliability of the Conflict Tactics Scales"),
  ).toBeVisible();
});

test("adds a plain-format citation (no underscores)", async ({
  page,
  listId,
}) => {
  const paper = makePaperFixture(listId, {
    title: "Effects of Technology on Learning",
    citation_authors: "Jane Smith",
    citation_year: 2024,
  });
  await mockLinksPost(page, [paper]);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  // Plain format — no underscore markup; title identified via preposition heuristic
  await fillAndSubmit(
    page,
    "[Smith 2024] Jane Smith, Effects of Technology on Learning, Journal of Education, 2024",
  );

  await expect(page.getByText("Added 1 paper")).toBeVisible();
  await expect(page.getByText("Effects of Technology on Learning")).toBeVisible();
});

test("adds a minimal-format citation (title only)", async ({
  page,
  listId,
}) => {
  const paper = makePaperFixture(listId, {
    title: "Sintesi del Rapporto",
    citation_year: 2025,
    url: "https://example.com/report",
  });
  await mockLinksPost(page, [paper]);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  await fillAndSubmit(
    page,
    "[AlmaLaurea 2025] _Sintesi del Rapporto_: https://example.com/report",
  );

  await expect(page.getByText("Added 1 paper")).toBeVisible();
});

test("adds multiple batch citations in one paste", async ({
  page,
  listId,
}) => {
  const papers = [
    makePaperFixture(listId, {
      title: "Assessment of the Reliability of the Conflict Tactics Scales",
      citation_authors: "John Archer",
      citation_year: 1999,
      position: 0,
    }),
    makePaperFixture(listId, {
      title: "Study of Evolutionary Psychology",
      citation_authors: "Jane Smith",
      citation_year: 2020,
      position: 1,
    }),
  ];
  await mockLinksPost(page, papers);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  const batch = [
    "[Archer 1999] John Archer, _Assessment of the Reliability of the Conflict Tactics Scales_, Journal, 1999",
    "[Smith 2020] Jane Smith, _Study of Evolutionary Psychology_, Nature, 2020",
  ].join("\n");
  await fillAndSubmit(page, batch);

  await expect(page.getByText("Added 2 papers")).toBeVisible();
  await expect(
    page.getByText("Assessment of the Reliability of the Conflict Tactics Scales"),
  ).toBeVisible();
  await expect(page.getByText("Study of Evolutionary Psychology")).toBeVisible();
});

test("shows 'already in list — skipped' for duplicate citations", async ({
  page,
  listId,
}) => {
  await mockLinksPost(page, [], 1);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  await fillAndSubmit(
    page,
    "[Archer 1999] John Archer, _Assessment of the Reliability_, Journal, 1999",
  );

  await expect(page.getByText("1 already in list — skipped")).toBeVisible();
});

test("combined message when some papers are new and some are duplicates", async ({
  page,
  listId,
}) => {
  const papers = [
    makePaperFixture(listId, {
      title: "Study of Evolutionary Psychology",
      citation_year: 2020,
    }),
  ];
  await mockLinksPost(page, papers, 1);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  const batch = [
    "[Archer 1999] John Archer, _Assessment of the Reliability_, Journal, 1999",
    "[Smith 2020] Jane Smith, _Study of Evolutionary Psychology_, Nature, 2020",
  ].join("\n");
  await fillAndSubmit(page, batch);

  await expect(
    page.getByText("Added 1 paper (1 already in list — skipped)"),
  ).toBeVisible();
});

test("plain URLs in the same paste are also submitted (mix fix)", async ({
  page,
  listId,
}) => {
  // This tests the fix: when a paste contains both a citation line AND a plain URL,
  // both are processed — citations via the papers API, URLs via the links API.
  const callLog: string[] = [];

  await page.route("**/api/links", async (route) => {
    if (route.request().method() === "POST") {
      const body = await route.request().postDataJSON();
      callLog.push(body.papers ? "papers" : "urls");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          links: body.papers
            ? [makePaperFixture(listId, { title: "Assessment of the Reliability", citation_year: 1999 })]
            : [makeLinkFixture(listId, { url: "https://example.com", title: "Example", domain: "example.com" })],
          duplicatesSkipped: 0,
        }),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  const mixedInput = [
    "[Archer 1999] John Archer, _Assessment of the Reliability_, Journal, 1999",
    "https://example.com",
  ].join("\n");
  await fillAndSubmit(page, mixedInput);

  // Both papers and URLs calls should have been made
  await expect(page.getByText("Added 1 paper")).toBeVisible();
  expect(callLog).toContain("papers");
  expect(callLog).toContain("urls");
});

