/**
 * Seed script: adds Vera's starter templates to the database.
 * Safe to run again, and safe if two runs start together. It only inserts the originals
 * that are missing, and never touches copies.
 */
import { isNull } from "drizzle-orm";
import { db } from "./index";
import { templates, templateVersions } from "./schema";
import { starterTemplates } from "./starter-templates";

async function seed(): Promise<number> {
  return db.transaction(async (tx) => {
    let added = 0;
    // Position counts up separately inside each document type.
    const nextPosition = { clinical: 1, patient: 1 };

    for (const starter of starterTemplates) {
      const position = nextPosition[starter.documentType];
      nextPosition[starter.documentType] += 1;

      // The database allows one original per name. If this one is already there, the insert
      // does nothing and returns no row. If another seed run is inserting it right now, this
      // insert waits for that run to finish and then does nothing.
      // Only that one rule is skipped. Any other clash, such as an ID already in use, is an error.
      const [created] = await tx
        .insert(templates)
        .values({
          name: starter.name,
          description: starter.description,
          documentType: starter.documentType,
          position,
        })
        .onConflictDoNothing({
          target: templates.name,
          where: isNull(templates.sourceTemplateId),
        })
        .returning({ id: templates.id });
      if (!created) continue;

      // Version 1 is created only for an original this run inserted.
      await tx.insert(templateVersions).values({
        templateId: created.id,
        versionNumber: 1,
        content: starter.content,
      });
      added += 1;
    }

    return added;
  });
}

seed()
  .then(async (added) => {
    console.log(
      `Seed done. Added ${String(added)} of ${String(starterTemplates.length)} templates.`,
    );
    await db.$client.end();
  })
  .catch((error: unknown) => {
    console.error("Seed failed.", error);
    process.exit(1);
  });
