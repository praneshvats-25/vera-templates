/**
 * Reads from the database.
 * Every query that reads templates lives in this file. Pages call these functions
 * and never write queries themselves.
 */
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { type DocumentType, templates, templateVersions } from "@/db/schema";

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
    .select({ ...summaryColumns, content: templateVersions.content })
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

  const { sourceTemplateId, ...template } = row;
  return { ...template, isOriginal: sourceTemplateId === null };
}
