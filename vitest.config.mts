/**
 * Vitest settings.
 * Unit tests sit next to the code they test, in files ending in `.test.ts`.
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // No tests exist yet. Removed when the first test file is added.
    passWithNoTests: true,
  },
});
