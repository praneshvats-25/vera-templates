# Review log

Every call in this file is mine. Claude Code wrote the code. I reviewed its plan and its code, and sent back what was wrong and what to do instead.

[NOTES.md](NOTES.md) is the one-page summary. This is the full record: what I assumed, every decision (what the AI suggested, what was wrong, what I chose, what we built, the trade-off), how each was checked, and every correction in the order it happened.

## How I worked

1. **Understand first.** Before any code, the AI read the whole brief and every Figma screen, and looked up current practice in the official Next.js, TypeScript and PostgreSQL documentation. I told it not to copy conventions from an older repo of mine.
2. **Ask, do not assume.** I told it to bring me every case the brief does not answer. My answers to those cases became the core of the design (sections 2 to 4).
3. **Plan before code.** I sent the written plan back five times, each time with a concrete failure: a copy button that would refuse to copy, a version number that would collide, an out-of-date tab that would publish the wrong version. Code started only after that.
4. **Two pull requests.** "Browse and copy templates", then "Edit and publish a copy". Each edge case ships with the behaviour it belongs to.
5. **Read the code.** I read the code file by file, tests included (`e2e/main-flow.spec.ts`, `e2e/helpers.ts`), and sent back every problem I found. Five bugs in the second pull request were found this way (section 6).
6. **Trust only clean checks.** I asked for each commit to be checked in an empty folder, because a check that passes in the working folder can fail in a fresh clone. It did once (7.3).

The bar I set for the code: simple and readable. A short description at the top of every file. One way of doing each thing, everywhere. Shared pieces instead of copies. Tailwind theme tokens instead of one-off values. Strict tooling: TypeScript strict mode, type-checked lint rules with zero warnings, Prettier, and every input validated.

## 1. Assumptions I made

| The brief does not say                      | I assumed                                                                                                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Who the user is                             | One user, no sign-in. A copy shows "You", "AK" and "Family medicine", as in the design.                                                  |
| Which screens to support                    | Built for a desktop at 1440 × 900, as the design is drawn. The main actions stay on screen down to 1280 wide. The sidebar is decoration. |
| The design's "running" and "failed" screens | Not built. The brief says changes happen at once, with no delays, Stop or Try again.                                                     |
| The text of the other nine templates        | Only the SOAP Note is given, so it matches the brief character for character. The other nine have short placeholder text.                |
| What a copy is called                       | "My" plus the original's name, as the design shows.                                                                                      |
| How long a request can be                   | 2,000 characters. That number is mine. Anything longer is refused with a clear reason.                                                   |
| What "contains the keyword" means           | Any message containing "allergies" or "medication", in any letter case. There is no attempt to understand the sentence.                  |
| Whether users can type in a template        | Never. The only way to change a copy is to send Vera a request.                                                                          |

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

- **The question:** the brief says "add allergies" inserts the Allergies block. Sent twice, does it insert two? The brief does not answer this, so it was my call.
- **The AI suggested:** do nothing if the section is already there.
- **I chose:** the same result, as an exact rule. A request means "make sure this copy has this section". Look at the text on screen for a line equal to the heading, ignoring letter case and surrounding spaces. Nothing remembers past requests, so after an Undo removes the section, the same request adds it back.
- **What we built:** one plain function: text and message in, new text and reply out. It replies "Nothing to change." when the section is there.

### 3.2 Which rule runs

- **The brief requires:** the first matching rule wins, and a missing heading changes nothing. These two are requirements, not my decisions.
- **The AI suggested:** building the missing-heading case in a later pull request, and two keywords in one message later still.
- **What was wrong:** required behaviour would have shipped late. Splitting it also invited a bug: trying "medication" because "allergies" matched but changed nothing.
- **I chose:** ship both with the rules. Pick the first matching rule once, in the brief's order. Apply it, or reply "Nothing to change." Never fall through to the next rule.
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

### 6.7 A laptop-sized window

- **The AI built:** a page fixed at 1,440 wide, the size of the design.
- **What was wrong:** in a 1,280-wide browser the fourth card was cut off, "Edit a copy" was outside the first view, and "Publish changes" was almost entirely off screen.
- **I chose:** keep the 1440 design exactly as it is, and let the frame shrink to 1280, where the sidebar and the content column still fit.
- **How it was checked:** a browser test opens the library, an original and a copy at 1280 wide and checks the fourth card and every main button are fully on screen. It failed before the change. The other browser tests still run at 1440.
- **Rough edge:** below 1280 the page scrolls sideways.

