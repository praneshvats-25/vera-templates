# Review log

Every call in this file is mine. Claude Code wrote the code; I reviewed its plan and its code, and each row below is something I sent back with what was wrong and what to do instead.

[NOTES.md](NOTES.md) explains each decision and its trade-offs. This file is the evidence behind it: how each decision was checked, then every correction I made, in the order it happened.

## How I ran the work

- **Context before code.** The AI read the whole brief and every Figma screen first, and looked up current standards in the official documentation. I told it not to copy conventions from an older repo of mine.
- **Questions before assumptions.** I told it to ask me about every case the brief leaves open instead of guessing. My answers are in section 1 below.
- **A plan before code.** I sent the plan back five times (sections 2 to 6 below). Nothing was built until I approved it.
- **Two pull requests.** "Browse and copy templates", then "Edit and publish a copy". Each edge case lives in the pull request that owns the behaviour.
- **Reading the code myself.** I read the code file by file, not only the summaries: the database layer, the form actions, the screen components and the tests (`e2e/main-flow.spec.ts`, `e2e/helpers.ts`, the rule and version tests). Sections 7 and 8 are what I found there.
- **Checks on a clean copy.** I asked for each commit to be checked on its own in an empty folder (install, lint, types, tests, build), because a check that passes in the working folder can fail in a fresh clone. It did once (section 7).
- **Approvals, as they happened.** I approved the plan. In PR 1 I saw the exact files and test results and approved each commit, the push, the pull request and the merge. In PR 2 I reviewed the code before it was committed and sent back fixes. I then told the AI to save the work, open the pull request and fix one more problem. That last fix and the documentation were committed on that instruction, not approved one by one. I reviewed the open pull request before merging it.
- **House rules.** Simple code. A short description at the top of every file. Tailwind theme tokens, no one-off values. One way of doing each thing, everywhere. Nothing described as "passed" before it ran.

## How each decision was checked

Each one says what would break, what I decided, and how it was checked. The reasoning and trade-offs are in NOTES.md.

### What editing a copy means

**Each click on "Edit a copy" makes a new copy.**

- _What would break:_ reusing the first copy would open an edited template when I expected a clean one. Giving every copy the same name makes the cards impossible to tell apart.
- _My decision:_ the first copy is "My SOAP Note", the next "My SOAP Note (2)". Each starts at its own published version 1. Opening my card continues my work. Going back to Vera's original gives a clean start. The button is disabled while saving, so a double-click makes one copy, but two deliberate clicks still make two.
- _How it was checked:_ unit tests for the names. The browser test edits the first copy, makes a second, and checks the second is clean and the first still has its change. Three copies started at the same moment got three different names.

**Vera's original and a copy allow different actions.**

- _What would break:_ the plan's single rule, "all six actions refuse a Vera template", would have refused the one action an original must accept.
- _My decision:_ Copy accepts only an original. Send, Undo, Redo, Publish and Discard accept only a copy. The page shows the matching controls, and the server enforces the same rule.
- _How it was checked:_ the five actions were sent to an original by script and all were refused. A database rule also keeps an original at version 1.

### What a request can change

**A request means "make sure this section exists".**

- _What would break:_ following the brief's table literally adds a second Allergies section. Remembering which requests were sent would stop the same request working after an Undo.
- _My decision:_ check the text on screen for the heading as a whole line, ignoring case and surrounding spaces. If it is there, reply "Nothing to change." The same rule applies to Medication Reconciliation.
- _How it was checked:_ unit tests for asking twice, for a heading in different case or spacing, and for asking again after the insertion was undone.

**The rules are fixed, and tested on the whole text.**

- _What would break:_ a test that only looks for a heading also passes when the section lands at the bottom. Trying the second rule after the first changed nothing would add Medication when I asked for Allergies.
- _My decision:_ Allergies goes immediately before `Medications:`. Medication Reconciliation goes immediately before `Objective:`. A missing heading changes nothing. With both keywords, the first rule in the brief's order is the only one tried.
- _How it was checked:_ the unit tests start from the brief's full SOAP Note and compare the entire resulting text and the exact reply. They cover both keywords in one message, no falling through, singular "allergy", and a missing heading.

**A request that changes nothing writes nothing.**

- _What would break:_ saving a version for a no-op fills the history with identical versions, and takes Redo away after an Undo.
- _My decision:_ no version is saved and the three pointers are left alone. If a request fails, the typed message stays in the box.
- _How it was checked:_ a unit test ("a request that changes nothing saves nothing, so Redo to v3 still works"), the same case by script against the database, and a browser test that a refused request stays in the box.

