# Notes

How I built Vera Templates: what I assumed, the calls I made, the trade-offs I accepted, and where it is still rough.

Claude Code wrote many parts of code. I directed it. For every decision below I say what the AI suggested, what I chose and why, and what we ended up building. The same corrections, in the order they happened, are in [REVIEW_LOG.md](REVIEW_LOG.md).

## The short version

- **I kept the published version safe.** Editing after Undo saves a new version made from the one on screen. Nothing is deleted, so Discard always returns to what was published (4.1).
- **I made out-of-date tabs harmless.** Every action is checked against the three version numbers the page showed. Any mismatch writes nothing (4.4).
- **I made a request mean "make sure this section exists".** Asking twice leaves one section, and asking again after Undo works (3.1).
- **I kept the database strict.** The foreign keys stayed, versions are never changed or deleted, and every change is one transaction (section 5).
- **I made the tests prove each step,** not only the final screen (7.1).
- **I listed what is still rough** in section 8.

## How I worked

1. **Understand first.** Before any code, the AI read the whole brief and every Figma screen, and looked up current practice in the official Next.js, TypeScript and PostgreSQL documentation. I told it not to copy conventions from an older repo of mine.
2. **Ask, do not assume.** I told it to bring me every case the brief does not answer. My answers to those cases became the core of the design (sections 2 to 4).
3. **Plan before code.** I sent the written plan back five times, each time with a concrete failure: a copy button that would refuse to copy, a version number that would collide, an out-of-date tab that would publish the wrong version. Code started only after that.
4. **Two pull requests.** "Browse and copy templates", then "Edit and publish a copy". Each edge case ships with the behaviour it belongs to.
5. **Read the code.** I read the code file by file, tests included (`e2e/main-flow.spec.ts`, `e2e/helpers.ts`), and sent back every problem I found. Five bugs in the second pull request were found this way (section 6).
6. **Trust only clean checks.** I asked for each commit to be checked in an empty folder, because a check that passes in the working folder can fail in a fresh clone. It did once (7.3).

The bar I set for the code: simple and readable. A short description at the top of every file. One way of doing each thing, everywhere. Shared pieces instead of copies. Tailwind theme tokens instead of one-off values. Strict tooling: TypeScript strict mode, type-checked lint rules with zero warnings, Prettier, and every input validated.

## 1. Assumptions I made

| The brief does not say                      | I assumed                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Who the user is                             | One user, no sign-in. A copy shows "You", "AK" and "Family medicine", as in the design.                                   |
| Which screens to support                    | Desktop only, 1440 × 900. The sidebar is decoration.                                                                      |
| The design's "running" and "failed" screens | Not built. The brief says changes happen at once, with no delays, Stop or Try again.                                      |
| The text of the other nine templates        | Only the SOAP Note is given, so it matches the brief character for character. The other nine have short placeholder text. |
| What a copy is called                       | "My" plus the original's name, as the design shows.                                                                       |
| How long a request can be                   | 2,000 characters. That number is mine. Anything longer is refused with a clear reason.                                    |
| What "contains the keyword" means           | Any message containing "allergies" or "medication", in any letter case. There is no attempt to understand the sentence.   |
| Whether users can type in a template        | Never. The only way to change a copy is to send Vera a request.                                                           |

## 2. Copies

### 2.1 A second click on "Edit a copy"

- **The question:** the design shows one copy, "My SOAP Note". It does not show what a second click does.
- **The AI suggested:** a new copy each time, named "My SOAP Note 2". The alternatives were identical names, or reopening the first copy.
- **I chose:** a new copy each time, named "My SOAP Note (2)", starting at published version 1 with its own history. Opening my card in the library means "continue my work". Going back to Vera's original and clicking "Edit a copy" means "give me a clean start". Reopening an edited copy there would mix the two up.
- **What we built:** the name is chosen inside the same transaction that saves the copy, with the original's row locked, so two tabs copying at the same moment get different names. The button switches off while saving, so a double-click makes one copy. Two deliberate clicks still make two.
- **Rough edge:** copies cannot be renamed or deleted, so the library can fill up.

### 2.2 Who may do what

- **The AI suggested:** one guard for everything: "all six actions refuse to touch a Vera template".
- **What was wrong:** "Edit a copy" is one of the six, and it runs on a Vera template. The button would fail on the only screen that has it.
- **I chose:** Copy accepts only an original. Send, Undo, Redo, Publish and Discard accept only a copy. The server enforces this, not only the buttons.
- **What we built:** each write checks the kind of template inside its transaction. A database rule also keeps an original at version 1.

