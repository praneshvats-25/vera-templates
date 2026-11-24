/**
 * The one database the browser tests are allowed to reset.
 * It is a separate database on the local Docker Postgres, never the one used for development.
 */
export const testDatabaseName = "vera_test";
export const testDatabaseUrl = `postgres://vera:vera@localhost:5433/${testDatabaseName}`;

// Creating or dropping a database has to be done while connected to a different one.
export const adminDatabaseUrl = "postgres://vera:vera@localhost:5433/postgres";

/**
 * Stops with an error unless the address is exactly the local test database.
 * The rejected address is never printed: it could hold a real password.
 */
export function assertIsTestDatabase(databaseUrl: string | undefined): void {
  if (databaseUrl !== testDatabaseUrl) {
    throw new Error(`Refusing to reset. Expected the local ${testDatabaseName} database.`);
  }
}
