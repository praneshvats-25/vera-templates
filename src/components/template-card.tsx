/**
 * One template in the library. The whole card is a link to the template.
 */
import Link from "next/link";
import type { TemplateSummary } from "@/data/templates";
import { templateAuthor } from "@/domain/template-author";
import { Avatar } from "./ui/avatar";

interface TemplateCardProps {
  template: TemplateSummary;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const author = templateAuthor(template.isOriginal);

  return (
    <Link
      href={`/templates/${String(template.id)}`}
      className="flex h-card flex-col justify-between rounded-2xl border border-grey-200 bg-white p-5 hover:border-grey-300 hover:bg-card-hover"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-card-title">{template.name}</h3>
        <p className="line-clamp-2 text-ui text-grey-500">{template.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Avatar initials={author.initials} />
        <div>
          <p className="text-small">{author.name}</p>
          <p className="text-small text-grey-400">{author.specialty}</p>
        </div>
      </div>
    </Link>
  );
}