### How version history works

**Three separate values: the version on screen, the published version, and where Redo stops.**

- _What would break:_ with v3 published, undoing to v2 and editing. "Shown + 1" tries to save v3 again. Dropping the undone versions, as a normal editor does, would delete what was published.
- _My decision:_ the edit is saved as v4, with v2 recorded as its parent. The number is the highest saved plus one. Undo from v4 goes to v2. Redo from v2 goes to v4. Discard returns to published v3 and makes it the end of the Redo path. The abandoned versions stay in the database.
- _How it was checked:_ unit tests on version numbers and parents for every step of this case. After the browser test, the database showed the discarded version still saved, with its parent. Before merging I ran the case in the browser myself: after publishing v3 and undoing to v2, a request that changed nothing kept Redo, a new edit with the same text as v3 still showed as unpublished, and Discard restored the published version through a reload.

**"Unpublished changes" compares version numbers, not text.**

- _What would break:_ v3 and v4 can hold the same words. Comparing text would hide the badge on a version that was never published.
- _My decision:_ the badge shows whenever the shown version number differs from the published one, including when the shown version is behind it.
- _How it was checked:_ a unit test ("v4 counts as unpublished even if its words equal the published v3") and the badge checks at every step of the browser test.

**An out-of-date tab must not act on a state its user did not see.**

- _What would break:_ a row lock only makes writes take turns. Tab A shows v2, tab B moves to v3, tab A clicks Publish, and v3 is published unread. The AI's first fix compared the shown and published versions, which still missed this: one tab adds Allergies and undoes to v1, a second adds Medication and undoes to v1. Both show v1 with v1 published, but Redo points somewhere different.
- _My decision:_ the page sends all three numbers it was drawn with. The server compares them under the lock. If any differs, it writes nothing, refreshes the page and says the template was changed somewhere else.
- _How it was checked:_ a unit test for exactly that Redo case. By script, Publish, Redo and a request from an old tab were all refused and wrote nothing. Two browser tests use a second tab to make the first one out of date.

### What the database enforces

**The foreign keys stayed.**

- _What would break:_ the plan's fallback, plain integers, would let a copy point at version 999 with only three saved, or at another template's version.
- _My decision:_ a template and its first version depend on each other, so the keys are checked at commit. Both rows are inserted in one transaction. A version's parent must belong to the same template and be older.
- _How it was checked:_ six bad writes were tried directly in the database and all were refused. One good write was accepted.

**Copying repeats on purpose. Seeding is safe to repeat.**

- _What would break:_ two tabs copying at once could choose the same name. A seed that skips when any template exists could leave nine originals missing. A seed that ignores every conflict reported "Added 9 of 10" as a success with SOAP Note missing. A redirect inside the error handler would report a saved copy as failed, and a second click would make another.
- _My decision:_ Copy locks the original's row while it chooses the name, then saves the copy and its version 1 together, and redirects after the save, outside the handler. The seed skips only an original whose name already exists. Any other clash fails loudly.
- _How it was checked:_ two seeds were started together, five times, and each time left exactly ten originals with one version each. The ID clash now fails with an error. The browser test checks that one click adds exactly one copy to the library.

### What I changed after reading the screen code and the tests

**The latest action owns the feedback line.**

- _What would break:_ the request box and the toolbar kept separate errors. A toolbar Undo could work while the box still showed an earlier "too long" error. A success could also clear the box while I was typing the next request.
- _My decision:_ every action on a copy goes through one shared function, so there is one feedback line and one "saving" state. A later success replaces an earlier failure. The small Undo shows only when that request saved the version still on screen. The box is read-only while saving.
- _How it was checked:_ three browser tests: the box is locked while a held response is saving, a refused Undo does not hide the next reply, and an error goes away after a later success in both directions. The last one failed on the old code and passes on the fix.

**The browser tests prove each step, not only the end.**

- _What would break:_ if "add medication" did nothing, "Medication is gone after Discard" still passes. If Publish did nothing, "no badge at the end" can still pass.
- _My decision:_ check the badge after the edit, after Undo, after Redo and after Publish. Check the Medication section is there before Discard and gone after a reload, with Allergies still there. Reopen the copy from the library, and check Vera's original and a second copy.
- _How it was checked:_ five browser tests run against a production build with their own database, `vera_test`. They passed twice in a row and once more on a clean copy of the repo. The development database was not touched.

## Every correction I made, in order

### 1. Cases I decided before the plan

