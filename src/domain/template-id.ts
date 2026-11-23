/**
 * Template IDs arrive as text, from a page address or a form.
 * This turns one into a number, or returns null if it is not a valid ID.
 */
import { z } from "zod";

// The largest number a Postgres integer column can hold.
const largestId = 2147483647;

const templateIdSchema = z
  .string()
  .regex(/^[1-9]\d{0,9}$/)
  .transform(Number)
  .pipe(z.number().int().max(largestId));

export function parseTemplateId(value: unknown): number | null {
  const parsed = templateIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
