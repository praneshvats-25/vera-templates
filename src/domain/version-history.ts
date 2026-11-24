/**
 * How a copy's version pointers move.
 * Pure functions: numbers in, numbers out. No database and no screen code.
 *
 * A copy has three pointers:
 * - current: the version shown on screen.
 * - published: the version marked as published.
 * - tip: the newest version on the line being worked on. Redo stops here.
 *
 * Every version remembers its parent, the version it was made from. Undo goes to the parent.
 * Redo goes one step from current toward the tip. Versions are never deleted, so a published
 * version can never be lost by undoing and then making a new change.
 */
export interface VersionPointers {
  current: number;
  published: number;
  tip: number;
}

export interface VersionLink {
  number: number;
  // The version this one was made from. Version 1 has none.
  parent: number | null;
}

export type VersionMove = "undo" | "redo" | "publish" | "discard";

function parentOf(links: VersionLink[], versionNumber: number): number | null {
  return links.find((link) => link.number === versionNumber)?.parent ?? null;
}

/** The version Undo goes to, or null when there is nothing to undo. */
export function undoTarget(links: VersionLink[], current: number): number | null {
  return parentOf(links, current);
}

/** The version Redo goes to, or null when there is nothing to redo. */
export function redoTarget(links: VersionLink[], current: number, tip: number): number | null {
  // Walk back from the tip, parent by parent, until we find the version made from current.
  let step = tip;
  while (step !== current) {
    const parent = parentOf(links, step);
    if (parent === null) return null;
    if (parent === current) return step;
    step = parent;
  }
  return null;
}

/** True when the version on screen is not the published one. Numbers are compared, never text. */
export function hasUnpublishedChanges(pointers: VersionPointers): boolean {
  return pointers.current !== pointers.published;
}

/** The number for a new version: one above the highest number already saved. */
export function nextVersionNumber(links: VersionLink[]): number {
  return Math.max(0, ...links.map((link) => link.number)) + 1;
}

/** After a change is saved as a new version, that version is shown and becomes the tip. */
export function pointersAfterChange(
  pointers: VersionPointers,
  newVersion: number,
): VersionPointers {
  return { ...pointers, current: newVersion, tip: newVersion };
}

/** Where the pointers end up after Undo, Redo, Publish or Discard. Unchanged if there is nothing to do. */
export function pointersAfterMove(
  move: VersionMove,
  pointers: VersionPointers,
  links: VersionLink[],
): VersionPointers {
  switch (move) {
    case "undo": {
      const target = undoTarget(links, pointers.current);
      return target === null ? pointers : { ...pointers, current: target };
    }
    case "redo": {
      const target = redoTarget(links, pointers.current, pointers.tip);
      return target === null ? pointers : { ...pointers, current: target };
    }
    case "publish":
      return { ...pointers, published: pointers.current };
    case "discard":
      // Back to the published version. It also becomes the tip, so the discarded
      // changes cannot be brought back with Redo.
      return { ...pointers, current: pointers.published, tip: pointers.published };
  }
}

/** True when the pointers the page was drawn with are still the ones saved in the database. */
export function pointersMatch(seen: VersionPointers, saved: VersionPointers): boolean {
  return (
    seen.current === saved.current && seen.published === saved.published && seen.tip === saved.tip
  );
}
