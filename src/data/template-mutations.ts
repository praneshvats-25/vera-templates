/**
 * Writes to the database.
 * Every change to templates lives in this file. Each function is one transaction:
 * either everything in it is saved, or nothing is.
 */
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { templates, templateVersions } from "@/db/schema";
import { copyName } from "@/domain/copy-name";

export type CopyResult = { ok: true; id: number } | { ok: false; message: string };

/**
 * Makes the user's own copy of one of Vera's originals.
 * The copy starts at version 1, which is also its published version. The original is not changed.
 */
export async function copyTemplate(originalId: number): Promise<CopyResult> {
  return db.transaction(async (tx) => {
    // Lock the original's row first. A second copy request for the same original waits here
    // until this one is saved, so two copies made at the same moment get different numbers.
    const [original] = await tx
      .select()
      .from(templates)
      .where(eq(templates.id, originalId))
      .for("update");
    if (!original) return { ok: false, message: "This template could not be found." };
    if (original.sourceTemplateId !== null) {
      return { ok: false, message: "Only Vera's templates can be copied." };
    }

    const [published] = await tx
      .select({ content: templateVersions.content })
      .from(templateVersions)
      .where(
        and(
          eq(templateVersions.templateId, original.id),
          eq(templateVersions.versionNumber, original.publishedVersionNumber),
        ),
      );
    if (!published) throw new Error(`Template ${String(original.id)} has no published version.`);

    const existingCopies = await tx.$count(templates, eq(templates.sourceTemplateId, original.id));

    const [copy] = await tx
      .insert(templates)
      .values({
        name: copyName(original.name, existingCopies),
        description: original.description,
        documentType: original.documentType,
        position: original.position,
        sourceTemplateId: original.id,
      })
      .returning({ id: templates.id });
    if (!copy) throw new Error("The copy was not inserted.");

    // Version 1 of the copy. The copy's three version pointers already default to 1.
    await tx.insert(templateVersions).values({
      templateId: copy.id,
      versionNumber: 1,
      content: published.content,
    });

    return { ok: true, id: copy.id };
  });
}