### 6.8 No caching, rate limits or queues

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
- **Below 1280 wide the page scrolls sideways.** It is a desktop layout.
- **No automated checks on pull requests.** Checks were run by hand before each commit.

## 9. Left out, and what I would do next

Left out on purpose: the design's "running" and "failed" screens, a working sidebar, sign-in, background work and real AI. The brief asks for a small single-user demo with fixed rules.

Next I would add a browser test for the two-tab Redo case, show toolbar feedback next to the toolbar, add Enter to send, let the guide panel collapse, and run the checks automatically on every pull request.

## 10. How each decision was checked

The reasoning for each decision is in sections 2 to 7 above. This section is the evidence.

### What editing a copy means

**Each click on "Edit a copy" makes a new copy.**

- _How it was checked:_ unit tests for the names. The browser test edits the first copy, makes a second, and checks the second is clean and the first still has its change. Three copies started at the same moment got three different names.

**Vera's original and a copy allow different actions.**

- _How it was checked:_ the five actions were sent to an original by script and all were refused. A database rule also keeps an original at version 1.

### What a request can change

**A request means "make sure this section exists".**

- _How it was checked:_ unit tests for asking twice, for a heading in different case or spacing, and for asking again after the insertion was undone.

**The rules are fixed, and tested on the whole text.**

- _How it was checked:_ the unit tests start from the brief's full SOAP Note and compare the entire resulting text and the exact reply. They cover both keywords in one message, no falling through, singular "allergy", and a missing heading.

**A request that changes nothing writes nothing.**

- _How it was checked:_ a unit test ("a request that changes nothing saves nothing, so Redo to v3 still works"), the same case by script against the database, and a browser test that a refused request stays in the box.

### How version history works

**Three separate values: the version on screen, the published version, and where Redo stops.**

- _How it was checked:_ unit tests on version numbers and parents for every step of this case. After the browser test, the database showed the discarded version still saved, with its parent. Before merging I ran the case in the browser myself: after publishing v3 and undoing to v2, a request that changed nothing kept Redo, a new edit with the same text as v3 still showed as unpublished, and Discard restored the published version through a reload.

**"Unpublished changes" compares version numbers, not text.**

- _How it was checked:_ a unit test ("v4 counts as unpublished even if its words equal the published v3") and the badge checks at every step of the browser test.

**An out-of-date tab must not act on a state its user did not see.**

- _How it was checked:_ a unit test for exactly that Redo case. By script, Publish, Redo and a request from an old tab were all refused and wrote nothing. Two browser tests use a second tab to make the first one out of date.

### What the database enforces

**The foreign keys stayed.**

- _How it was checked:_ six bad writes were tried directly in the database and all were refused. One good write was accepted.

**Copying repeats on purpose. Seeding is safe to repeat.**

- _How it was checked:_ two seeds were started together, five times, and each time left exactly ten originals with one version each. The ID clash now fails with an error. The browser test checks that one click adds exactly one copy to the library.

### What I changed after reading the screen code and the tests

**The latest action owns the feedback line.**

- _How it was checked:_ three browser tests: the box is locked while a held response is saving, a refused Undo does not hide the next reply, and an error goes away after a later success in both directions. The last one failed on the old code and passes on the fix.

**The browser tests prove each step, not only the end.**

- _How it was checked:_ five browser tests run against a production build with their own database, `vera_test`. They passed twice in a row and once more on a clean copy of the repo. The development database was not touched.

### By hand in Chrome, on the final build

The finished build was clicked through in Chrome against the brief's steps, with real clicks and typing.

- **Library:** two groups, "Clinical documents" and "Patient documents". Copies come first and say "You". Originals say "Vera".
- **Original SOAP Note:** read-only. The only button is "Edit a copy", and there is no text box.
- **"Edit a copy":** opened a new copy, "My SOAP Note (3)", at version 1 with no badge and nothing to undo.
- **"add allergies":** the block appeared immediately before `Medications:`, the reply was "Done. Added an Allergies section.", and the badge appeared.
- **Undo, Redo, Publish:** Undo removed the section and the badge. Redo brought both back. Publish cleared the badge.
- **"add medication", then Discard:** the block appeared immediately before `Objective:` with its reply and the badge. Discard removed it. After a reload, Allergies was still there and Medication Reconciliation was gone.
- **Requests that change nothing:** the same request again, a request with no keyword, and a request with both keywords each got "Nothing to change." and saved no version.
- **A new edit after Undo:** with version 2 published, Undo went to version 1 and the badge showed. "ADD MEDICATION" in capitals was saved as version 4, made from version 1. Undo went to version 1, Redo to version 4, and Discard returned to published version 2.
- **Out-of-date tab:** a second tab made an edit. Undo in the first tab was refused with "This template was changed somewhere else. You are now seeing the latest version." and nothing was written.
- **Vera's original afterwards:** unchanged.
- **1280-wide window:** the fourth library card, "Edit a copy" and the version controls were all fully on screen, with no sideways scrolling.

