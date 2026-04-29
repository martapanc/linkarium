/**
 * E2E tests for adding URL links to an existing list.
 *
 * These tests mock POST /api/links so no real scraping happens;
 * the UI behaviour (state updates, toasts, link cards) is what's being verified.
 */
import { type Page } from "@playwright/test";
import { test, expect, injectWriteToken, makeLinkFixture } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await injectWriteToken(page);
});

// ─── helpers ──────────────────────────────────────────────────────────────

function mockLinksPost(
  page: Page,
  links: ReturnType<typeof makeLinkFixture>[],
  duplicatesSkipped = 0,
) {
  return page.route("**/api/links", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ links, duplicatesSkipped }),
      });
    } else {
      await route.continue();
    }
  });
}

async function openAddLinksForm(page: Page) {
  await page.getByRole("button", { name: "Add links" }).click();
}

async function submitLinks(
  page: Page,
  text: string,
) {
  await page.getByRole("textbox").fill(text);
  // The submit button also says "Add links"; it's inside the open form
  await page.getByRole("button", { name: "Add links" }).last().click();
}

// ─── tests ────────────────────────────────────────────────────────────────

test("adds pasted URLs and shows success toast", async ({ page, listId }) => {
  const links = [
    makeLinkFixture(listId, {
      url: "https://example.com",
      title: "Example Domain",
      domain: "example.com",
      position: 0,
    }),
    makeLinkFixture(listId, {
      url: "https://playwright.dev",
      title: "Playwright",
      domain: "playwright.dev",
      position: 1,
    }),
  ];
  await mockLinksPost(page, links);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);
  await submitLinks(page, "https://example.com\nhttps://playwright.dev");

  await expect(page.getByText("Added 2 links")).toBeVisible();
  await expect(page.getByText("example.com")).toBeVisible();
  await expect(page.getByText("playwright.dev")).toBeVisible();
});

test("shows 'already in list — skipped' when all URLs are duplicates", async ({
  page,
  listId,
}) => {
  await mockLinksPost(page, [], 2);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);
  await submitLinks(
    page,
    "https://existing.com\nhttps://also-existing.com",
  );

  await expect(page.getByText("2 already in list — skipped")).toBeVisible();
});

test("shows combined message when some links are new and some are duplicates", async ({
  page,
  listId,
}) => {
  const links = [
    makeLinkFixture(listId, {
      url: "https://new.example.com",
      title: "New Example",
      domain: "new.example.com",
    }),
  ];
  await mockLinksPost(page, links, 1);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);
  await submitLinks(
    page,
    "https://existing.com\nhttps://new.example.com",
  );

  await expect(
    page.getByText("Added 1 link (1 already in list — skipped)"),
  ).toBeVisible();
});

test("closes the form and resets text after successful submission", async ({
  page,
  listId,
}) => {
  const links = [
    makeLinkFixture(listId, {
      url: "https://example.com",
      title: "Example",
      domain: "example.com",
    }),
  ];
  await mockLinksPost(page, links);

  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);
  await submitLinks(page, "https://example.com");

  // After success the form should return to the closed (button) state
  await expect(page.getByRole("textbox")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add links" }),
  ).toBeVisible();
});

test("submit button is disabled when textarea is empty", async ({
  page,
  listId,
}) => {
  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);

  // The submit button (last "Add links") should be disabled with empty textarea
  const submitBtn = page.getByRole("button", { name: "Add links" }).last();
  await expect(submitBtn).toBeDisabled();
});

test("cancel button closes the form without submitting", async ({
  page,
  listId,
}) => {
  await page.goto(`/en/${listId}`);
  await openAddLinksForm(page);
  await page.getByRole("textbox").fill("https://example.com");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("textbox")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add links" }),
  ).toBeVisible();
});
