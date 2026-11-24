# Elite Shade Solutions — Platform

Custom web platform for an online-quoting shade-sail business in the Western Cape.
A public marketing site funnels visitors into an **instant quote calculator**; a
private admin runs the **CRM → invoicing → scheduling** pipeline. Built from the
business blueprint (`../Elite-Shade-Solutions-Business-Blueprint.html`).

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind v4** (`@theme` tokens) + custom CSS — "engineered tension" design system
- **File-based JSON store** (`.data/db.json`, auto-seeded) via `lib/db.ts` — swap to Supabase/Postgres later
- **File-backed uploads** under `.data/uploads/`, served at `/uploads/...` — only relative file paths are stored in the DB, never binary file contents
- **PayFast/EFT payment flow** with an admin switch for **EFT-only mode**
- **Outbox, Resend, or SMTP email delivery**
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
- `.data/uploads/` — all uploaded files
- `.data/uploads/payment-proofs/` — invoice proof-of-payment files

Important:

- The DB stores **paths** like `/uploads/payment-proofs/proof_abc123.pdf`, not the uploaded file bytes.
- Uploaded files are served by the app from `app/uploads/[...slug]/route.ts`, but physically stored inside `.data/uploads/`.
- For deployment, only `.data/` needs persistent storage.
- If you later add gallery/CMS file uploads, keep storing the file on disk first and only save its relative path in the DB.

## Public site

`/` home · `/shade-sails` range · **`/quote` instant calculator** · `/how-it-works`
· `/gallery` · `/blog` + `/blog/[slug]` · `/about` · `/contact`

## Admin (`/admin`)

Invite-only per-user sign-in with salted password hashes. Settings, backups, and user management are restricted to administrators.

- **Dashboard** — KPIs, pipeline snapshot, this-week tasks
- **CRM Pipeline** — drag-and-drop kanban (6 stages); cards open the quote detail
- **Quote detail** — confirm firm price → generate deposit/balance invoice → take
  mock PayFast payment → schedule install; activity log
- **Invoices** — list + payment status + PDF
- **Schedule** — month calendar of installs
- **Pricing** — editable rates + deposit % + VAT; **drives the live calculator**
- **Content (CMS)** — gallery + blog manage/publish
- **Backups** — hourly DB snapshots with manual backup, restore and download
- **Reports** — sales, pipeline, lead-source, most-quoted nets, operations
- **Settings** — company/VAT, email delivery, analytics, payment details, and email templates

## Production deployment: Afrihost only

The production website, Node.js runtime, persistent data, domain, DNS, SSL, and SMTP email are all intended to run on Afrihost. No Railway, Vercel, or second hosting platform is required.

### Architecture

- Afrihost cPanel Node.js Application Manager runs the standalone Next.js server through Passenger.
- Afrihost cPanel Git Version Control pulls the source repository and executes `.cpanel.yml`.
- `/home/elitesi8c1n5/public_html/www` is the live application root.
- `/home/elitesi8c1n5/public_html/www/.data` is the persistent data folder.
- Afrihost mailboxes provide SMTP delivery for `sales@eliteshadesolutions.co.za` and notification recipients.
- Afrihost DNS and AutoSSL serve `https://eliteshadesolutions.co.za` as the canonical address.

The Git repository must remain separate from the live application root. The cPanel repository can live under a path such as `/home/elitesi8c1n5/repositories/elite-shade`; `.cpanel.yml` publishes its prebuilt runtime into `public_html/www`.

### Required Node.js application settings

- Node.js version: `24.x` when available, otherwise the newest supported LTS release.
- Application mode: `Production`.
- Application root: `/home/elitesi8c1n5/public_html/www`.
- Application URL: `eliteshadesolutions.co.za` with `/` as the path.
- Application startup file: `server.js`.

Do not run `npm install` or `next build` on Afrihost for normal releases. Shared-hosting build limits can terminate those processes. The committed cPanel archive already includes the standalone server, production dependencies, static assets, and public files.

### Required environment variables

