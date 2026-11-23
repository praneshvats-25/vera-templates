CREATE TYPE "public"."document_type" AS ENUM('clinical', 'patient');--> statement-breakpoint
CREATE TABLE "template_versions" (
	"template_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"parent_version_number" integer,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_versions_template_id_version_number_pk" PRIMARY KEY("template_id","version_number"),
	CONSTRAINT "template_versions_number_from_1" CHECK ("template_versions"."version_number" >= 1),
	CONSTRAINT "template_versions_only_version_1_has_no_parent" CHECK (("template_versions"."version_number" = 1) = ("template_versions"."parent_version_number" is null)),
	CONSTRAINT "template_versions_parent_is_older" CHECK ("template_versions"."parent_version_number" < "template_versions"."version_number")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"description" text NOT NULL,
	"document_type" "document_type" NOT NULL,
	"position" integer NOT NULL,
	"source_template_id" integer,
	"current_version_number" integer DEFAULT 1 NOT NULL,
	"published_version_number" integer DEFAULT 1 NOT NULL,
	"tip_version_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_original_stays_at_version_1" CHECK ("templates"."source_template_id" is not null or ("templates"."current_version_number" = 1 and "templates"."published_version_number" = 1 and "templates"."tip_version_number" = 1))
);
--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_parent_fk" FOREIGN KEY ("template_id","parent_version_number") REFERENCES "public"."template_versions"("template_id","version_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_source_template_id_templates_id_fk" FOREIGN KEY ("source_template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_current_version_fk" FOREIGN KEY ("id","current_version_number") REFERENCES "public"."template_versions"("template_id","version_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_published_version_fk" FOREIGN KEY ("id","published_version_number") REFERENCES "public"."template_versions"("template_id","version_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_tip_version_fk" FOREIGN KEY ("id","tip_version_number") REFERENCES "public"."template_versions"("template_id","version_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "templates_original_name_unique" ON "templates" USING btree ("name") WHERE "templates"."source_template_id" is null;