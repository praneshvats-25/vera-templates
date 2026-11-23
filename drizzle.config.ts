/**
 * Settings for drizzle-kit, the tool that manages database changes.
 * `npm run db:generate` writes a SQL migration from src/db/schema.ts into ./drizzle.
 * `npm run db:migrate` applies the migrations that have not run yet.
 */
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