### 2.3 Opening the copy after it is saved

- **The AI suggested:** every action handled the same way, returning its result from inside one error handler.
- **What was wrong:** Next.js redirects by throwing. Inside the handler, a copy that saved correctly would be reported as failed, and a second click would make another copy.
- **I chose:** catch only the database failure. Redirect after the save, outside the handler.

## 3. Vera's rules

### 3.1 The same request sent twice

- **The question:** the brief says "add allergies" inserts the Allergies block. Sent twice, does it insert two?
- **The AI suggested:** do nothing if the section is already there.
- **I chose:** the same result, as an exact rule. A request means "make sure this copy has this section". Look at the text on screen for a line equal to the heading, ignoring letter case and surrounding spaces. Nothing remembers past requests, so after an Undo removes the section, the same request adds it back.
- **What we built:** one plain function: text and message in, new text and reply out. It replies "Nothing to change." when the section is there.

### 3.2 Which rule runs

- **The AI suggested:** deal with a missing heading in a later pull request, and two keywords in one message later still.
- **What was wrong:** the brief already answers both. Splitting them invited a bug: trying "medication" because "allergies" matched but changed nothing.
- **I chose:** pick the first matching rule once, in the brief's order. Apply it, or reply "Nothing to change." Never fall through to the next rule. A missing target heading changes nothing.
- **Rough edge:** matching is by keyword, as the brief requires. "remove allergies" still adds the section, and singular "allergy" matches nothing.

### 3.3 A request that changes nothing

- **I chose:** it writes nothing: no version and no pointer change. Otherwise the history fills with identical versions, and a no-op after Undo would take Redo away.

### 3.4 How the rules are tested

- **The AI suggested:** tests that check the new section appears.
- **What was wrong:** a rule that appends the section at the bottom would pass.
- **I chose:** start from the brief's full SOAP Note and compare the entire resulting text and the exact reply. Allergies must sit immediately before `Medications:`, and Medication Reconciliation immediately before `Objective:`.

## 4. Versions

### 4.1 Editing after Undo, when a later version is published

- **The question:** v3 is published. I undo to v2 and ask for a change. A normal editor throws v3 away at this point, but v3 is what I published.
- **The AI suggested:** keep every version, save the change as the next one, and remove Redo. Its plan had no rule for the new number. The obvious "shown + 1" would try to save v3 a second time.
- **I chose:** never delete a version. The change is saved as v4 and records that it was made from v2. The number is the highest saved plus one. Undo follows the recorded parent, so numbers may skip. A request that changes nothing must leave Redo to v3 working.
- **What we built:** three numbers on each copy: the version shown, the version published, and where Redo stops.

| Step                                             | Shown | Published | Redo stops at |
| ------------------------------------------------ | ----- | --------- | ------------- |
| v3 is published                                  | 3     | 3         | 3             |
| Undo                                             | 2     | 3         | 3             |
| A request that changes nothing                   | 2     | 3         | 3             |
| A request that adds a section (v4, made from v2) | 4     | 3         | 4             |
| Undo                                             | 2     | 3         | 4             |
| Redo                                             | 4     | 3         | 4             |
| Discard                                          | 3     | 3         | 3             |

- **Trade-off:** version numbers skip (v2, then v4), and abandoned versions stay in the database for good. I accepted that to guarantee the published version can always be recovered.

### 4.2 Discard

- **I chose:** Discard returns to the published version and makes it the end of the Redo path, so Redo cannot bring the discarded change back. The discarded rows stay saved.

### 4.3 The "Unpublished changes" badge

- **The AI suggested:** a test that compared the text of versions.
- **What was wrong:** v4 can hold the same words as published v3. Text cannot show which one is on screen, or whether Discard really returned to v3.
- **I chose:** the badge compares version numbers, never text. It also shows when the shown version is behind the published one. The tests assert the numbers.

### 4.4 Actions from an out-of-date tab

