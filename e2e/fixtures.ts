/**
 * Playwright fixtures for Linkarium E2E tests.
 *
 * Prerequisites:
 *  - `yarn dev` is running (or `PLAYWRIGHT_BASE_URL` points to a running server)
 *  - Supabase is running locally (`supabase start`)
 *  - `WRITE_SECRET` in `.env` matches the server's WRITE_SECRET
 */
import { test as base, type Page } from "@playwright/test";
import type { DbLink } from "../src/lib/types";

const WRITE_TOKEN = process.env.WRITE_SECRET ?? "";

// ─── test fixture ─────────────────────────────────────────────────────────

export const test = base.extend<{
  /** ID of a fresh list created for the test. Cleaned up via soft-delete after. */
  listId: string;
}>({
  listId: async ({ request }, use) => {
    if (!WRITE_TOKEN) {
      throw new Error(
        "WRITE_SECRET must be set in .env to run E2E tests (needed to create test lists).",
      );
    }

    const res = await request.post("/api/lists", {
      data: { title: "Playwright Test List" },
      headers: {
        "Content-Type": "application/json",
        "x-write-token": WRITE_TOKEN,
      },
    });

    if (!res.ok()) {
      throw new Error(
        `Failed to create test list: HTTP ${res.status()} — ${await res.text()}`,
      );
    }

    const { list } = await res.json();
    await use(list.id as string);

    // Soft-delete the test list so it doesn't accumulate
    await request.patch("/api/lists", {
      data: { id: list.id, deleted: true },
      headers: {
        "Content-Type": "application/json",
        "x-write-token": WRITE_TOKEN,
      },
    });
  },
});

export { expect } from "@playwright/test";

// ─── helpers ──────────────────────────────────────────────────────────────

/**
 * Injects the write token into sessionStorage before the page loads.
 * Call this in beforeEach so every page.goto() sees the token.
 */
export async function injectWriteToken(page: Page) {
  await page.addInitScript((token) => {
    sessionStorage.setItem("linkarium_write_token", token);
  }, WRITE_TOKEN);
}

/** Builds a minimal DbLink-shaped object for use in mocked API responses. */
export function makeLinkFixture(
  listId: string,
  overrides: Partial<DbLink> & { url: string; title: string; domain: string },
): DbLink {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    list_id: listId,
    link_type: "url",
    description: null,
    author: null,
    image_url: null,
    favicon_url: `https://www.google.com/s2/favicons?domain=${overrides.domain}&sz=64`,
    position: 0,
    created_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
    doi: null,
    citation_authors: null,
    citation_year: null,
    citation_venue: null,
    pdf_url: null,
    ...overrides,
  };
}

/** Builds a minimal paper-shaped DbLink for use in mocked API responses. */
export function makePaperFixture(
  listId: string,
  overrides: Partial<DbLink> & { title: string },
): DbLink {
  return {
    id: `test-${Math.random().toString(36).slice(2)}`,
    list_id: listId,
    link_type: "paper",
    url: null,
    description: null,
    author: null,
    image_url: null,
    favicon_url: null,
    domain: null,
    position: 0,
    created_at: new Date().toISOString(),
    scraped_at: null,
    doi: null,
    citation_authors: null,
    citation_year: null,
    citation_venue: null,
    pdf_url: null,
    ...overrides,
  };
}