## 11. Every correction I made, in order

### Cases I decided before the plan

| Question                                                          | The AI recommended                                                                                | What I chose, and why                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version 3 is published. I undo to version 2 and ask for a change. | Keep every version, save the change as the next version, and remove Redo, "like a normal editor". | Keep v3 published. Save the change as v4 and record that it came from v2. Undo from v4 goes to v2, Redo goes back to v4, and Discard returns to v3 even after a reload. I added one rule it had missed: a request that changes nothing saves nothing and must leave Redo to v3 working.                     |
| "add allergies" is sent twice.                                    | Do nothing if the section is already there.                                                       | The same result, with an exact rule: treat the request as "make sure this copy has an Allergies section". Look for a line whose trimmed text equals `Allergies:` in any case. If the target heading is missing, reply "Nothing to change." The same rule applies to Medication Reconciliation.              |
| "Edit a copy" is clicked a second time.                           | A new copy named "My SOAP Note 2".                                                                | A fresh copy named "My SOAP Note (2)", starting at published version 1 with its own history, and the button disabled while saving. Why: opening my card should continue my work, and going back to Vera's original should give a clean start. I also asked for a test that the two copies stay independent. |
| Should there be a browser test?                                   | One test, in the last stage.                                                                      | One Playwright test of the whole flow, against a separate seeded test database, with the steps I listed.                                                                                                                                                                                                    |

### Plan review, round 1

| The AI proposed                                                                                         | What was wrong                                                                                                                         | What I chose                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "All six actions refuse to touch a Vera template."                                                      | Applied literally, "Edit a copy" fails on the only screen that offers it.                                                              | Copy has its own rule: it accepts a Vera original and saves the copy and its version 1 in one transaction. Send, Undo, Redo, Publish and Discard each need a copy. All checked on the server.                                                                                                                                             |
| No rule for numbering a new version (in effect "shown + 1").                                            | Publish v3, undo to v2, then edit: it tries to insert v3 again.                                                                        | While holding the row lock, use the highest saved number plus one, and record v2 as v4's parent. Redo follows the saved end of the line back toward the shown version.                                                                                                                                                                    |
| A database lock makes Publish correct.                                                                  | Tab A shows v2. Tab B moves to v3. Tab A clicks Publish, and v3 is published though the user was reading v2.                           | Send the version the user saw with the action. Compare it under the lock. If it changed, write nothing and ask the user to look again.                                                                                                                                                                                                    |
| Missing headings handled in a later PR, two keywords in one message later still.                        | The brief already specifies both. An easy bug: trying "medication" after "allergies" matched but changed nothing.                      | Pick the first matching rule once. Apply it, or reply "Nothing to change." No falling through to the next rule. The version count and Redo are left alone.                                                                                                                                                                                |
| Seed: "skip if any exist".                                                                              | One existing original stops the other nine from ever appearing. An ID also does not guarantee the order.                               | A stable key for each original. Insert the missing ones with their version 1 in one transaction. An explicit library sort. Seeding twice still gives six clinical and four patient originals and keeps my copies.                                                                                                                         |
| Browser test: check Medication Reconciliation is absent after Discard.                                  | If "add medication" does nothing, the test still passes. Creating `vera_test` also does not prove the server uses it.                  | First assert the section and the badge appear. After Discard and a reload, assert Allergies stays and both are gone. A dedicated test server on the same test database. Never reset the development database.                                                                                                                             |
| Type check with `tsc --noEmit`.                                                                         | In a clean copy of the repo it failed with `Cannot find name 'LayoutProps'`. The local `.next` folder had hidden it.                   | `next typegen && tsc --noEmit`. Add a production build to the checks, and check that a new copy shows in the library on that build.                                                                                                                                                                                                       |
| Fall back to plain integers if the deferred foreign keys took too long.                                 | A copy could point at version 999 with only three saved.                                                                               | Keep the foreign keys. Checking them at commit lets a copy and its version 1 be saved together. If time is short, cut polish first.                                                                                                                                                                                                       |
| File names `vera.ts`, `versions.ts`, `TopBar`, `ChangeBar`, and one file for every read and write.      | "Vera" could mean the whole product. "Bar" says where a thing sits, not what it does. One file held reads, locking and six operations. | `template-rules.ts`, `version-history.ts`, `template-toolbar.tsx`, `change-request-form.tsx`. Reads in `templates.ts`, writes in `template-mutations.ts`, form entry points in `template-actions.ts`. The parser is `parse-template-line.ts` and the drawing is `template-preview.tsx`. The saved text is always the original plain text. |
| "Clinical document" written into the page.                                                              | A patient handout would be mislabelled.                                                                                                | Labels, counts and the "You" card all come from saved data.                                                                                                                                                                                                                                                                               |
| Deleting `src/app/page 2.tsx` listed as a deliverable.                                                  | That file was never tracked, so it cannot appear in a pull request.                                                                    | Leave it alone. Stage files by name.                                                                                                                                                                                                                                                                                                      |
| Plan approval treated as permission for ten commits, and squash-merge quietly changed to merge commits. | Those are separate decisions.                                                                                                          | Keep asking me before each commit, push, pull request and merge.                                                                                                                                                                                                                                                                          |

