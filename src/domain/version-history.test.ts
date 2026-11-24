/**
 * Tests for how version pointers move. Everything is checked with version numbers,
 * because two versions can hold exactly the same words.
 */
import { describe, expect, it } from "vitest";
import {
  hasUnpublishedChanges,
  nextVersionNumber,
  pointersAfterChange,
  pointersAfterMove,
  pointersMatch,
  redoTarget,
  undoTarget,
  type VersionLink,
} from "./version-history";

// v1, then v2 (Allergies) made from v1, then v3 (plus Medication) made from v2.
const threeInARow: VersionLink[] = [
  { number: 1, parent: null },
  { number: 2, parent: 1 },
  { number: 3, parent: 2 },
];

describe("a straight line of versions", () => {
  it("Undo goes to the parent and Redo comes back", () => {
    const atThree = { current: 3, published: 1, tip: 3 };
    const atTwo = pointersAfterMove("undo", atThree, threeInARow);
    expect(atTwo).toEqual({ current: 2, published: 1, tip: 3 });
    expect(pointersAfterMove("redo", atTwo, threeInARow)).toEqual(atThree);
  });

  it("Undo at version 1 changes nothing", () => {
    const atOne = { current: 1, published: 1, tip: 3 };
    expect(undoTarget(threeInARow, 1)).toBeNull();
    expect(pointersAfterMove("undo", atOne, threeInARow)).toEqual(atOne);
  });

  it("Redo at the tip changes nothing", () => {
    const atTip = { current: 3, published: 1, tip: 3 };
    expect(redoTarget(threeInARow, 3, 3)).toBeNull();
    expect(pointersAfterMove("redo", atTip, threeInARow)).toEqual(atTip);
  });

  it("Publish marks the version shown, and the unpublished flag clears", () => {
    const before = { current: 2, published: 1, tip: 2 };
    expect(hasUnpublishedChanges(before)).toBe(true);
    const after = pointersAfterMove("publish", before, threeInARow);
    expect(after).toEqual({ current: 2, published: 2, tip: 2 });
    expect(hasUnpublishedChanges(after)).toBe(false);
  });

  it("counts as unpublished when the shown version is behind the published one", () => {
    expect(hasUnpublishedChanges({ current: 2, published: 3, tip: 3 })).toBe(true);
  });
});

describe("undo to v2 while v3 is published, then a new change", () => {
  const published = { current: 3, published: 3, tip: 3 };
  const undone = pointersAfterMove("undo", published, threeInARow);

  it("a request that changes nothing saves nothing, so Redo to v3 still works", () => {
    expect(undone).toEqual({ current: 2, published: 3, tip: 3 });
    expect(redoTarget(threeInARow, undone.current, undone.tip)).toBe(3);
  });

  // The new change is saved as v4, made from v2. It may hold the same words as v3.
  const newNumber = nextVersionNumber(threeInARow);
  const withBranch: VersionLink[] = [...threeInARow, { number: newNumber, parent: undone.current }];
  const afterChange = pointersAfterChange(undone, newNumber);

  it("the new version takes the highest number plus one, not current plus one", () => {
    expect(newNumber).toBe(4);
    expect(afterChange).toEqual({ current: 4, published: 3, tip: 4 });
  });

  it("v4 counts as unpublished even if its words equal the published v3", () => {
    expect(hasUnpublishedChanges(afterChange)).toBe(true);
  });

  it("Undo from v4 goes to v2, and Redo from there goes to v4, not v3", () => {
    const back = pointersAfterMove("undo", afterChange, withBranch);
    expect(back).toEqual({ current: 2, published: 3, tip: 4 });
    expect(pointersAfterMove("redo", back, withBranch)).toEqual(afterChange);
  });

  it("Discard from v4 returns to published v3: current, tip and published are all 3", () => {
    const discarded = pointersAfterMove("discard", afterChange, withBranch);
    expect(discarded).toEqual({ current: 3, published: 3, tip: 3 });
    expect(hasUnpublishedChanges(discarded)).toBe(false);
    // Redo is unavailable: the discarded v4 cannot be brought back.
    expect(redoTarget(withBranch, discarded.current, discarded.tip)).toBeNull();
  });

  it("after Discard, Undo steps behind the published version and Redo returns to it", () => {
    const discarded = pointersAfterMove("discard", afterChange, withBranch);
    const behind = pointersAfterMove("undo", discarded, withBranch);
    expect(behind).toEqual({ current: 2, published: 3, tip: 3 });
    expect(hasUnpublishedChanges(behind)).toBe(true);
    expect(pointersAfterMove("redo", behind, withBranch)).toEqual(discarded);
  });
});

describe("publishing an older version while newer ones exist", () => {
  it("Redo shows the newer version as unpublished, and Discard returns to the published one", () => {
    const undone = pointersAfterMove("undo", { current: 3, published: 1, tip: 3 }, threeInARow);
    const publishedOlder = pointersAfterMove("publish", undone, threeInARow);
    expect(publishedOlder).toEqual({ current: 2, published: 2, tip: 3 });

    const ahead = pointersAfterMove("redo", publishedOlder, threeInARow);
    expect(ahead).toEqual({ current: 3, published: 2, tip: 3 });
    expect(hasUnpublishedChanges(ahead)).toBe(true);

    expect(pointersAfterMove("discard", ahead, threeInARow)).toEqual({
      current: 2,
      published: 2,
      tip: 2,
    });
  });
});

describe("an action sent from a tab that is out of date", () => {
  it("is caught even when current and published still match, because the tip differs", () => {
    // v1 is published. Tab A added Allergies as v2 and undid it: it sees Redo leading to v2.
    const seenByTabA = { current: 1, published: 1, tip: 2 };
    // Another tab then added Medication as v3 (made from v1) and undid it.
    const saved = { current: 1, published: 1, tip: 3 };
    const links: VersionLink[] = [
      { number: 1, parent: null },
      { number: 2, parent: 1 },
      { number: 3, parent: 1 },
    ];

    // Redo would now lead to a different edit than tab A expects...
    expect(redoTarget(links, seenByTabA.current, seenByTabA.tip)).toBe(2);
    expect(redoTarget(links, saved.current, saved.tip)).toBe(3);
    // ...so the pointers must not match, and the action is refused.
    expect(pointersMatch(seenByTabA, saved)).toBe(false);
  });

  it("matches when all three pointers are the same", () => {
    const pointers = { current: 2, published: 1, tip: 3 };
    expect(pointersMatch(pointers, { ...pointers })).toBe(true);
    expect(pointersMatch(pointers, { ...pointers, published: 2 })).toBe(false);
    expect(pointersMatch(pointers, { ...pointers, current: 3 })).toBe(false);
  });
});
