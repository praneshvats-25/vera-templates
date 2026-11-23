"use server";

/**
 * Form entry points.
 * Each one checks what the form sent, calls the database layer, then refreshes or redirects.
 */
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  copyTemplate,
  type CopyResult,
  moveVersion,
  type MoveResult,
  type RequestResult,
  sendRequest,
} from "@/data/template-mutations";
import type { ActionResult, RequestActionResult } from "@/domain/action-result";
import { parseTemplateId } from "@/domain/template-id";
import type { VersionPointers } from "@/domain/version-history";

const versionNumber = z.coerce.number().int().min(1);
const pointersSchema = z.object({
  current: versionNumber,
  published: versionNumber,
  tip: versionNumber,
});
const moveSchema = z.enum(["undo", "redo", "publish", "discard"]);
const longestRequest = 2000;
const emptyRequestMessage = "Type a request for Vera first.";
const messageSchema = z
  .string({ error: emptyRequestMessage })
  .trim()
  .min(1, { error: emptyRequestMessage })
  .max(longestRequest, {
    error: "That request is too long. Keep it under 2,000 characters.",
  });

const notFoundMessage = "This template could not be found.";
// The wording from the design's "change failed" screen.
const requestFailedMessage =
  "Vera couldn't make this change. Your template is as it was, and your request is back in the bar.";

/** Reads which copy a form is about and the version pointers the page was drawn with. */
function readCopyState(formData: FormData): { templateId: number; seen: VersionPointers } | null {
  const templateId = parseTemplateId(formData.get("templateId"));
  const seen = pointersSchema.safeParse({
    current: formData.get("current"),
    published: formData.get("published"),
    tip: formData.get("tip"),
  });
  if (templateId === null || !seen.success) return null;
  return { templateId, seen: seen.data };
}

/** "Edit a copy": saves a copy of one of Vera's templates and opens it. */
export async function copyTemplateAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const templateId = parseTemplateId(formData.get("templateId"));
  if (templateId === null) return { ok: false, message: notFoundMessage };

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

/** The message box: sends Vera a request to change the copy on screen. */
export async function sendRequestAction(
  _previous: RequestActionResult | null,
  formData: FormData,
): Promise<RequestActionResult> {
  const copyState = readCopyState(formData);
  const message = messageSchema.safeParse(formData.get("message"));
  if (copyState === null) return { ok: false, message: notFoundMessage };
  if (!message.success) {
    return { ok: false, message: message.error.issues[0]?.message ?? emptyRequestMessage };
  }

  let result: RequestResult;
  try {
    result = await sendRequest(copyState.templateId, copyState.seen, message.data);
  } catch (error) {
    console.error("Sending the request failed.", error);
    return { ok: false, message: requestFailedMessage };
  }

  // Draw the page again with what is saved now, whether the request worked or was refused.
  refresh();
  if (!result.ok) return { ok: false, message: result.message };
  return {
    ok: true,
    reply: result.reply,
    savedVersion: result.changed ? result.pointers.current : null,
    shownVersion: result.pointers.current,
  };
}

/** Undo, Redo, Publish changes and Discard changes. The button pressed says which. */
export async function moveVersionAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const copyState = readCopyState(formData);
  const move = moveSchema.safeParse(formData.get("move"));
  if (copyState === null || !move.success) return { ok: false, message: notFoundMessage };

  let result: MoveResult;
  try {
    result = await moveVersion(copyState.templateId, copyState.seen, move.data);
  } catch (error) {
    console.error("Moving between versions failed.", error);
    return { ok: false, message: "That did not work. Your template is as it was." };
  }

  refresh();
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true };
}
