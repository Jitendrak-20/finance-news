# PulseIQ

AI-assisted financial news site with:

- static frontend pages
- local Node HTTP API
- Vercel-compatible serverless API wrappers
- persistent local JSON storage for development
- Supabase-backed durable storage for deployment
- RSS ingestion
- draft generation and editorial review
- optional OpenRouter, Pexels, and Supabase integrations

## Run locally

1. Copy `.env.example` to `.env` and fill any optional keys you want to use.
2. Keep `USE_SUPABASE_STORAGE=0` if you want local JSON persistence in `data/db.json`.
3. Start the server:

```bash
npm start
```

4. Open `http://127.0.0.1:3000`

## Useful API routes

- `GET /api/health`
- `GET /api/dashboard`
- `POST /api/jobs/fetch`
- `POST /api/jobs/generate`
- `GET /api/articles?status=published`
- `GET /api/article?slug=:slug`
- `PUT /api/article?id=:id`
- `POST /api/article-action?id=:id&action=publish`
- `POST /api/article-action?id=:id&action=force-publish`
- `POST /api/article-action?id=:id&action=reject`
- `POST /api/article-action?id=:id&action=retry-image`
- `GET /api/seo?type=robots`
- `GET /api/seo?type=sitemap`
- `GET /api/cron`

## GitHub Actions Scheduler

This project now uses GitHub Actions for quarter-hour automation instead of Vercel Cron so it works on the Vercel Hobby plan.

Set these repository secrets in GitHub:

```text
PULSEIQ_BASE_URL=https://<your-project>.vercel.app
PULSEIQ_CRON_SECRET=<same-value-as-your-vercel-cron-secret>
```

The workflow in `.github/workflows/daily-news.yml` calls:

```text
GET /api/cron
Authorization: Bearer <CRON_SECRET>
```

every 15 minutes.

## Deploy To Vercel From Scratch

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase-schema.sql`.
3. Create an empty GitHub repository.
4. In this project folder, initialize/push the repo:

```bash
git init
git add .
git commit -m "Initial PulseIQ deploy"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

5. In Vercel, click `Add New... > Project`, then import that GitHub repository.
6. Keep the default framework as `Other`.
7. Add these environment variables in Vercel Project Settings:

```text
BASE_URL=https://<your-project>.vercel.app
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
CRON_SECRET=<random-secret>
OPENROUTER_API_KEY=<optional>
OPENROUTER_MODEL=openai/gpt-4.1-mini
PEXELS_API_KEY=<optional>
```

8. Redeploy after adding env vars.
9. Open:
   - `/api/health`
   - `/api/dashboard`
   - `/robots.txt`
   - `/sitemap.xml`
10. If you connect a custom domain later, update `BASE_URL` to that exact production URL and redeploy.

## Vercel Notes

- Production on Vercel should use Supabase. Local `data/db.json` is only for local development.
- `vercel.json` rewrites `robots.txt` and `sitemap.xml` through serverless API routes.
- On Hobby, Vercel cron is too limited for quarter-hour jobs, so `.github/workflows/daily-news.yml` is the scheduler for `/api/cron`.
- `CRON_SECRET` must still be set in Vercel because `/api/cron` checks for `Authorization: Bearer <CRON_SECRET>`.

## Notes

- Local state is stored in `data/db.json`
- `robots.txt` and `sitemap.xml` are served dynamically by `lib/server-core.js`
- Vercel function entrypoints live in `api/`
- Vercel deployment config is in `vercel.json`
- GitHub Actions schedule is defined in `.github/workflows/daily-news.yml`
- Supabase table bootstrap SQL is in `supabase-schema.sql`
- Blueprint support docs are in `docs/prompts.md`, `docs/source-policy.md`, and `docs/deployment-notes.md`
