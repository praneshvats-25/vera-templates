# Notes

Claude Code proposed the plan and wrote the code. I directed it. I sent the plan back five times before any code was written. Then I read the code file by file, tests included (`e2e/main-flow.spec.ts`, `e2e/helpers.ts`), and sent back every problem I found. [REVIEW_LOG.md](REVIEW_LOG.md) has all of them, with what would break and how each was checked.

## Three calls I can walk through

1. **The published version survives a new edit after Undo.** The plan had no rule for numbering a new version. The obvious "shown + 1" breaks: with v3 published, undoing to v2 and editing tries to save v3 again. I chose the highest number plus one, recording the version it came from. The edit becomes v4. Undo goes to v2, and Discard still returns to published v3.
2. **Redo is checked across tabs.** The plan's out-of-date check compared the shown and published versions. I found the case it missed: one tab adds Allergies and undoes, another adds Medication and undoes. Both show v1, but Redo now leads to a different edit. The page now also sends where Redo stops, and any mismatch writes nothing.
3. **The browser test proves Publish did something.** The planned test checked that the badge was gone after Publish, which also passes if Publish does nothing. I made it check the badge at every step: absent on a new copy, present after an edit, absent after Publish. Medication Reconciliation must appear before Discard and be gone after a reload.

## Other corrections I made

- **Copy guard.** "All six actions refuse Vera's templates" would have blocked "Edit a copy". Copy accepts only an original.
- **Foreign keys kept.** Plain integers would let a copy point at a missing version.
- **Seed.** "Skip if any exist" could leave nine originals missing. It adds each missing one by name.
- **Rule tests** compare the whole text and the exact reply, so a misplaced section fails.
- **Copy's redirect** runs outside the error handler, so a saved copy is never reported as failed.
- **Request box.** Locked while saving, with one feedback line from the latest action.
- **Test database.** Only the local `vera_test` can be reset, and a refused address is never printed.

## What the brief left open, and what I decided

- **A request means "make sure this section exists".** Asking twice leaves one section. Asking again after Undo works. A request that changes nothing saves no version and keeps Redo.
- **Every "Edit a copy" makes a fresh, numbered copy** with its own history.
- **Missing heading, or two keywords:** Vera says "Nothing to change." for a missing heading, and only the first matching rule is tried.
- **Discarded changes** stay in the database, but Redo cannot bring them back.

## How it is built

Two tables: `templates` holds three pointers (shown, published, where Redo stops), and `template_versions` is insert-only. Every change is one transaction that locks the copy's row. Vera's rules and the version moves are pure functions with unit tests. The page reads from the database on each visit and rejects changes from an out-of-date view.

## Left out, and what I would improve

Left out: the design's "running" and "failed" screens (the brief says no delays, Stop or Try again), a working sidebar, and sign-in. Next: a browser test for two tabs with different Redo paths (a unit test covers it today), Enter to send, and a CI check.

## AI tools

Claude Code read the brief and the Figma file, proposed the plan, and wrote the code, tests and these documents. The decisions and corrections are mine. I approved the plan and each PR 1 commit before it was made. In PR 2 I reviewed the code before it was committed and again in the open pull request. Its last fix and the documentation were committed on my instruction, not approved one by one.
