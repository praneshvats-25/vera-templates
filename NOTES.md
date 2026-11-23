# Notes

One page on what I chose, what I left out, and what was unclear.

## Implementation choices

- **Next.js App Router + TypeScript**: required by the brief.
- **Postgres in Docker**: one command to start, same database for every reviewer. It uses port 5433 so it does not clash with a Postgres already on 5432.
- **Drizzle ORM**: tables are plain TypeScript in one file, and queries read close to SQL.
- **Tailwind CSS**: styling stays next to the markup, no separate component library to learn.
- **Cache Components turned off**: every page here reads live data, so the simpler "fetch on each request" model is enough.

## What I left out

_To fill in._

## What I would improve

_To fill in._

## Unclear or missing details, and what I decided

_To fill in._

## AI tools used

_To fill in._