### Plan review, round 2

| The AI proposed                                                                                          | What was wrong                                                                                                                                                                       | What I chose                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The out-of-date check compared the shown and published versions.                                         | v1 is published. Add Allergies (v2), then Undo. In another tab add Medication (v3), then Undo. Both tabs show v1 with v1 published, but Redo now leads to Medication, not Allergies. | Compare the Redo destination too. Add this exact case as a test.                                                                                                                                                                                  |
| Show Vera's reply only while viewing the version that reply produced.                                    | "Nothing to change." produces no version, so the required reply would never show.                                                                                                    | Always show the latest reply. Offer the small Undo only for a change that saved and is still on screen. If saving fails, keep the typed message and show a short error.                                                                           |
| Copy naming promised in one place, the source name copied in another, and naming deferred to a later PR. | Two conflicting definitions. Two tabs could also pick the same number.                                                                                                               | Name the copy inside the Copy transaction. Lock the original's row first, choose the number, set the source, then insert the copy and its version 1 together.                                                                                     |
| A branch test that compared text.                                                                        | v3 and v4 can hold the same words, so text cannot show whether Discard returned to v3.                                                                                               | Assert on version numbers. v4 shows "Unpublished changes" despite identical text. After Discard: shown, published and Redo stop are all 3, no badge, no Redo. Undo at v1 and Redo at the end do nothing on the server, even if a form sends them. |
| "Playwright migrates and seeds a test database."                                                         | Nothing created `vera_test` on a fresh clone, and the connection read its address the moment it was imported.                                                                        | Create the test database explicitly. Pass its address to the migration, seed, build and server. Run the test twice: the second run catches the assumption that there is only one "My SOAP Note".                                                  |
| NOTES already said "I reviewed each commit".                                                             | Only the setup commit existed.                                                                                                                                                       | Write that section after the work, using decisions I can explain.                                                                                                                                                                                 |

### Plan review, round 3

| The AI proposed                                                                             | What was wrong                                                                                           | What I chose                                                                              |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| NOTES said "All five fixes accepted".                                                       | That records that I agreed. It does not say what I chose or why.                                         | Five decisions in the first person, each with its reason.                                 |
| "Verified by two runs in a row" and "Production build is verified".                         | Nothing had been built yet.                                                                              | "Run twice before marking complete." A test is described as passed only after it has run. |
| The Copy button filed under "doing a thing twice is safe".                                  | Two Copy requests make two copies on purpose. The disabled button only stops an accidental second click. | The accurate examples are a repeated section request and a repeated seed.                 |
| Failed-save feedback listed as optional polish, and the out-of-date check under "left out". | I had already chosen both.                                                                               | Both moved into the plan as required behaviour.                                           |

### Plan review, round 4

