# Vera Templates

A small web app for the Vera Health full-stack take-home. A doctor can view a note template, make a copy, ask Vera to change it, and publish or undo those changes.

Built with Next.js (App Router), TypeScript and PostgreSQL. The decisions behind it are in [NOTES.md](NOTES.md).

## What you need

- Node.js 24
- Docker Desktop (running)

## Run it from a fresh clone

```bash
npm install            # install packages
cp .env.example .env   # database address the app uses
npm run db:up          # start Postgres in Docker (port 5433)
npm run db:migrate     # create the database tables
npm run db:seed        # add Vera's starter templates
npm run dev            # start the app
```

Then open http://localhost:3000.

## Try the main flow

1. The library shows Vera's templates, grouped by document type.
2. Open **SOAP Note**. It is read-only. Click **Edit a copy**.
3. In the box at the bottom, type `add allergies` and press the send button. An Allergies section appears and Vera confirms.
4. Use **Undo** and **Redo** at the top right.
5. Click **Publish changes**.
6. Type `add medication` and send it, then click **Discard changes**. The copy returns to what you published.

## Tests

```bash
npm run check                    # lint, format, types and unit tests
npx playwright install chromium  # first time only: the browser for the test below
npm run test:e2e                 # one browser test of the whole main flow
```

The browser test needs the database running (`npm run db:up`). It builds the app, serves it on port 3100, and uses its own database, `vera_test`, which it resets on every run. Your development data is not touched.

## Commands

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start the app in development mode                      |
| `npm run build`       | Build the app for production                           |
| `npm run check`       | Run lint, format check, type check and unit tests      |
| `npm run lint`        | Check the code for common mistakes                     |
| `npm run format`      | Fix the code layout (`format:check` only looks)        |
| `npm run typecheck`   | Check the types                                        |
| `npm run test`        | Run the unit tests                                     |
| `npm run test:e2e`    | Run the browser test of the main flow                  |
| `npm run db:up`       | Start the Postgres database                            |
| `npm run db:down`     | Stop the Postgres database (data is kept)              |
| `npm run db:migrate`  | Apply the database changes that have not run yet       |
| `npm run db:seed`     | Add Vera's starter templates (safe to run again)       |
| `npm run db:generate` | Write a new migration after editing `src/db/schema.ts` |

## Where things are

```
src/app/         pages: the library and the template page
src/components/  screen pieces; src/components/ui/ holds the shared buttons and badges
src/actions/     form entry points: check the input, call the database layer
src/data/        the only code that talks to the database (reads and writes)
src/domain/      rules with no database or screen code: Vera's rules, version moves
src/db/          tables, connection, seed and the starter templates' text
drizzle/         database migrations (SQL)
e2e/             the browser test and its database setup
NOTES.md         decisions, cuts, and what AI tools did (one page)
REVIEW_LOG.md    every objection I raised to the AI's plan and code
```
