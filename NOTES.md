# Notes

Claude Code wrote the code. I directed it: I sent its plan back five times before any code was written, then read the code and tests file by file and sent back what I found. The full record of every assumption, decision, trade-off and correction is in [REVIEW_LOG.md](REVIEW_LOG.md).

## Three decisions I can walk through

1. **Published v3 survives an edit made from v2.** The AI's plan had no rule for numbering a new version, and "shown + 1" would try to save v3 twice. A normal editor would drop v3 instead, but v3 is what I published. I chose to never delete a version: the edit is saved as v4 and records that it came from v2. Undo goes to v2, and Discard still returns to v3.
2. **Two tabs can show the same version and disagree about Redo.** The AI's check compared the shown and published versions. I found the gap: one tab adds Allergies and undoes, another adds Medication and undoes. Both show v1, but Redo now brings back different edits. I added a third number, where Redo stops. If any of the three changed, nothing is written.
3. **A repeated request preserves history.** The brief does not say what "add allergies" does when the section is already there. I read it as "make sure this copy has an Allergies section". Nothing is saved, so there are no duplicate versions and Redo still works. After an Undo removes the section, the same request adds it back.

## Unclear in the brief, and what I assumed

1. **A second "Edit a copy"** makes a fresh copy, "My SOAP Note (2)", with its own history. Opening an existing card continues that work.
2. **One user, no sign-in.** Copies are labelled "You".
3. **Screen size.** Built for 1440 × 900. The main actions stay visible down to 1280 wide.
4. **Request length.** Capped at 2,000 characters, with a clear message.
5. **Other templates.** Only the SOAP Note text is given, so it matches the brief exactly. The other nine are short placeholders.

Two rules are requirements from the brief, not my decisions: the first matching rule wins, and a missing heading changes nothing.

## Other places I overruled the AI

| The AI suggested                                 | I chose                                                    | Why                                                 |
| ------------------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------- |
| Plain integers if foreign keys took too long     | Keep the foreign keys                                      | A copy could point at a version that does not exist |
| One guard: every action refuses Vera's templates | Copy accepts only an original; the rest accept only a copy | "Edit a copy" would have failed                     |
| Tests that check the final screen                | Check the badge at every step, and each rule's whole text  | A Publish that does nothing would still pass        |
| Seed: skip if any template exists                | Add each missing original by name                          | One leftover row would block the other nine         |

## How it is built

Two tables: `templates` holds three numbers (shown, published, where Redo stops), and `template_versions` is never changed or deleted. Every change is one transaction that locks the copy's row. Vera's rules and the version moves are plain functions with unit tests, and browser tests cover the flow. Pages read the database on every visit.

## Left out, and what I would improve

- **Left out:** the design's "running" and "failed" screens (the brief says no delays), a working sidebar, and sign-in.
- **Rough edges:** matching is by keyword, so "remove allergies" adds the section. An out-of-date tab is refused, not merged. Copies cannot be renamed or deleted.
- **Next:** a browser test for the two-tab Redo case, Enter to send, and automated checks on pull requests.

## AI tools

Claude Code did the implementation and the drafting: the code, tests and migrations, and first drafts of the plan and these documents, from my instructions and review comments. The review and the decisions are mine. I approved the plan and each commit of the first pull request before it was made. In the second I reviewed the code before it was committed and again in the open pull request. Its last fix and the documentation were committed on my instruction.
