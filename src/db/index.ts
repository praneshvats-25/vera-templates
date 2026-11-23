/**
 * Database connection.
 * Import `db` from here anywhere on the server to run queries.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
