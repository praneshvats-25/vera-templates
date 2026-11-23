/**
 * Gets the test database ready before the browser tests start.
 * It drops and creates the test database, so every run starts from the same state,
 * then creates the tables and adds the starter templates with the same commands the README uses.
 *
 * It only ever touches the database named in test-database.ts. Any other address is refused.
 */
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { adminDatabaseUrl, assertIsTestDatabase, testDatabaseName } from "./test-database";

async function prepareTestDatabase(): Promise<void> {
  assertIsTestDatabase(process.env.DATABASE_URL);

  const admin = new Client({ connectionString: adminDatabaseUrl });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${testDatabaseName} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${testDatabaseName}`);
  } finally {
    await admin.end();
  }

  // These inherit DATABASE_URL, so they run against the test database.
  execFileSync("npm", ["run", "db:migrate"], { stdio: "inherit" });
  execFileSync("npm", ["run", "db:seed"], { stdio: "inherit" });
}

prepareTestDatabase().catch((error: unknown) => {
  console.error("Could not prepare the test database.", error);
  process.exit(1);
});