| Question                                                          | The AI recommended                                                                                | What I chose, and why                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version 3 is published. I undo to version 2 and ask for a change. | Keep every version, save the change as the next version, and remove Redo, "like a normal editor". | Keep v3 published. Save the change as v4 and record that it came from v2. Undo from v4 goes to v2, Redo goes back to v4, and Discard returns to v3 even after a reload. I added one rule it had missed: a request that changes nothing saves nothing and must leave Redo to v3 working.                     |
| "add allergies" is sent twice.                                    | Do nothing if the section is already there.                                                       | The same result, with an exact rule: treat the request as "make sure this copy has an Allergies section". Look for a line whose trimmed text equals `Allergies:` in any case. If the target heading is missing, reply "Nothing to change." The same rule applies to Medication Reconciliation.              |
| "Edit a copy" is clicked a second time.                           | A new copy named "My SOAP Note 2".                                                                | A fresh copy named "My SOAP Note (2)", starting at published version 1 with its own history, and the button disabled while saving. Why: opening my card should continue my work, and going back to Vera's original should give a clean start. I also asked for a test that the two copies stay independent. |
| Should there be a browser test?                                   | One test, in the last stage.                                                                      | One Playwright test of the whole flow, against a separate seeded test database, with the steps I listed.                                                                                                                                                                                                    |

### 2. Plan review, round 1

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

### 3. Plan review, round 2

| The AI proposed                                                                                          | What was wrong                                                                                                                                                                       | What I chose                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The out-of-date check compared the shown and published versions.                                         | v1 is published. Add Allergies (v2), then Undo. In another tab add Medication (v3), then Undo. Both tabs show v1 with v1 published, but Redo now leads to Medication, not Allergies. | Compare the Redo destination too. Add this exact case as a test.                                                                                                                                                                                  |
| Show Vera's reply only while viewing the version that reply produced.                                    | "Nothing to change." produces no version, so the required reply would never show.                                                                                                    | Always show the latest reply. Offer the small Undo only for a change that saved and is still on screen. If saving fails, keep the typed message and show a short error.                                                                           |
| Copy naming promised in one place, the source name copied in another, and naming deferred to a later PR. | Two conflicting definitions. Two tabs could also pick the same number.                                                                                                               | Name the copy inside the Copy transaction. Lock the original's row first, choose the number, set the source, then insert the copy and its version 1 together.                                                                                     |
| A branch test that compared text.                                                                        | v3 and v4 can hold the same words, so text cannot show whether Discard returned to v3.                                                                                               | Assert on version numbers. v4 shows "Unpublished changes" despite identical text. After Discard: shown, published and Redo stop are all 3, no badge, no Redo. Undo at v1 and Redo at the end do nothing on the server, even if a form sends them. |
| "Playwright migrates and seeds a test database."                                                         | Nothing created `vera_test` on a fresh clone, and the connection read its address the moment it was imported.                                                                        | Create the test database explicitly. Pass its address to the migration, seed, build and server. Run the test twice: the second run catches the assumption that there is only one "My SOAP Note".                                                  |
| NOTES already said "I reviewed each commit".                                                             | Only the setup commit existed.                                                                                                                                                       | Write that section after the work, using decisions I can explain.                                                                                                                                                                                 |

### 4. Plan review, round 3

| The AI proposed                                                                             | What was wrong                                                                                           | What I chose                                                                              |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| NOTES said "All five fixes accepted".                                                       | That records that I agreed. It does not say what I chose or why.                                         | Five decisions in the first person, each with its reason.                                 |
| "Verified by two runs in a row" and "Production build is verified".                         | Nothing had been built yet.                                                                              | "Run twice before marking complete." A test is described as passed only after it has run. |
| The Copy button filed under "doing a thing twice is safe".                                  | Two Copy requests make two copies on purpose. The disabled button only stops an accidental second click. | The accurate examples are a repeated section request and a repeated seed.                 |
| Failed-save feedback listed as optional polish, and the out-of-date check under "left out". | I had already chosen both.                                                                               | Both moved into the plan as required behaviour.                                           |

### 5. Plan review, round 4

