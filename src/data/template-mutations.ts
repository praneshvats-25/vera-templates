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
import { applyRequest } from "@/domain/template-rules";
import {
  nextVersionNumber,
  pointersAfterChange,
  pointersAfterMove,
  pointersMatch,
  type VersionLink,
  type VersionMove,
  type VersionPointers,
} from "@/domain/version-history";

// The database handle inside a transaction.
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface Refused {
  ok: false;
  message: string;
}

export type CopyResult = { ok: true; id: number } | Refused;
export type MoveResult = { ok: true; pointers: VersionPointers } | Refused;
export type RequestResult =
  { ok: true; reply: string; changed: boolean; pointers: VersionPointers } | Refused;

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

/**
 * First step of every change to a copy: lock its row and check the change is allowed.
 * - Only a copy can be changed. Vera's originals are read-only.
 * - The page sends the version pointers it was drawn with. If they are no longer the saved
 *   ones, the user was looking at an old state (another tab changed the copy), so the
 *   change is refused and nothing is written.
 * The lock makes two tabs take turns, so the check and the write cannot be interleaved.
 */
async function lockCopy(
  tx: Transaction,
  templateId: number,
  seen: VersionPointers,
): Promise<{ ok: true; pointers: VersionPointers } | Refused> {
  const [template] = await tx
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .for("update");
  if (!template) return { ok: false, message: "This template could not be found." };
  if (template.sourceTemplateId === null) {
    return { ok: false, message: "Vera's templates cannot be changed. Make a copy first." };
  }

  const saved: VersionPointers = {
    current: template.currentVersionNumber,
    published: template.publishedVersionNumber,
    tip: template.tipVersionNumber,
  };
  if (!pointersMatch(seen, saved)) {
    return {
      ok: false,
      message: "This template was changed somewhere else. You are now seeing the latest version.",
    };
  }
  return { ok: true, pointers: saved };
}

async function loadVersionLinks(tx: Transaction, templateId: number): Promise<VersionLink[]> {
  return tx
    .select({
      number: templateVersions.versionNumber,
      parent: templateVersions.parentVersionNumber,
    })
    .from(templateVersions)
    .where(eq(templateVersions.templateId, templateId));
}

async function savePointers(
  tx: Transaction,
  templateId: number,
  pointers: VersionPointers,
): Promise<void> {
  await tx
    .update(templates)
    .set({
      currentVersionNumber: pointers.current,
      publishedVersionNumber: pointers.published,
      tipVersionNumber: pointers.tip,
    })
    .where(eq(templates.id, templateId));
}

/**
 * Applies the user's request to the version on screen.
 * If the text changes, it is saved as a new version made from the one on screen.
 * If nothing changes, nothing is written: no version, and Redo is left alone.
 */
export async function sendRequest(
  templateId: number,
  seen: VersionPointers,
  message: string,
): Promise<RequestResult> {
  return db.transaction(async (tx) => {
    const locked = await lockCopy(tx, templateId, seen);
    if (!locked.ok) return locked;
    const { pointers } = locked;

    const [shown] = await tx
      .select({ content: templateVersions.content })
      .from(templateVersions)
      .where(
        and(
          eq(templateVersions.templateId, templateId),
          eq(templateVersions.versionNumber, pointers.current),
        ),
      );
    if (!shown) throw new Error(`Template ${String(templateId)} has no current version.`);

    const outcome = applyRequest(shown.content, message);
    if (!outcome.changed) return { ok: true, reply: outcome.reply, changed: false, pointers };

    // The new number is the highest saved number plus one. After an Undo, "current plus one"
    // could already be taken.
    const newVersion = nextVersionNumber(await loadVersionLinks(tx, templateId));
    await tx.insert(templateVersions).values({
      templateId,
      versionNumber: newVersion,
      parentVersionNumber: pointers.current,
      content: outcome.content,
    });

    const newPointers = pointersAfterChange(pointers, newVersion);
    await savePointers(tx, templateId, newPointers);
    return { ok: true, reply: outcome.reply, changed: true, pointers: newPointers };
  });
}

/**
 * Undo, Redo, Publish or Discard. Only the copy's pointers move; version rows are never
 * changed or deleted. A move with nothing to do (Undo at version 1, Redo at the tip) writes nothing.
 */
export async function moveVersion(
  templateId: number,
  seen: VersionPointers,
  move: VersionMove,
): Promise<MoveResult> {
  return db.transaction(async (tx) => {
    const locked = await lockCopy(tx, templateId, seen);
    if (!locked.ok) return locked;

    const links = await loadVersionLinks(tx, templateId);
    const newPointers = pointersAfterMove(move, locked.pointers, links);
    if (!pointersMatch(newPointers, locked.pointers)) {
      await savePointers(tx, templateId, newPointers);
    }
    return { ok: true, pointers: newPointers };
  });
}
