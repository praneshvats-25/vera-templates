/**
 * Template page: one template's text, drawn with the design's styling.
 * Vera's originals and the user's copies both open here.
 * An original is read-only and offers "Edit a copy".
 * A copy has the version controls at the top and the request box for Vera at the bottom.
 */
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChangeRequestForm } from "@/components/change-request-form";
import { EditCopyForm } from "@/components/edit-copy-form";
import { ReadingGuide } from "@/components/reading-guide";
import { TemplatePreview } from "@/components/template-preview";
import { TemplateToolbar } from "@/components/template-toolbar";
import { VersionControls } from "@/components/version-controls";
import { getTemplate } from "@/data/templates";
import { documentTypeWords } from "@/domain/document-types";
import { templateAuthor } from "@/domain/template-author";
import { parseTemplateId } from "@/domain/template-id";

// Read the database on every visit, so the page always shows the latest saved text.
export const dynamic = "force-dynamic";

export default async function TemplatePage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const templateId = parseTemplateId(id);
  if (templateId === null) notFound();

  const template = await getTemplate(templateId);
  if (template === null) notFound();

  // Under the title: the description and document type, plus the author for Vera's originals.
  const details = [template.description, documentTypeWords[template.documentType].label];
  if (template.isOriginal) {
    const author = templateAuthor(template.isOriginal);
    details.push(`By ${author.name}`, author.specialty);
  }

  return (
    <AppShell tone="template">
      <div className="flex h-full flex-col">
        <TemplateToolbar>
          {/* An original can only be copied. A copy can be changed. */}
          {template.isOriginal ? (
            <EditCopyForm templateId={template.id} />
          ) : (
            <VersionControls
              templateId={template.id}
              pointers={template.pointers}
              canUndo={template.canUndo}
              canRedo={template.canRedo}
            />
          )}
        </TemplateToolbar>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-content flex-col gap-5 pt-6 pb-10">
            <header className="flex flex-col gap-1">
              <h1 className="text-template-title">{template.name}</h1>
              <p className="text-body text-grey-500">{details.join(" · ")}</p>
            </header>
            <div className="flex items-start gap-4">
              <section
                aria-label="Template text"
                className="w-template rounded-2xl border border-grey-200 bg-white p-8"
              >
                <TemplatePreview content={template.content} />
              </section>
              <ReadingGuide />
            </div>
          </div>
        </div>
        {/* Only a copy has the request box. Users never type into the template text itself. */}
        {!template.isOriginal && (
          <div className="mx-auto w-request shrink-0 pb-4">
            <ChangeRequestForm templateId={template.id} pointers={template.pointers} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
