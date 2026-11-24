# Notes

Claude Code and I built this together. It wrote the code, and I directed the work: I sent the AI's plan back five times before any code was written, then read the code and tests file by file and sent back what I found. Every correction is in [REVIEW_LOG.md](REVIEW_LOG.md).

## Three decisions I can walk through

1. **Published v3 survives an edit made from v2.** The AI's plan had no rule for numbering a new version, and "shown + 1" would save v3 twice. A normal editor would drop v3 instead, but v3 is what I published. So nothing is deleted: the edit is saved as v4, made from v2. Undo goes to v2, and Discard still returns to v3.
2. **Two tabs can show the same version and disagree about Redo.** The AI's check compared the shown and published versions. I found the gap: one tab adds Allergies and undoes, another adds Medication and undoes. Both show v1, but Redo would bring back different edits. So each action sends three numbers (shown, published, where Redo stops), and any mismatch writes nothing.
3. **A repeated request preserves history.** The brief does not say what "add allergies" does when the section is already there. I read it as "make sure this copy has an Allergies section". Nothing is saved, so Redo still works. After Undo, the same request adds it back.

## Gaps in the brief, and AI suggestions I overruled

- **A second "Edit a copy"** makes a fresh copy, "My SOAP Note (2)", with its own history.
- **After Discard,** Redo cannot bring the discarded change back.
- **Narrow windows:** the brief targets 1440 × 900. The main buttons stay visible down to 1280.
- **Request length** is capped at 2,000 characters.
- **Foreign keys stayed.** The AI offered plain integers if they took too long. A copy could then point at a version that does not exist.
- **Copy has its own rule.** The AI's "every action refuses Vera's templates" would have blocked "Edit a copy".
- **Tests prove each step.** The AI's tests checked only the final screen, which passes when Publish does nothing. Now the badge is checked at every step, and each rule's whole text is compared.
- **The seed adds each missing original by name.** The AI's "skip if any exist" could leave nine missing.

From the brief, not my call: the first matching rule wins, and a missing heading changes nothing.

## Implementation, cuts and AI tools

- **Built:** two tables. `templates` holds the three numbers, and `template_versions` is never changed or deleted. Every change is one transaction that locks the copy's row. Pages read the database on every visit. Unit tests cover the rules, and seven browser tests cover the flow.
- **Left out:** the design's "running" and "failed" screens, because the brief says no delays.
- **Would improve:** matching is by keyword, so "remove allergies" adds the section. Copies cannot be renamed or deleted. Next: a browser test for the two-tab Redo case, Enter to send, and automated checks on pull requests.
- **AI tools:** Claude Code wrote the implementation and the first drafts of these documents, from my instructions and review comments. The review and the decisions are mine.
