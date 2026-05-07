import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173/n-body-universe/",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run pages-preview -- --port 4173",
    url: "http://127.0.0.1:4173/n-body-universe/",
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
