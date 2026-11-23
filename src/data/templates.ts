/**
 * Reads from the database.
 * Every query that reads templates lives in this file. Pages call these functions
 * and never write queries themselves.
 */
import "server-only";
import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { type DocumentType, templates } from "@/db/schema";

export interface TemplateSummary {
  id: number;
  name: string;
  description: string;
  documentType: DocumentType;
  // True for one of Vera's originals. False for the user's copy.
  isOriginal: boolean;
}

/** All templates in library order: by document type, the user's copies first, then by position. */
export async function listTemplates(): Promise<TemplateSummary[]> {
  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      description: templates.description,
      documentType: templates.documentType,
      sourceTemplateId: templates.sourceTemplateId,
    })
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
