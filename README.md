# Vera Templates

A small web app for the Vera Health full-stack take-home. A doctor can view a note template, make a copy, ask Vera to change it, and publish or undo those changes.

Built with Next.js (App Router), TypeScript and PostgreSQL.

> Status: project setup only. The features are not built yet.

## What you need

- Node.js 20.9 or newer
- Docker Desktop (running)

## Run it from a fresh clone

```bash
npm install            # install packages
cp .env.example .env   # database address the app uses
npm run db:up          # start Postgres in Docker (port 5433)
npm run db:push        # create the database tables
npm run dev            # start the app
```

Then open http://localhost:3000.

## Commands

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Start the app in development mode               |
| `npm run build`   | Build the app for production                    |
| `npm run lint`    | Check the code for common mistakes              |
| `npm run db:up`   | Start the Postgres database                     |
| `npm run db:down` | Stop the Postgres database (data is kept)       |
| `npm run db:push` | Create or update tables from `src/db/schema.ts` |

## Where things are

```
src/app/            pages and layout
src/db/schema.ts    database tables
src/db/index.ts     database connection
docker-compose.yml  local Postgres
drizzle.config.ts   settings for the table tool (drizzle-kit)
NOTES.md            choices, cuts and open questions
```
