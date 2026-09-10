# Ledger — Personal FinTech / Expense Platform

A full-stack personal finance tracker: transactions, budgets, recurring
expenses, spending analytics, CSV bank-statement import, and threshold
alerts. Built with Next.js (App Router), TypeScript, Prisma, and SQLite.

![stack](https://img.shields.io/badge/next.js-14-black) ![stack](https://img.shields.io/badge/typescript-5-blue) ![stack](https://img.shields.io/badge/prisma-5-2D3748)

## Features

- **Transactions** — create, edit, delete, search, and filter by category/type/date
- **Budgets** — monthly limits per category with live progress bars and configurable alert thresholds
- **Recurring expenses** — subscriptions/bills on a daily, weekly, biweekly, monthly, or yearly schedule; a scheduler generates due transactions and catches up on missed runs, idempotently
- **CSV import** — upload a bank export, map its columns (including split debit/credit columns), preview before committing, and auto-categorize by keyword rules; re-importing the same statement skips rows already imported instead of duplicating them
- **Analytics** — month-over-month income/expense/net trend chart, category breakdown, top-category and rolling-average stats
- **Alerts** — automatic budget-threshold and unusual-spending detection, surfaced on the dashboard
- **Dashboard** — this month's net figure, income/expense totals, category breakdown chart, recent activity
- **Currency** — amounts are formatted in Indian Rupees (₹, `en-IN` locale/grouping)
- **Theme** — dark UI with a blue accent palette throughout (charts, buttons, badges, focus states)

## Stack

| Layer      | Choice                                   |
|------------|-------------------------------------------|
| Frontend   | Next.js 14 (App Router), React, TypeScript |
| Styling    | Tailwind CSS                              |
| Backend    | Next.js Route Handlers (REST-style API)   |
| Database   | SQLite via Prisma ORM (swap to Postgres by changing one line) |
| Charts     | Recharts                                  |
| CSV parsing| PapaParse                                 |
| Validation | Zod                                       |

## Getting started — from zero

These steps assume a brand-new machine with nothing installed yet.

### 1. Install Node.js (v18 or later)

- **Windows / Mac:** download the LTS installer from https://nodejs.org and run it.
- **Mac (Homebrew):** `brew install node`
- **Linux (Ubuntu/Debian):** `curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs`

Check it worked:

```bash
node -v   # should print v18.x or higher
npm -v
```

### 2. Unzip the project and open a terminal in it

```bash
unzip expense-platform.zip
cd expense-platform
```

### 3. Install the project's dependencies

```bash
npm install
```

This reads `package.json` and downloads everything the app needs (Next.js, Prisma, Tailwind, etc.) into a local `node_modules` folder. It can take a minute or two the first time.

### 4. Set up your environment file

```bash
cp .env.example .env
```

The default (`DATABASE_URL="file:./dev.db"`) needs no further changes — it's a local SQLite file, no separate database server required.

### 5. Create the database

```bash
npx prisma migrate dev --name init
```

This creates `prisma/dev.db` and sets up all the tables (transactions, categories, budgets, etc.) from `prisma/schema.prisma`.

### 6. Add starter data (recommended)

```bash
npm run seed
```

Populates default categories plus a few sample transactions, a budget, and a recurring rent expense in ₹, so the dashboard isn't empty on first run.

### 7. Start the app

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser. You should see the dashboard in the dark blue theme with sample data loaded.

To stop the server, press `Ctrl+C` in the terminal. To run it again later, you only need step 7 (`npm run dev`) — steps 1–6 are one-time setup.

## Project structure

```
app/
  api/                REST route handlers (transactions, categories, budgets,
                       recurring, csv import, analytics, alerts)
  page.tsx             Dashboard
  transactions/        Transaction ledger + CRUD
  budgets/             Budget cards with progress bars
  recurring/           Recurring expense scheduler UI
  import/              CSV import wizard (upload → map → commit)
  analytics/           Trend + category charts
components/            Shared UI (forms, tables, charts, modal, sidebar)
lib/
  prisma.ts            Prisma client singleton
  categorize.ts        Keyword-based auto-categorization + default categories
  csv.ts                CSV parsing, column mapping, duplicate fingerprinting
  recurring.ts         Recurring-expense scheduling engine
  alerts.ts            Budget threshold + unusual-spending detection
  validation.ts        Zod schemas shared by the API routes
prisma/
  schema.prisma        Data model
  seed.ts               Default categories + sample data
```

## Design notes worth calling out in an interview

- **Idempotent recurring generation.** `lib/recurring.ts` only creates
  transactions for occurrences whose scheduled date has actually passed,
  then advances `nextRunDate` past them in the same operation. Running the
  generator twice — or catching up after the server was off for a week —
  never creates duplicates.
- **Idempotent CSV import.** Each imported row is fingerprinted from its
  date, description, and amount (`lib/csv.ts`). Re-uploading the same
  statement, even under a different filename, is detected and skipped
  rather than double-counted.
- **Rule-based categorization with a clear upgrade path.** Categories carry
  a keyword list; `categorizeTransaction` scores each category by keyword
  matches. It's simple and transparent for a v1, with an obvious seam to
  swap in an ML classifier later without touching the API surface.
- **Alerts are derived, not stored state.** `refreshAlerts()` recomputes
  budget-threshold and unusual-spending alerts from current data on read,
  rather than trying to keep a separate alert table in sync with every
  transaction mutation.

## Extending this project

- Swap SQLite for Postgres: change the `provider` in `prisma/schema.prisma`
  to `"postgresql"` and point `DATABASE_URL` at your database.
- Add auth (NextAuth.js works well with the App Router) to make this
  multi-user — every model already has clean foreign keys to layer a
  `userId` onto.
- Wire `/api/recurring/generate` to a daily cron (Vercel Cron, or any
  scheduler that can hit an HTTP endpoint).
- Add bank sync via Plaid instead of/alongside manual CSV import.

## License

MIT — use this freely for your own portfolio or projects.
