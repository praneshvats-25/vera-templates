-- Hand-written migration. The schema tool cannot write this kind of rule.
--
-- A template and its version 1 point at each other: the template row needs the
-- version to exist, and the version row needs the template to exist. Neither can
-- be inserted first if Postgres checks straight away.
--
-- These three lines tell Postgres to check the template's version pointers when the
-- transaction commits. Both rows are inserted in one transaction, then checked together.
ALTER TABLE "templates" ALTER CONSTRAINT "templates_current_version_fk" DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "templates" ALTER CONSTRAINT "templates_published_version_fk" DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "templates" ALTER CONSTRAINT "templates_tip_version_fk" DEFERRABLE INITIALLY DEFERRED;
