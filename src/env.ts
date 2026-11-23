/**
 * Settings read from the environment.
 * Checked once at startup, so a missing or wrong value fails with a clear message.
 */
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
