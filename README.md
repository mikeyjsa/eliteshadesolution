# Elite Shade Solutions — Platform

Custom web platform for an online-quoting shade-sail business in the Western Cape.
A public marketing site funnels visitors into an **instant quote calculator**; a
private admin runs the **CRM → invoicing → scheduling** pipeline. Built from the
business blueprint (`../Elite-Shade-Solutions-Business-Blueprint.html`).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
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

Password gate — scaffold password **`eliteshade`** (change in Settings).

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
- If you plan to use SMTP from your hosting provider, keep the mailbox credentials ready for the in-app Settings screen. They are not required as environment variables.

### Required persistent volume

In Railway, mount one persistent volume to this path inside the service:

- `/app/.data`

Why this is enough:

- `.data` holds the live DB, hourly/manual backups, and uploaded files.
- Uploads are now stored in `.data/uploads/` and served by the app at `/uploads/...`.
- Without this mount, deploys/restarts will lose DB, backups, and uploaded files.

### Build and start commands

Railway can use the default Node detection, or you can set:

```bash
npm install
npm run build
npm run start
```

The production start script respects Railway's `PORT` env var automatically and
falls back to `4700` locally.

### cPanel / Passenger Node hosting

If your host provides cPanel's Node.js Application Manager, this app can also run there as a normal Node deployment instead of as a static export.

Recommended deployment mode for Afrihost/cPanel:

- Build locally with `npm run build:cpanel`
- Upload `cpanel-deploy.tar.gz` into the live app root
- Extract it over the existing app files
- Keep `.data/` in place
- Set the startup file to `server.js`

Why this is recommended:

- shared hosting build memory can be unreliable for `next build`
- the standalone build carries the exact runtime needed for the compiled app
- deploys become a repeatable upload + extract + restart flow without touching live data

Recommended application settings:

- Node.js version: `24.x` if available, otherwise the newest supported LTS version
- Application mode: `Production`
- Application root: `/home/<cpanel-user>/public_html/www`
- Application URL: `/` for the main site, or a subdomain path if you deploy it separately
- Application startup file: `server.js` for standalone bundles, or `app.js` only for source-based local/server builds

Recommended Git layout:

1. Do **not** keep the Git repository inside the live app root.
2. Create a **cPanel-managed repository in a separate path**, for example:

```bash
/home/<cpanel-user>/repositories/elite-shade
```

3. Keep the live Node application root as:

```bash
/home/<cpanel-user>/public_html/www
```

4. Commit the included `.cpanel.yml` file to the repo. cPanel Git deployment will then copy the app from the repository into the live app root while leaving `.data/` alone.

Why this matters:

- If the repo lives inside `public_html/www`, the live app becomes a dirty working tree and future pulls/deploys will eventually fail.
- If the repo lives outside the live app root, cPanel can keep the repo clean and deploy into the runtime folder safely.
- The included `.cpanel.yml` excludes `.data/`, so DB, uploads, and backups survive deploys.

First-time app bootstrap:

1. Clone the repository into the separate cPanel Git path.
2. In the Node.js app manager, point the application root at `/home/<cpanel-user>/public_html/www` and the startup file at `app.js`.
3. Copy or deploy the app files into the live app root.
4. Open a terminal/SSH session in the live app root and run:

```bash
npm install
npm run build
mkdir -p .data
```

5. Set environment variables in the app manager:

```bash
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
ELITE_DB_PASSPHRASE=use-a-long-random-secret
```

6. Restart the application from cPanel after changes.

Ongoing deploy flow:

1. Push to GitHub.
2. Build locally with `npm run build:cpanel`.
3. Upload `cpanel-deploy.tar.gz` to `/home/<cpanel-user>/public_html/www`.
4. Extract it into the live app root and confirm `.data/` remains untouched.
5. Restart the Node.js application from cPanel.
6. If you also keep a clean repository in `/home/<cpanel-user>/repositories/elite-shade`, pull that repo separately for source tracking, but do not depend on cPanel Git deployment alone for the live Next.js runtime unless the host can reliably build the app on-server.

Important:

- The writable `.data/` folder must exist in the application root.
- Uploaded files, the JSON database, and backups all live under `.data/`.
- The included `.cpanel.yml` explicitly preserves `.data/`.
- If your host disables shell access, Git deployment can still work as long as the repository is clean and `.cpanel.yml` is present.
- If your host cannot complete `next build` reliably on-server, build locally first when needed and avoid deleting the live `node_modules` and `.next` until the replacement artifacts are ready.

### Git deploy flow

1. Push this repository to GitHub.
2. In Railway, create a new project from that repo.
3. Add the environment variables above.
4. Attach a persistent volume to `/app/.data`.
5. Deploy once.
6. Visit `/admin` and change the scaffold credentials/settings immediately.

### Post-deploy checklist

1. Confirm `.data/db.json` is created on the mounted volume.
2. Create a manual backup in `/admin/backups` and confirm it appears.
3. Upload a proof of payment on an invoice and confirm the file lands under `.data/uploads/payment-proofs/`.
4. Open `https://your-domain.com/robots.txt` and `https://your-domain.com/sitemap.xml`.
5. Verify that a social share preview uses the generated Open Graph image.
6. In `/admin/settings`, choose your email delivery method:
   - `SMTP` for your mailbox server
   - `Resend` if you later move to an API-based provider
   - `Outbox only` if you want to stage the site without live sending
7. In `/admin/settings`, switch `Customer payment mode` to `EFT only` until your live gateway is active.

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
