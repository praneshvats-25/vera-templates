"use client";

/**
 * The "Edit a copy" button on one of Vera's templates.
 * The copy is saved on the server. When it works, the server opens the new copy.
 * When it does not, the reason is shown next to the button.
 */
import { CopyIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { copyTemplateAction } from "@/actions/template-actions";
import { SubmitButton } from "./ui/submit-button";

interface EditCopyFormProps {
  templateId: number;
}

export function EditCopyForm({ templateId }: EditCopyFormProps) {
  const [result, formAction] = useActionState(copyTemplateAction, null);

  return (
    <form action={formAction} className="flex items-center gap-3">
      {result !== null && !result.ok && (
        <p role="alert" className="text-small text-grey-500">
          {result.message}
        </p>
      )}
      <input type="hidden" name="templateId" value={templateId} />
      <SubmitButton>
        <CopyIcon size={16} aria-hidden />
        Edit a copy
      </SubmitButton>
    </form>
  );
}
