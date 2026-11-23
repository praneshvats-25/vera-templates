/**
 * Reads from the database.
 * Every query that reads templates lives in this file. Pages call these functions
 * and never write queries themselves.
 */
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { type DocumentType, templates, templateVersions } from "@/db/schema";
import type { VersionPointers } from "@/domain/version-history";

export interface TemplateSummary {
  id: number;
  name: string;
  description: string;
  documentType: DocumentType;
  // True for one of Vera's originals. False for the user's copy.
  isOriginal: boolean;
}

export interface TemplateDetail extends TemplateSummary {
  // The text of the version shown on screen, exactly as saved.
  content: string;
  // Which version is shown, which is published, and where Redo stops.
  pointers: VersionPointers;
  canUndo: boolean;
  canRedo: boolean;
}

const summaryColumns = {
  id: templates.id,
  name: templates.name,
  description: templates.description,
  documentType: templates.documentType,
  sourceTemplateId: templates.sourceTemplateId,
};

/** All templates in library order: by document type, the user's copies first, then by position. */
export async function listTemplates(): Promise<TemplateSummary[]> {
  const rows = await db
    .select(summaryColumns)
    .from(templates)
    .orderBy(
      asc(templates.documentType),
      // "false" sorts before "true", so copies (which have a source) come first.
      asc(sql`${templates.sourceTemplateId} is null`),
      asc(templates.position),
      asc(templates.id),
    );

  return rows.map(({ sourceTemplateId, ...row }) => ({
    ...row,
    isOriginal: sourceTemplateId === null,
  }));
}

/** One template with the text of the version it currently shows, or null if there is none. */
export async function getTemplate(id: number): Promise<TemplateDetail | null> {
  const [row] = await db
    .select({
      ...summaryColumns,
      current: templates.currentVersionNumber,
      published: templates.publishedVersionNumber,
      tip: templates.tipVersionNumber,
      content: templateVersions.content,
      parentOfCurrent: templateVersions.parentVersionNumber,
    })
    .from(templates)
    .innerJoin(
      templateVersions,
      and(
        eq(templateVersions.templateId, templates.id),
        eq(templateVersions.versionNumber, templates.currentVersionNumber),
      ),
    )
    .where(eq(templates.id, id));
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    documentType: row.documentType,
    isOriginal: row.sourceTemplateId === null,
    content: row.content,
    pointers: { current: row.current, published: row.published, tip: row.tip },
    // Undo goes to the version this one was made from. Redo is possible until the tip is shown.
    canUndo: row.parentOfCurrent !== null,
    canRedo: row.current !== row.tip,
  };
}
