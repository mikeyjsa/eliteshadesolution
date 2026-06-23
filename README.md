# Elite Shade Solutions — Platform

Custom web platform for an online-quoting shade-sail business in the Western Cape.
A public marketing site funnels visitors into an **instant quote calculator**; a
private admin runs the **CRM → invoicing → scheduling** pipeline. Built from the
business blueprint (`../Elite-Shade-Solutions-Business-Blueprint.html`).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind v4** (`@theme` tokens) + custom CSS — "engineered tension" design system
- **File-based JSON store** (`.data/db.json`, auto-seeded) via `lib/db.ts` — swap to Supabase/Postgres later
- **File-backed uploads** under `public/uploads/` — only relative file paths are stored in the DB, never binary file contents
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

## Runtime storage spec

Persistent runtime data lives in the filesystem, not in the git checkout:

- `.data/db.json` — live database
- `.data/backups/` — hourly and manual DB backups
- `public/uploads/` — all uploaded files
- `public/uploads/payment-proofs/` — invoice proof-of-payment files

Important:

- The DB stores **paths** like `/uploads/payment-proofs/proof_abc123.pdf`, not the uploaded file bytes.
- For deployment, both `.data/` and `public/uploads/` must be backed by persistent storage.
- If you later add gallery/CMS file uploads, keep storing the file on disk first and only save its relative path in the DB.

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

## Deployment spec (Railway)

This app is safe to deploy on Railway via a Git-based deployment, but it needs persistent volumes because it uses local files for both the DB and uploads.

### Required Railway settings

Set these variables in Railway:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-public-domain.com
ELITE_DB_PASSPHRASE=use-a-long-random-secret
```

Recommended:

- Use a long random `ELITE_DB_PASSPHRASE` and keep it stable. Changing it later without re-encrypting data will prevent the app from reading existing encrypted DB/backup files.
- Set your final custom domain in `NEXT_PUBLIC_SITE_URL` so canonicals, sitemap, robots, and social cards point at the correct host.

### Required persistent volumes

In Railway, mount persistent storage to both of these paths inside the service:

- `/app/.data`
- `/app/public/uploads`

Why both matter:

- `.data` holds the live DB and hourly/manual backups.
- `public/uploads` holds uploaded files like payment proofs.
- Without those mounts, deploys/restarts will lose your runtime data.

### Build and start commands

Railway can use the default Node detection, or you can set:

```bash
npm install
npm run build
npm run start
```

The current app start command runs Next on port `4700`, which Railway can proxy normally.

### Git deploy flow

1. Push this repository to GitHub.
2. In Railway, create a new project from that repo.
3. Add the environment variables above.
4. Attach persistent volumes to `/app/.data` and `/app/public/uploads`.
5. Deploy once.
6. Visit `/admin` and change the scaffold credentials/settings immediately.

### Post-deploy checklist

1. Confirm `.data/db.json` is created on the mounted volume.
2. Create a manual backup in `/admin/backups` and confirm it appears.
3. Upload a proof of payment on an invoice and confirm the file lands under `public/uploads/payment-proofs/`.
4. Open `https://your-domain.com/robots.txt` and `https://your-domain.com/sitemap.xml`.
5. Verify that a social share preview uses the generated Open Graph image.

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
