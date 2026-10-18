# Deploy to Vercel (demo)

About 15 minutes. You need a GitHub account and a Vercel account (the free Hobby plan is fine for a demo).

## 1. Push the code to GitHub

```sh
cd jeffs-taproom
git add -A && git commit -m "Jeff's Taproom site"
gh repo create jeffs-taproom --private --source . --push   # or create the repo on github.com and push
```

## 2. Import into Vercel

1. vercel.com → **Add New… → Project** → import `jeffs-taproom`. Vercel detects Next.js and pnpm.
2. Don't deploy yet. Open **Storage** in the project and add:
   - **Neon (Postgres)**: click Create, accept the defaults. Vercel adds `DATABASE_URL` and related variables.
   - **Blob**: click Create. Vercel adds `BLOB_READ_WRITE_TOKEN`.

## 3. Environment variables

Project → **Settings → Environment Variables** (all environments):

| Name | Value |
|---|---|
| `PAYLOAD_SECRET` | Output of `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` (your production URL, no trailing slash) |
| `SEED_STAFF_EMAIL` | Your email (becomes the first admin login) |
| `SEED_STAFF_PASSWORD` | A strong password |
| `SEED_DEMO` | `1` (adds the labeled sample events, specials, taps and Hall of Fame) |
| `SMTP_URL`, `MAIL_FROM` | Optional. Without them, receipt emails are only logged |

**Never add `ENABLE_TEST_API` or `E2E`.** They switch on the test-only reset API.

## 4. Deploy

Click **Deploy**. When it's live, open the site once. The first request creates the database tables, the menu,
hours, settings, your admin user and the sample content (allow ~10 s).

Then sign in at `/admin` with `SEED_STAFF_EMAIL` / `SEED_STAFF_PASSWORD`, go to **Staff → Users** and create a
**manager** login for the manager.

## Known limits on Vercel

- **Kitchen display:** new orders appear within about 5 seconds (polling). Instant push only works on a
  single always-on server, such as the Docker/VPS setup in the README.
- **Admin login only works on the production URL** (`NEXT_PUBLIC_SITE_URL`), not on preview-deployment URLs.
  This is Payload's CSRF protection.
- **Before going live for real:** delete the sample content (everything with "(sample)" or "Sample" in its name),
  remove `SEED_DEMO`, set real hours, and replace the placeholder logo and photos.