- **The AI suggested:** a row lock, so two tabs take turns.
- **What was wrong:** taking turns is not enough. Tab A shows v2. Tab B moves to v3. Tab A clicks Publish, and v3 is published though its user never read it.
- **The AI's fix:** send the shown and published numbers with each action and compare them.
- **What was still wrong:** v1 is published. Tab A adds Allergies (v2) and undoes. Tab B adds Medication (v3) and undoes. Both tabs show v1 with v1 published, but Redo in tab A now leads to Medication, not Allergies.
- **I chose:** compare all three numbers, including where Redo stops, while holding the lock. If any differs, write nothing, refresh the page, and say the template was changed somewhere else.
- **Trade-off:** the action is refused, not merged. The user looks at the latest version and repeats it. That is right for one user with two tabs. A team product would need more.

### 4.5 Buttons with nothing to do

- **I chose:** Undo at version 1 and Redo at the end are switched off on screen, and the server ignores them even if a form sends them.

## 5. Database

### 5.1 Two tables

- **The AI suggested:** `templates` (one row per original or copy, holding the three numbers) and `template_versions` (one row per saved text, never changed or deleted).
- **I kept it:** history cannot be damaged by a later bug, and every move is a small update to one row.

### 5.2 Foreign keys

- **The AI suggested:** if the keys between the two tables took too long to build, fall back to plain integers.
- **What was wrong:** a copy could then point at version 999 with three saved, or at another template's version. Correct database state is one of the things this exercise is graded on.
- **I chose:** keep the keys. A copy and its version 1 need each other, so the keys are checked at commit and both rows go in one transaction. If time ran short, polish would be cut first.
- **What we built:** three keys from a template to its versions, checked at commit, in a hand-written migration. Rules in the database: an original stays at version 1, a version's parent belongs to the same template and has a lower number, and original names are unique.
- **How it was checked:** six bad writes were tried straight in the database. All were refused.

### 5.3 One transaction per change

- **The AI suggested:** every change runs in one transaction that locks the copy's row first.
- **I kept it,** and added the out-of-date check on top (4.4), because a lock alone only decides who goes first.

### 5.4 The seed

- **The AI suggested:** "skip if any templates exist".
- **What was wrong:** one leftover row would stop the other nine originals from ever being added.
- **I chose:** add each missing original by name, with its version 1, in one transaction.
- **Then I asked** what happens when two seeds start together. Now a clash on the name is skipped inside the insert itself, and version 1 is created only for a row that was really inserted.
- **Then I found** it skipped every kind of clash. A row already sitting on ID 1 made it report "Added 9 of 10" as a success, with the SOAP Note missing. I narrowed it to duplicate original names. Anything else fails loudly.
- **Rough edge:** a skipped insert still uses up an ID, so IDs have gaps. Harmless.

### 5.5 Migrations

- **I chose:** schema changes are generated SQL files committed to the repo and applied with `npm run db:migrate`. Pushing the schema straight to the database is for throwaway work only.

### 5.6 The database address

- **The AI built:** a check that accepted `postgres:vera` and `postgres://`.
- **I chose:** require `postgres://` or `postgresql://` and a host, so a mistyped address fails with a clear message before any migration runs.

## 6. Screen behaviour

### 6.1 Vera's reply

- **The AI suggested:** show the reply only while viewing the version that reply produced.
- **What was wrong:** "Nothing to change." produces no version, so the reply the brief requires would never show.
- **I chose:** always show the latest reply. The small Undo beside it appears only when that request saved a version and that version is still on screen.

### 6.2 The request box while saving

- **The AI built:** a box that stayed editable while saving and cleared itself when the request succeeded.
- **What was wrong:** send "add allergies", start typing "add medication", and the first success erases it.
- **I chose:** the box is read-only while saving. It is cleared only when the request worked. If the request fails, the text stays.

### 6.3 One feedback line

- **The AI built:** an error from the small Undo that took priority over every later result. After that was fixed, the toolbar and the request box still kept separate errors.
- **What was wrong:** the screen could say something failed after a later action had worked.
- **I chose:** every action on a copy goes through one shared function. There is one feedback line, always from the latest action, and one "saving" state for every button.
- **Rough edge:** the line sits above the request box at the bottom. A refused toolbar action shows its reason there, far from the button.

### 6.4 A request that is too long

- **The AI built:** a 2,001-character request was answered with "Type a request for Vera first."
- **I chose:** a message about the length. The text stays in the box.

### 6.5 Labels come from saved data

- **The AI suggested:** "Clinical document" written into the page.
- **What was wrong:** a patient handout would be mislabelled.
- **I chose:** group names, counts, the details line and the "You" card all come from saved rows.

### 6.6 The saved text is never rewritten

