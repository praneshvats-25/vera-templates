/**
 * Settings read from the environment.
 * Checked once at startup, so a missing or wrong value fails with a clear message.
 */
import { z } from "zod";

const envSchema = z.object({
  // Must be a full PostgreSQL address with a host,
  // for example postgres://vera:vera@localhost:5433/vera
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    hostname: /.+/,
    error:
      "DATABASE_URL must be a PostgreSQL address with a host, like postgres://user:password@localhost:5433/database",
  }),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid settings. Check your .env file.\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
