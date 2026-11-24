"use client";

/**
 * What the version controls and the request box share on a copy's page.
 *
 * Every action on the copy (a request to Vera, Undo, Redo, Publish, Discard) goes through
 * the one function here. That gives the page:
 * - one piece of feedback, always from the most recent action, so a later success
 *   replaces an earlier failure wherever it came from;
 * - one "saving" state, so every button waits while any action is saving;
 * - one place that handles a call that never reaches the server, so the page stays up.
 */
import { createContext, type ReactNode, use, useActionState, useState } from "react";
import { moveVersionAction, sendRequestAction } from "@/actions/template-actions";

// The outcome of the most recent action. Null means there is nothing to say.
export type Feedback =
  | { kind: "reply"; reply: string; savedVersion: number | null; shownVersion: number }
  | { kind: "failure"; message: string }
  | null;

interface CopyActions {
  feedback: Feedback;
  formAction: (formData: FormData) => void;
  busy: boolean;
  // The text typed in the request box. It lives here so a request that worked can clear it.
  message: string;
  setMessage: (message: string) => void;
}

const CopyActionsContext = createContext<CopyActions | null>(null);

const unreachableMessage =
  "That did not go through. Check your connection and try again. Your template is as it was.";

export function CopyActionsProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");

  async function submit(_previous: Feedback, formData: FormData): Promise<Feedback> {
    try {
      // The version buttons are named "move". A form without one is a request to Vera.
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
    } catch (error) {
      // The call never reached the server, for example because the connection dropped.
      // Without this the whole page turns into an error screen and the typed request is lost.
      console.error("The action did not reach the server.", error);
      return { kind: "failure", message: unreachableMessage };
    }
  }
  const [feedback, formAction, busy] = useActionState(submit, null);

  return (
    <CopyActionsContext value={{ feedback, formAction, busy, message, setMessage }}>
      {children}
    </CopyActionsContext>
  );
}

/** For the components on a copy's page. They must sit inside CopyActionsProvider. */
export function useCopyActions(): CopyActions {
  const actions = use(CopyActionsContext);
  if (actions === null) throw new Error("useCopyActions needs a CopyActionsProvider above it.");
  return actions;
}
