"use server";

/**
 * Form entry points.
 * Each one checks what the form sent, calls the database layer, then refreshes or redirects.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { copyTemplate, type CopyResult } from "@/data/template-mutations";
import type { ActionResult } from "@/domain/action-result";
import { parseTemplateId } from "@/domain/template-id";

/** "Edit a copy": saves a copy of one of Vera's templates and opens it. */
export async function copyTemplateAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const templateId = parseTemplateId(formData.get("templateId"));
  if (templateId === null) return { ok: false, message: "This template could not be found." };

  let copy: CopyResult;
  try {
    copy = await copyTemplate(templateId);
  } catch (error) {
    console.error("Copying the template failed.", error);
    return { ok: false, message: "The copy could not be saved. Please try again." };
  }
  if (!copy.ok) return { ok: false, message: copy.message };

  // These two lines sit after the try/catch on purpose. redirect() works by throwing,
  // so catching it would report a saved copy as failed, and a second click would make another.
  revalidatePath("/");
  redirect(`/templates/${String(copy.id)}`);
}
