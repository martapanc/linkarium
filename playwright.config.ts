import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3637",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Reuse an already-running dev server; don't auto-start one.
  // Run `yarn dev` (and `supabase start`) before running E2E tests.
  webServer: {
    command: "yarn dev",
    url: "http://localhost:3637",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
