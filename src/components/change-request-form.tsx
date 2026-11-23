"use client";

/**
 * The area under a copy: Vera's reply, and the box for sending her a request.
 * Figma calls the box "Change bar".
 *
 * - The line above the box always shows the result of the most recent action here:
 *   Vera's reply (including "Nothing to change."), or a short reason when something failed.
 * - A reply goes away when a different version comes on screen.
 * - "Undo" beside a reply is offered only when that request saved a version
 *   and that version is still the one on screen.
 * - While a request is saving the box is locked, so nothing typed can be lost
 *   when the box is cleared. If a request fails, the typed message stays in the box.
 */
import { ArrowUpIcon } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { moveVersionAction, sendRequestAction } from "@/actions/template-actions";
import type { VersionPointers } from "@/domain/version-history";
import { IconButton } from "./ui/icon-button";
import { VersionFields } from "./version-fields";

interface ChangeRequestFormProps {
  templateId: number;
  pointers: VersionPointers;
}

// What the line above the box shows: the outcome of the most recent action.
type Feedback =
  | { kind: "reply"; reply: string; savedVersion: number | null; shownVersion: number }
  | { kind: "failure"; message: string }
  | null;

export function ChangeRequestForm({ templateId, pointers }: ChangeRequestFormProps) {
  const [message, setMessage] = useState("");

  // Both forms below (the request box and the small Undo) go through this one function,
  // so the feedback is always from whichever action ran last.
  async function submit(_previous: Feedback, formData: FormData): Promise<Feedback> {
    if (formData.has("move")) {
      const result = await moveVersionAction(null, formData);
      return result.ok ? null : { kind: "failure", message: result.message };
    }

    const result = await sendRequestAction(null, formData);
    if (!result.ok) return { kind: "failure", message: result.message };
    // The box is cleared only when the request worked.
    setMessage("");
    return {
      kind: "reply",
      reply: result.reply,
      savedVersion: result.savedVersion,
      shownVersion: result.shownVersion,
    };
  }
  const [feedback, formAction, busy] = useActionState(submit, null);

  // A reply belongs to the version that was on screen right after the request.
  const reply =
    feedback?.kind === "reply" && feedback.shownVersion === pointers.current ? feedback : null;
  const canUndoReply = reply !== null && reply.savedVersion === pointers.current;
  const lineText = feedback?.kind === "failure" ? feedback.message : (reply?.reply ?? null);

  return (
    <div className="flex flex-col gap-2">
      {lineText !== null && (
        <div className="flex items-start gap-2 px-1">
          <span
            aria-hidden
            className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-small font-bold"
          >
            V
          </span>
          <div className="flex flex-wrap items-baseline gap-x-1 text-body">
            <p role="status">{lineText}</p>
            {canUndoReply && (
              <form action={formAction}>
                <VersionFields templateId={templateId} pointers={pointers} />
                <button
                  type="submit"
                  name="move"
                  value="undo"
                  aria-label="Undo this change"
                  disabled={busy}
                  className="underline"
                >
                  Undo
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <form
        action={formAction}
        className="flex flex-col gap-5 rounded-2xl border border-grey-200 bg-white p-4 shadow-request"
      >
        <VersionFields templateId={templateId} pointers={pointers} />
        <textarea
          name="message"
          rows={1}
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
          }}
          readOnly={busy}
          placeholder="Tell Vera what to change…"
          aria-label="Message to Vera"
          className="resize-none text-template outline-none placeholder:text-grey-400"
        />
        <div className="flex justify-end">
          <IconButton
            type="submit"
            variant="solid"
            label="Send"
            disabled={message.trim() === "" || busy}
          >
            <ArrowUpIcon size={16} weight="bold" aria-hidden />
          </IconButton>
        </div>
      </form>
    </div>
  );
}
