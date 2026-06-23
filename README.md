# Elite Shade Solutions — Platform

Custom web platform for an online-quoting shade-sail business in the Western Cape.
A public marketing site funnels visitors into an **instant quote calculator**; a
private admin runs the **CRM → invoicing → scheduling** pipeline. Built from the
business blueprint (`../Elite-Shade-Solutions-Business-Blueprint.html`).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind v4** (`@theme` tokens) + custom CSS — "engineered tension" design system
- **File-based JSON store** (`.data/db.json`, auto-seeded) via `lib/db.ts` — swap to Supabase/Postgres later
- **Mock PayFast** (hosted page + ITN webhook) and **mock email** — swap real keys later
- **pdf-lib** for branded invoice PDFs
- Optional **AES-256-GCM at-rest encryption** for the live DB and backups via `ELITE_DB_PASSPHRASE`

```bash
npm install
npm run dev      # http://localhost:4700
```

To encrypt `.data/db.json` and `.data/backups/*` at rest, set:

```bash
export ELITE_DB_PASSPHRASE="use-a-long-random-secret"
```

When that env var is present, the app transparently encrypts new writes and
auto-migrates legacy plaintext DB/backup files on read.

The store seeds itself on first run (pricing table, the §11 sample pipeline,
gallery + guides). Delete `.data/` to reset.

## Public site

`/` home · `/shade-sails` range · **`/quote` instant calculator** · `/how-it-works`
· `/gallery` · `/blog` + `/blog/[slug]` · `/about` · `/contact`

## Admin (`/admin`)

Password gate — scaffold password **`eliteshade`** (change in Settings).

- **Dashboard** — KPIs, pipeline snapshot, this-week tasks
- **CRM Pipeline** — drag-and-drop kanban (6 stages); cards open the quote detail
- **Quote detail** — confirm firm price → generate deposit/balance invoice → take
  mock PayFast payment → schedule install; activity log
- **Invoices** — list + PayFast status + PDF
- **Schedule** — month calendar of installs
- **Pricing** — editable rates + deposit % + VAT; **drives the live calculator**
- **Content (CMS)** — gallery + blog manage/publish
- **Backups** — hourly DB snapshots with manual backup, restore and download
- **Reports** — sales, pipeline, lead-source, most-quoted nets, operations
- **Settings** — company/VAT, email templates, admin password

## Quote engine

`lib/quote-engine.ts` is the single source of truth, ported verbatim from the
blueprint. It holds the 8 genuine Kalahari nets and picks the cheapest that covers
the area (+0.8 m fabric stretch/side), adds poles, per-point tension kits and
labour, and returns a ±12% range with VAT separate. Rates come from the editable
`pricing` store, so admin edits flow straight into estimates.

## Swap points (deferred to real services)

`lib/db.ts` (→ Supabase/Postgres) · `lib/payfast.ts` (→ PayFast live keys + ITN
signature verification) · `lib/email.ts` (→ Resend/Postmark) · `lib/auth.ts` (→
per-user accounts + 2FA). None require an external account to run today.
