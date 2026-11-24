/**
 * Playwright settings for the browser tests in ./e2e.
 * The tests get their own server on their own port and their own database,
 * so they never touch the data used for development.
 */
import { defineConfig, devices } from "@playwright/test";
import { testDatabaseUrl } from "./e2e/test-database";

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  // One test at a time: the tests share one database.
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: `http://localhost:${String(port)}`,
  },
  projects: [
    {
      name: "chromium",
      // The design is for a 1440 x 900 desktop screen.
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // Reset the test database, build the app, then serve the production build.
    command: `npm run test:e2e:server -- --port ${String(port)}`,
    url: `http://localhost:${String(port)}`,
    // The same address is used to reset the database, build, and serve.
    env: { DATABASE_URL: testDatabaseUrl },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
