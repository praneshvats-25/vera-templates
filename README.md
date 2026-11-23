# Vera Templates

A small web app for the Vera Health full-stack take-home. A doctor can view a note template, make a copy, ask Vera to change it, and publish or undo those changes.

Built with Next.js (App Router), TypeScript and PostgreSQL.

> Status: you can browse the library, open a template, and make your own copy. Asking Vera to change a copy, and undo, redo, publish and discard, come next.

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

## Commands

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start the app in development mode                      |
| `npm run build`       | Build the app for production                           |
| `npm run check`       | Run every check below in one go                        |
| `npm run lint`        | Check the code for common mistakes                     |
| `npm run format`      | Fix the code layout (`format:check` only looks)        |
| `npm run typecheck`   | Check the types                                        |
| `npm run test`        | Run the unit tests                                     |
| `npm run db:up`       | Start the Postgres database                            |
| `npm run db:down`     | Stop the Postgres database (data is kept)              |
| `npm run db:migrate`  | Apply the database changes that have not run yet       |
| `npm run db:seed`     | Add Vera's starter templates (safe to run again)       |
| `npm run db:generate` | Write a new migration after editing `src/db/schema.ts` |

## Where things are

```
src/app/                     pages and layout
src/db/schema.ts             database tables
src/db/index.ts              database connection
src/db/seed.ts               adds Vera's starter templates
src/db/starter-templates.ts  the starter templates' text
src/env.ts                   settings read from the environment
drizzle/                     database migrations (SQL)
docker-compose.yml           local Postgres
drizzle.config.ts            settings for the migration tool (drizzle-kit)
NOTES.md                     choices, cuts and open questions
```
