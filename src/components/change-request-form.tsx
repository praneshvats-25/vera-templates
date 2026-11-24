"use client";

/**
 * The area under a copy: Vera's reply, and the box for sending her a request.
 * Figma calls the box "Change bar".
 *
 * - The line above the box always shows the result of the most recent action on this copy,
 *   whether it came from here or from the version controls at the top:
 *   Vera's reply (including "Nothing to change."), or a short reason when something failed.
 *   A later action that works replaces an earlier failure.
 * - A reply goes away when a different version comes on screen.
 * - "Undo" beside a reply is offered only when that request saved a version
 *   and that version is still the one on screen.
 * - The reply line is always on the page, so a screen reader announces a new reply.
 * - The box grows with a long request, so it can be read back before sending.
 * - While anything is saving the box is locked, so nothing typed can be lost
 *   when the box is cleared. If a request fails, the typed message stays in the box.
 */
import { ArrowUpIcon } from "@phosphor-icons/react";
import type { VersionPointers } from "@/domain/version-history";
import { useCopyActions } from "./copy-actions";
import { IconButton } from "./ui/icon-button";
import { VersionFields } from "./version-fields";

interface ChangeRequestFormProps {
  templateId: number;
  pointers: VersionPointers;
}

export function ChangeRequestForm({ templateId, pointers }: ChangeRequestFormProps) {
  const { feedback, formAction, busy, message, setMessage } = useCopyActions();

  // A reply belongs to the version that was on screen right after the request.
  const reply =
    feedback?.kind === "reply" && feedback.shownVersion === pointers.current ? feedback : null;
  const canUndoReply = reply !== null && reply.savedVersion === pointers.current;
  const lineText = feedback?.kind === "failure" ? feedback.message : (reply?.reply ?? null);

  return (
    <div className="flex flex-col gap-2">
      {/* This row is always on the page, even when empty. A screen reader only announces
          a status line that was already there when its text changed. */}
      <div className={lineText === null ? "sr-only" : "flex items-start gap-2 px-1"}>
        {lineText !== null && (
          <span
            aria-hidden
            className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-small font-bold"
          >
            V
          </span>
        )}
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
          className="field-sizing-content max-h-40 resize-none text-template outline-none placeholder:text-grey-400"
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
