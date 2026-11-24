# Notes

Claude Code wrote the plan and the code. I sent the plan back five times before any code was written, and I reviewed every commit before approving it. The table shows the corrections that mattered most. Every objection I raised is in [REVIEW_LOG.md](REVIEW_LOG.md).

## Where I overruled the AI

| The AI proposed                                                                               | What was wrong                                                                                 | What I chose                                                                                      |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| One rule: all six actions refuse Vera's templates                                             | "Edit a copy" would fail on the only screen that offers it                                     | Copy accepts only an original. The other five accept only a copy                                  |
| Number a new version "shown + 1"                                                              | Publish v3, undo to v2, edit: it tries to save v3 again                                        | Highest number + 1, recording the version it was made from. Discard still returns to published v3 |
| A row lock is enough for Publish                                                              | An out-of-date tab could publish, or Redo into, a version its user never saw                   | The page sends the three version numbers it showed. If any changed, nothing is written            |
| Fall back to plain integers if the foreign keys took too long                                 | A copy could point at a version that does not exist                                            | Keep the foreign keys, checked at commit                                                          |
| Seed: skip when any template exists                                                           | One leftover row stops the other nine                                                          | Add each missing original by name. Two seeds at once are safe                                     |
| Tests that check the final screen, or that a section appears                                  | They pass when "add medication" or Publish does nothing, or a section lands in the wrong place | Check the badge at every step. Compare the whole text and the exact reply                         |
| Copy's redirect inside the error handler                                                      | A saved copy is reported as failed, and a second click makes another                           | Redirect after the save, outside the handler                                                      |
| A test reset that accepted any database ending in `_test`, and printed the address it refused | It could wipe another project's data and print a password                                      | Only the local `vera_test`. The address is never printed                                          |
| A request box that cleared itself on success, and separate errors per form                    | Newer typing was erased. An old error stayed after a later success                             | The box is locked while saving. One feedback line, from the latest action                         |

## What the and brief left open, and what I decided

- **A request means "make sure this section exists".** Asking twice leaves one section. Asking again after undoing it works. A request that changes nothing saves no version and keeps Redo.
- **Every "Edit a copy" makes a fresh, numbered copy** with its own history. Opening an existing card continues that work.
- **Missing heading, or two keywords:** Vera says "Nothing to change." for a missing heading, and only the first matching rule is tried.
- **"Unpublished changes"** compares version numbers, not words. Two versions can hold the same text.
- **Discarded changes** stay in the database, but Redo cannot bring them back.

## How it is built

- **Two tables.** `templates` has three pointers: shown, published, and where Redo stops. `template_versions` is insert-only.
- **Every change is one transaction** that locks the copy's row, so two tabs take turns.
- **Vera's rules and the version moves are pure functions** with unit tests. Browser tests cover the main flow.
- **Nothing is cached**, so a stale clinical template is never shown.

## Left out, and what I would improve

Left out: the design's "running" and "failed" screens (the brief says no delays, Stop or Try again), a working sidebar, and sign-in. Next I would add Enter to send, collapsing the guide panel, and a CI check.

## AI tools

Claude Code read the brief and the Figma file, proposed the plan, and wrote the code, tests, migrations and these documents. I made the decisions and reviewed the plan and each commit. Nothing was committed, pushed or merged without my approval.