- **I chose:** headings, `[fields]`, `(instructions)` and `"quotes"` are styled only when the text is drawn. The stored text is the plain original, so display code can never change the SOAP Note's punctuation or spacing. A test checks that the pieces of every line join back to the exact line.

### 6.7 No caching, rate limits or queues

- **I checked** whether any of the three was needed. None is: there is one user, changes are immediate, and there are about a dozen rows. A cache could show an old version of a clinical template, so every page reads the database on each visit.

## 7. Tests and delivery

### 7.1 A browser test that proves each step

- **The AI suggested:** check the badge is gone after Publish, and Medication Reconciliation is gone after Discard.
- **What was wrong:** both checks pass when Publish or "add medication" does nothing.
- **I chose:** check the badge at every step: absent on a new copy, present after an edit, gone after Undo, back after Redo, gone after Publish. Medication Reconciliation must be on screen before Discard and gone after a reload, with Allergies still there. Then reopen the copy from the library, check Vera's original is unchanged, and check a second copy starts clean.
- **Also:** run it twice in a row. The second run catches the assumption that there is only one "My SOAP Note".

### 7.2 The test database

- **The AI suggested:** allow a reset on any database whose name ends in `_test`. Later, its guard printed the address it refused.
- **What was wrong:** a mistaken address could wipe another project's data, and an address can contain a password.
- **I chose:** only the local database named exactly `vera_test` can be reset, and the message never includes the address. The tests build and serve the app themselves against that database, so development data is not touched.

### 7.3 Checks on a clean copy

- **The AI reported:** checks as passing from its working folder, and wrote "verified" in the plan before anything was built.
- **I chose:** nothing is called passed until it has run. Each commit is exported to an empty folder and installed, linted, type-checked, tested and built there.
- **What it found:** the type check and lint both failed in a clean copy because Next.js's route types had not been generated. Both commands now generate them first.

### 7.4 Two pull requests

- **The AI suggested:** three pull requests, with edge cases pushed into the later ones.
- **I chose:** two. The first gives a working library, a read-only template and the copy flow. The second gives a copy its editing and publishing. Edge cases live in the pull request that owns the behaviour.

### 7.5 Names and layers

- **The AI suggested:** `vera.ts`, `versions.ts`, `TopBar`, `ChangeBar`, and one file for every read and write.
- **I chose:** names that say what a file does: `template-rules.ts`, `version-history.ts`, `template-toolbar.tsx`, `change-request-form.tsx`. Reads live in `src/data/templates.ts`, writes in `src/data/template-mutations.ts`, form entry points in `src/actions/template-actions.ts`. Rules with no database or screen code live in `src/domain/`, where they are easy to test.

### 7.6 Where the repo lives

- **The AI said:** the checkout in my Desktop folder was healthy.
- **What was wrong:** `git fsck` showed a broken branch reference and malformed file names. Duplicate files had appeared in that synced folder.
- **I chose:** a clean clone outside Desktop, with the pending changes carried over and compared byte for byte.

### 7.7 Node.js version

- **I chose:** the README says Node.js 24, and every check runs on it, because a dependency of the lint tools needs a recent Node.js.

## 8. Rough edges I know about

- **Keyword matching is literal.** "remove allergies" adds an Allergies section. That is what the brief specifies.
- **A refused action is not merged.** An out-of-date tab must look again and repeat the action.
- **The feedback line is at the bottom,** even for toolbar actions.
- **Version numbers skip, and abandoned versions are kept for good.**
- **Copies cannot be renamed or deleted.**
- **The two-tab Redo case** (4.4) has a unit test but no browser test.
- **No automated checks on pull requests.** Checks were run by hand before each commit.

## 9. Left out, and what I would do next

Left out on purpose: the design's "running" and "failed" screens, a working sidebar, sign-in, background work and real AI. The brief asks for a small single-user demo with fixed rules.

Next I would add a browser test for the two-tab Redo case, show toolbar feedback next to the toolbar, add Enter to send, let the guide panel collapse, and run the checks automatically on every pull request.

## 10. AI tools

Claude Code wrote the code, the tests and the migrations, and drafted the plan. I use Claude Code as parallel dr

Approvals, as they happened: I approved the plan and each commit of the first pull request before it was made. In the second pull request I reviewed the code before it was committed, and again in the open pull request. Its last fix and the documentation were committed on my instruction, not approved one by one.