Configure these in cPanel's Node.js Application Manager and keep their values stable:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://eliteshadesolutions.co.za
ELITE_DB_PASSPHRASE=use-a-long-random-secret
AUTH_SECRET=use-a-different-long-random-secret
ELITE_ADMIN_EMAIL=owner-email-address
ELITE_ADMIN_PASSWORD=set-a-strong-first-login-password
ELITE_EMAIL_PROVIDER=smtp
ELITE_EMAIL_FROM=sales@eliteshadesolutions.co.za
ELITE_SMTP_HOST=mail.eliteshadesolutions.co.za
ELITE_SMTP_PORT=465
ELITE_SMTP_SECURE=true
ELITE_SMTP_USER=sales@eliteshadesolutions.co.za
ELITE_SMTP_PASS=mailbox-password
```

`ELITE_ADMIN_EMAIL` and `ELITE_ADMIN_PASSWORD` seed only a brand-new database. Existing users are not overwritten. Changing `ELITE_DB_PASSPHRASE` without migrating the encrypted data makes the database and backups unreadable. Changing `AUTH_SECRET` signs every administrator out.

### Persistent data

Only one persistent folder is needed:

```text
/home/elitesi8c1n5/public_html/www/.data
```

It contains the encrypted database, hourly/manual backups, proof-of-payment files, email-marketing PDFs, and all other uploads. The deploy hook creates this folder if needed and excludes it when replacing the application runtime, so Git deployments do not remove live data.

Never delete `.data`, include it in a deployment archive, or point the Node.js application at the Git repository folder.

### First deployment

1. Create the cPanel-managed Git repository outside `public_html/www` and connect it to the GitHub repository.
2. Build locally with `npm run build:cpanel`.
3. Commit the source, `.cpanel.yml`, and refreshed `cpanel-git-deploy.tar.gz`, then push them.
4. Configure the Node.js application and environment variables listed above.
5. In cPanel Git Version Control, update from remote and select **Deploy HEAD Commit**.
6. Confirm cPanel AutoSSL covers both the apex and `www` hostnames.
7. Configure `www` and any old hostnames to redirect permanently to `https://eliteshadesolutions.co.za`.
8. Restart the Node.js application once from cPanel.

### Every later deployment

The responsive WebP variants in `public/site-images/` are committed and included in
the cPanel bundle. After changing a bundled photo or logo, run
`node scripts/build-site-images.mjs` locally with `cwebp` installed and commit
the refreshed variants. Afrihost does not need the encoder.

1. Run `npm run test:e2e` and `npm run build:cpanel` locally.
2. Confirm `cpanel-git-deploy.tar.gz` was regenerated.
3. Commit the source changes and refreshed archive, then push to GitHub.
4. In cPanel Git Version Control, update from remote and deploy the latest commit.
5. The hook preserves `.data`, replaces the standalone runtime, and touches `tmp/restart.txt` so Passenger reloads the application.

If cPanel Git is temporarily unavailable, upload `cpanel-deploy.tar.gz` to the live application root, extract it without deleting `.data`, and restart the application.

### Post-deploy checklist

1. Confirm `https://eliteshadesolutions.co.za` returns the site and `www` redirects to it.
2. Confirm the browser reports a valid SSL certificate.
3. Sign in to `/admin` and create a manual backup under `/admin/backups`.
4. Confirm `.data/db.json`, `.data/backups/`, and `.data/uploads/` remain present.
5. Send one controlled quote email and confirm Afrihost SMTP delivery and reply routing.
6. Upload a proof of payment and confirm it remains available after the next deployment.
7. Check `/robots.txt`, `/sitemap.xml`, the social sharing preview, and the Google Analytics report.
8. Keep `Customer payment mode` set to `EFT only` until the payment gateway is active.

## Quote engine

`lib/quote-engine.ts` is the single source of truth, ported verbatim from the
blueprint. It holds the 8 genuine Kalahari nets and picks the cheapest that covers
the area (+0.8 m fabric stretch/side), adds poles, per-point tension kits and
labour, and returns a ±12% range with VAT separate. Rates come from the editable
`pricing` store, so admin edits flow straight into estimates.

## Swap points (deferred to real services)

`lib/db.ts` (→ Supabase/Postgres) · `lib/payfast.ts` (→ PayFast/PayGate live keys + ITN
signature verification) · `lib/email.ts` (→ SMTP/Resend/Postmark) · `lib/auth.ts` (→
per-user accounts + 2FA). None require an external account to run today.