| The AI proposed                                                  | What was wrong                                                                                                                                 | What I chose                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check the badge is gone after Publish.                           | It never checked the badge was there before. A bug that publishes automatically would pass.                                                    | Badge absent on a new copy, visible after Allergies, visible again after Redo, absent after Publish.                                                                                                                                         |
| Rule tests that check a section appears.                         | Appending both sections at the bottom would pass.                                                                                              | Compare the entire resulting text and the exact reply. Allergies goes immediately before `Medications:`, and Medication Reconciliation immediately before `Objective:`. Seed the brief's full SOAP Note, including the last quoted sentence. |
| "Every action returns the same result", Copy included.           | `redirect()` works by throwing. Inside the same error handler as the save, a saved copy shows "failed", and a second click makes another copy. | Catch only the database failure. Redirect after the save, outside the handler. Test that one click adds exactly one copy.                                                                                                                    |
| A test reset guard that accepted any database ending in `_test`. | A mistaken address could wipe another project's test data.                                                                                     | Reset only the database named exactly `vera_test` on the local instance.                                                                                                                                                                     |

### 6. Plan review, round 5

| The AI proposed                                               | What was wrong                                                                                        | What I chose                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three pull requests, with the full browser test in the first. | Required behaviour, such as missing headings and two keywords, was spread across later pull requests. | Two pull requests. PR 1: database, seed, library, read-only view, "Edit a copy". PR 2: Vera's rules, Undo, Redo, Publish, Discard, out-of-date tabs, the browser test. On approval I added one more check: edit the first copy, reopen both, and verify only the first changed. |

### 7. While building PR 1

| The AI built                                                              | What was wrong                                                                                                                    | What I chose                                                                                                                                                                   |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A seed that looked up each original and then inserted the missing ones.   | Two seeds starting together could both find the same one missing.                                                                 | `ON CONFLICT DO NOTHING RETURNING id`, and version 1 only for an original that was actually inserted. Two runs at once must leave exactly ten originals with one version each. |
| `ON CONFLICT DO NOTHING` on any conflict.                                 | A row already holding ID 1 made the seed report "Added 9 of 10" and finish as a success, with SOAP Note missing.                  | Skip only a duplicate original name. Any other clash fails loudly.                                                                                                             |
| A database address check that accepted `postgres:vera` and `postgres://`. | One has no double slash and the other has no host. A mistyped address should fail before migrations start.                        | Require `postgres://` or `postgresql://` and a host.                                                                                                                           |
| A looser Node.js requirement in the README.                               | A dependency of the lint tools needs a newer Node.js.                                                                             | The README says Node.js 24, and every check runs on it.                                                                                                                        |
| It called the checkout on my Desktop healthy.                             | `git fsck` found a broken `main 2` branch reference and malformed file names. Duplicate files had appeared in that synced folder. | A clean clone outside Desktop. The staged changes were carried over and compared byte for byte, and `git fsck` was clean.                                                      |
| "Checks pass" reported from its working folder.                           | I asked for each commit to be checked as a snapshot in an empty folder. There, lint failed on the page's props type.              | `npm run lint` now generates the route types first. Before merging PR 1, the browser and database checks were run again on the exact commit in the pull request.               |

### 8. Reviewing PR 2

| The AI built                                                                                 | What was wrong                                                                                               | What I chose                                                                                                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| A request box that cleared itself when a request succeeded and stayed editable while saving. | Send "add allergies" and start typing "add medication": the first success erases it.                         | The box is read-only while saving. A browser test holds the response to prove it.                                 |
| An error from the small Undo that took priority over every later result.                     | After a refused Undo, a later request could save correctly while the screen still said something went wrong. | Show the result of the most recent action. Tested: a refused Undo, then a successful Send, with no reload.        |
| A test-database guard that printed the address it refused.                                   | That address can contain a password, and the setup logs the error.                                           | The message is now "Refusing to reset. Expected the local vera_test database."                                    |
| A 2,001-character request answered with "Type a request for Vera first."                     | The box was full.                                                                                            | A message about the length. The text stays in the box.                                                            |
| Separate feedback in the toolbar and the request box.                                        | An old failure stayed on screen after a different action worked.                                             | One shared state for every action on a copy. A browser test covers both directions, and it fails on the old code. |
| NOTES said I "approved every commit" before I had.                                           | It claimed more than had happened.                                                                           | The approval wording states only what happened.                                                                   |

I also asked for one check by hand on a fresh production build: open "My SOAP Note" from the library and confirm the title, the template text and the version controls appear. They did.

## What I would improve next

- **A browser test for the two-tab Redo case.** Two tabs show the same shown and published versions but have different Redo paths. A unit test proves the comparison today. A browser test would prove the form, the server action, the transaction and the refreshed screen all agree.
- **Feedback that is easier to spot** after a toolbar action, since the line sits above the request box at the bottom.
- **Automated checks on pull requests.**

Left out on purpose, because the brief asks for a small single-user demo with fixed rules: a working sidebar, sign-in, background processing and real AI.
