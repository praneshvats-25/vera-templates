/**
 * Database tables.
 * `templates` has one row per template: Vera's originals and the user's copies.
 * `template_versions` has every saved text of a template. Rows there are only ever inserted.
 */
import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const documentType = pgEnum("document_type", ["clinical", "patient"]);

export const templates = pgTable(
  "templates",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    documentType: documentType("document_type").notNull(),
    // Place in its group in the library. A copy takes its original's position.
    position: integer("position").notNull(),
    // Empty for Vera's originals. Set for a copy: the original it was made from.
    sourceTemplateId: integer("source_template_id").references((): AnyPgColumn => templates.id),
    // The version shown on screen.
    currentVersionNumber: integer("current_version_number").notNull().default(1),
    publishedVersionNumber: integer("published_version_number").notNull().default(1),
    // The newest version on the line being worked on. Redo stops here.
    tipVersionNumber: integer("tip_version_number").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Vera never has two originals with the same name. The seed relies on this.
    uniqueIndex("templates_original_name_unique")
      .on(table.name)
      .where(sql`${table.sourceTemplateId} is null`),
    // Vera's originals are read-only, so they never leave version 1.
    check(
      "templates_original_stays_at_version_1",
      sql`${table.sourceTemplateId} is not null or (${table.currentVersionNumber} = 1 and ${table.publishedVersionNumber} = 1 and ${table.tipVersionNumber} = 1)`,
    ),
    // Each pointer must be a saved version of this same template.
    // A later migration makes these three keys checked at commit. See drizzle/0001.
    foreignKey({
      name: "templates_current_version_fk",
      columns: [table.id, table.currentVersionNumber],
      foreignColumns: [templateVersions.templateId, templateVersions.versionNumber],
    }),
    foreignKey({
      name: "templates_published_version_fk",
      columns: [table.id, table.publishedVersionNumber],
      foreignColumns: [templateVersions.templateId, templateVersions.versionNumber],
    }),
    foreignKey({
      name: "templates_tip_version_fk",
      columns: [table.id, table.tipVersionNumber],
      foreignColumns: [templateVersions.templateId, templateVersions.versionNumber],
    }),
  ],
);

export const templateVersions = pgTable(
  "template_versions",
  {
    // The two tables point at each other, so TypeScript needs the column type spelled out here.
    templateId: integer("template_id")
      .notNull()
      .references((): AnyPgColumn => templates.id),
    versionNumber: integer("version_number").notNull(),
    // The version this text was made from. Empty only for version 1.
    parentVersionNumber: integer("parent_version_number"),
    // Plain text, saved exactly as written.
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.templateId, table.versionNumber] }),
    foreignKey({
      name: "template_versions_parent_fk",
      columns: [table.templateId, table.parentVersionNumber],
      foreignColumns: [table.templateId, table.versionNumber],
    }),
    check("template_versions_number_from_1", sql`${table.versionNumber} >= 1`),
    check(
      "template_versions_only_version_1_has_no_parent",
      sql`(${table.versionNumber} = 1) = (${table.parentVersionNumber} is null)`,
    ),
    check(
      "template_versions_parent_is_older",
      sql`${table.parentVersionNumber} < ${table.versionNumber}`,
    ),
  ],
);

export type Template = typeof templates.$inferSelect;
export type TemplateVersion = typeof templateVersions.$inferSelect;
export type DocumentType = (typeof documentType.enumValues)[number];
