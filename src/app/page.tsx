/**
 * Library page: every template, grouped by document type.
 * Vera's originals say "Vera". The user's copies say "You" and come first in their group.
 */
import { AppShell } from "@/components/app-shell";
import { TemplateCard } from "@/components/template-card";
import { listTemplates } from "@/data/templates";
import { documentTypeOrder, documentTypeWords } from "@/domain/document-types";

// Read the database on every visit, so a new copy shows up straight away.
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const templates = await listTemplates();
  const groups = documentTypeOrder
    .map((documentType) => ({
      documentType,
      title: documentTypeWords[documentType].groupTitle,
      templates: templates.filter((template) => template.documentType === documentType),
    }))
    .filter((group) => group.templates.length > 0);

  return (
    <AppShell tone="library">
      <div className="h-full overflow-y-auto">
        <div className="mx-auto flex w-content flex-col gap-5 pt-6 pb-10">
          <header className="flex flex-col gap-1">
            <h1 className="text-page-title">Templates</h1>
            <p className="text-body text-grey-500">
              Notes, letters and documents Vera writes for you.
            </p>
          </header>

          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.documentType} className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-row-title">
                  {group.title}
                  <span className="text-small font-normal text-grey-400">
                    {group.templates.length}
                  </span>
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  {group.templates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
