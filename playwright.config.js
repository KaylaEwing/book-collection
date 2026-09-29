// Settings for the automated tests.
// `npm test` starts the site, runs the tests, then shuts the site down.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  // In dev mode Next.js compiles each page the first time it's opened, which
  // can take several seconds on a slower machine, so allow for that.
  expect: { timeout: 15000 },
  fullyParallel: false,
  // One at a time. The dev server compiles pages on demand, and running
  // several browsers at once made it slow enough to cause false failures.
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
