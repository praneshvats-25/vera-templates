"use client";

/**
 * The controls at the top right of a copy: Undo, Redo, the "Unpublished changes" badge,
 * Discard changes and Publish changes.
 * It is one form with four buttons. The button pressed tells the server which move to make.
 * A button is switched off when it has nothing to do, and all of them while a move is saving.
 */
import { ArrowClockwiseIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { moveVersionAction } from "@/actions/template-actions";
import { hasUnpublishedChanges, type VersionPointers } from "@/domain/version-history";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { IconButton } from "./ui/icon-button";
import { VersionFields } from "./version-fields";

interface VersionControlsProps {
  templateId: number;
  pointers: VersionPointers;
  canUndo: boolean;
  canRedo: boolean;
}

export function VersionControls({ templateId, pointers, canUndo, canRedo }: VersionControlsProps) {
  const [result, formAction, saving] = useActionState(moveVersionAction, null);
  const unpublished = hasUnpublishedChanges(pointers);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <VersionFields templateId={templateId} pointers={pointers} />
      {result !== null && !result.ok && (
        <p role="alert" className="text-small text-grey-500">
          {result.message}
        </p>
      )}
      <IconButton type="submit" name="move" value="undo" label="Undo" disabled={!canUndo || saving}>
        <ArrowCounterClockwiseIcon size={16} aria-hidden />
      </IconButton>
      <IconButton type="submit" name="move" value="redo" label="Redo" disabled={!canRedo || saving}>
        <ArrowClockwiseIcon size={16} aria-hidden />
      </IconButton>
      {unpublished && <Badge>Unpublished changes</Badge>}
      <Button
        type="submit"
        name="move"
        value="discard"
        variant="ghost"
        disabled={!unpublished || saving}
      >
        Discard changes
      </Button>
      <Button
        type="submit"
        name="move"
        value="publish"
        variant="primary"
        disabled={!unpublished || saving}
      >
        Publish changes
      </Button>
    </form>
  );
}
