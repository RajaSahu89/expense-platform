# Ledger — Personal FinTech / Expense Platform

A full-stack personal finance tracker: transactions, budgets, recurring
expenses, spending analytics, CSV bank-statement import, and threshold
alerts. Built with Next.js 14 (App Router), TypeScript, Prisma and
PostgreSQL on [Neon](https://neon.tech), with a glassmorphism UI.

## Features

- **Transactions** — create, edit, delete, search (case-insensitive), filter by category/type, paginate
- **Budgets** — monthly limits per category with live progress bars and alert thresholds
- **Recurring** — daily/weekly/biweekly/monthly/yearly schedules; due items are generated (with catch-up) idempotently; pause/resume; daily Vercel Cron
- **CSV import** — column mapping (incl. split debit/credit), DD/MM/YYYY-aware dates, preview, auto-categorisation, duplicate-safe re-imports
- **Analytics** — 6-month income/expense/net trend + category breakdown
- **Alerts** — budget-threshold and unusual-spending alerts, dismissable
- **Theme** — glassy UI on `#1C1D20`, with `#5A6068` steel surfaces and a `#FF5F00` accent; amounts in ₹ (`en-IN`)

## Quick start (Node 20.9+, tested on Node 24)

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then paste your Neon URLs (see below). Skip if a .env is already included
npm run db:deploy           # applies prisma/migrations to your Neon database
npm run seed                # optional: default categories + sample data
npm run dev                 # http://localhost:3000
```

### Neon connection strings

Neon gives you a **pooled** URL (host contains `-pooler`) and a **direct** URL.

| Variable       | Which URL | Used for                              |
|----------------|-----------|----------------------------------------|
| `DATABASE_URL` | pooled, add `&pgbouncer=true` | the running app (serverless-friendly) |
| `DIRECT_URL`   | direct (no `-pooler`)         | `prisma migrate` / `db push`          |

Prisma migrations need the direct URL because they take advisory locks that
PgBouncer (the pooler) doesn't support. `channel_binding=require` from Neon's
default string isn't needed by Prisma and is left out.

> Never commit `.env` (it is in `.gitignore`). If a database password has ever
> been pasted somewhere public, rotate it in the Neon console and update `.env`.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server / production build / serve build |
| `npm run typecheck` / `lint` | TypeScript and ESLint checks |
| `npm run db:deploy` | Apply committed migrations (use in production / CI) |
| `npm run db:push` | Sync schema without migration history (quick prototyping) |
| `npm run db:migrate` | Create a new migration after editing `schema.prisma` (dev) |
| `npm run seed` | Seed categories and sample data (safe to re-run) |
| `npm run prisma:studio` | Browse the database in a web UI |

## Deploying to Vercel

1. Push to GitHub and import the repo in Vercel.
2. Add `DATABASE_URL` and `DIRECT_URL` as environment variables (optionally `CRON_SECRET`).
3. Run `npm run db:deploy` once locally (or let the GitHub Action do it) so the tables exist.
4. `vercel.json` registers a daily cron that calls `GET /api/recurring/generate`.

The included GitHub Action (`.github/workflows/deploy.yml`) needs the repo
secrets `DATABASE_URL`, `DIRECT_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Project layout

```
app/            pages (App Router) + REST-style route handlers in app/api
components/     UI primitives (ui.tsx), charts, modal, nav
lib/            prisma client, validation (zod), csv parsing, categorisation, alerts, recurring engine
prisma/         schema, migrations, seed
```
