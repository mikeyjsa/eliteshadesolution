# Site QA Report

Date: 24 November 2026

## Scope and outcome

1. **Homepage and discovery - Healthy.** Checked desktop and mobile layouts, corrected the mobile comparison overflow, aligned payment messaging with the configured payment mode, and added measurable engagement events to quote, phone, email, and WhatsApp links.
2. **Quote journey - Healthy.** Added durable labels, autocomplete, inline validation, privacy guidance, spam protection, request throttling, input sanitisation, clearer trust signals, and quote-funnel analytics events.
3. **Contact and content pages - Healthy.** Verified all main public routes at a 390px viewport without horizontal overflow. Contact capture now has accessible labels, validation, sanitisation, throttling, and spam protection.
4. **Admin and CRM - Improved.** Protected previously exposed CMS APIs, restricted settings and user management to admins, strengthened user account rules, and added overdue follow-up, progression, and recent-activity visibility to the dashboard.
5. **Data, authentication, uploads, and backups - Healthy.** Passwords now use salted scrypt hashes, sessions are HMAC signed, private uploads require authentication, backup IDs are validated, and an unreadable encrypted database now fails safely instead of being replaced with seed data.
6. **SEO, sharing, and production security - Healthy.** Existing metadata, sitemap, robots, and social images remain in place. Production security headers were added and runtime dependencies were upgraded to eliminate known production vulnerabilities.
7. **Deployment packaging - Ready.** The Next.js production build and cPanel packages were regenerated successfully. The README now documents one Afrihost-only production path, including persistent storage, SMTP, SSL, and cPanel Git deployment.

## Verification

- `npm run test:e2e`: 20 tests passed in Chromium.
- `npx tsc --noEmit`: passed.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- `npm run build:cpanel`: passed and regenerated both deployment archives.
- `git diff --check`: passed.
- Visual evidence is saved in `output/qa-2026-11-24/` for homepage, quote, and admin login views.

## Remaining live checks

- SMTP delivery was not triggered during QA to avoid sending real customer or staff email. Send one controlled test after deployment.
- Google Analytics credentials and live reporting data require validation against the production GA4 property after deployment.
- Authenticated destructive CRM actions were not run against production customer data.
- The login throttle is process-local. If the application is scaled to multiple instances, move throttling to a shared store such as Redis.

## Hosting decision

Run the complete production stack on Afrihost only: cPanel Node.js/Passenger hosting, Git deployment, domain and DNS, AutoSSL, persistent `.data` storage, and Afrihost SMTP. The prebuilt standalone deployment archive avoids server-side dependency installation and production builds, while `.cpanel.yml` preserves the database, backups, and uploads during every deployment.
