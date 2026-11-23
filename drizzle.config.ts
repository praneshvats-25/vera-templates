/**
 * Settings for drizzle-kit, the tool that creates the database tables.
 * `npm run db:push` reads the tables in src/db/schema.ts and applies them to Postgres.
 */
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