| The AI proposed                                                  | What was wrong                                                                                                                                 | What I chose                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check the badge is gone after Publish.                           | It never checked the badge was there before. A bug that publishes automatically would pass.                                                    | Badge absent on a new copy, visible after Allergies, visible again after Redo, absent after Publish.                                                                                                                                         |
| Rule tests that check a section appears.                         | Appending both sections at the bottom would pass.                                                                                              | Compare the entire resulting text and the exact reply. Allergies goes immediately before `Medications:`, and Medication Reconciliation immediately before `Objective:`. Seed the brief's full SOAP Note, including the last quoted sentence. |
| "Every action returns the same result", Copy included.           | `redirect()` works by throwing. Inside the same error handler as the save, a saved copy shows "failed", and a second click makes another copy. | Catch only the database failure. Redirect after the save, outside the handler. Test that one click adds exactly one copy.                                                                                                                    |
| A test reset guard that accepted any database ending in `_test`. | A mistaken address could wipe another project's test data.                                                                                     | Reset only the database named exactly `vera_test` on the local instance.                                                                                                                                                                     |

### Plan review, round 5

| The AI proposed                                               | What was wrong                                                                                        | What I chose                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three pull requests, with the full browser test in the first. | Required behaviour, such as missing headings and two keywords, was spread across later pull requests. | Two pull requests. PR 1: database, seed, library, read-only view, "Edit a copy". PR 2: Vera's rules, Undo, Redo, Publish, Discard, out-of-date tabs, the browser test. On approval I added one more check: edit the first copy, reopen both, and verify only the first changed. |

### While building PR 1

| The AI built                                                              | What was wrong                                                                                                                    | What I chose                                                                                                                                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A seed that looked up each original and then inserted the missing ones.   | Two seeds starting together could both find the same one missing.                                                                 | `ON CONFLICT DO NOTHING RETURNING id`, and version 1 only for an original that was actually inserted. Two runs at once must leave exactly ten originals with one version each. |
| `ON CONFLICT DO NOTHING` on any conflict.                                 | A row already holding ID 1 made the seed report "Added 9 of 10" and finish as a success, with SOAP Note missing.                  | Skip only a duplicate original name. Any other clash fails loudly.                                                                                                             |
| A database address check that accepted `postgres:vera` and `postgres://`. | One has no double slash and the other has no host. A mistyped address should fail before migrations start.                        | Require `postgres://` or `postgresql://` and a host.                                                                                                                           |
| A looser Node.js requirement in the README.                               | A dependency of the lint tools needs a newer Node.js.                                                                             | The README says Node.js 24, and every check runs on it.                                                                                                                        |
| It called the checkout on my Desktop healthy.                             | `git fsck` found a broken `main 2` branch reference and malformed file names. Duplicate files had appeared in that synced folder. | A clean clone outside Desktop. The staged changes were carried over and compared byte for byte, and `git fsck` was clean.                                                      |
| "Checks pass" reported from its working folder.                           | I asked for each commit to be checked as a snapshot in an empty folder. There, lint failed on the page's props type.              | `npm run lint` now generates the route types first. Before merging PR 1, the browser and database checks were run again on the exact commit in the pull request.               |

### Reviewing PR 2

| The AI built                                                                                 | What was wrong                                                                                               | What I chose                                                                                                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| A request box that cleared itself when a request succeeded and stayed editable while saving. | Send "add allergies" and start typing "add medication": the first success erases it.                         | The box is read-only while saving. A browser test holds the response to prove it.                                 |
| An error from the small Undo that took priority over every later result.                     | After a refused Undo, a later request could save correctly while the screen still said something went wrong. | Show the result of the most recent action. Tested: a refused Undo, then a successful Send, with no reload.        |
| A test-database guard that printed the address it refused.                                   | That address can contain a password, and the setup logs the error.                                           | The message is now "Refusing to reset. Expected the local vera_test database."                                    |
| A 2,001-character request answered with "Type a request for Vera first."                     | The box was full.                                                                                            | A message about the length. The text stays in the box.                                                            |
| Separate feedback in the toolbar and the request box.                                        | An old failure stayed on screen after a different action worked.                                             | One shared state for every action on a copy. A browser test covers both directions, and it fails on the old code. |
| NOTES said I "approved every commit" before I had.                                           | It claimed more than had happened.                                                                           | The approval wording states only what happened.                                                                   |

I also asked for one check by hand on a fresh production build: open "My SOAP Note" from the library and confirm the title, the template text and the version controls appear. They did.

## 12. AI tools

Claude Code wrote the code, the tests and the migrations, and drafted the plan. I use Claude Code as parallel dr

Approvals, as they happened: I approved the plan and each commit of the first pull request before it was made. In the second pull request I reviewed the code before it was committed, and again in the open pull request. Its last fix and the documentation were committed on my instruction, not approved one by one.
