# PulseIQ

AI-assisted financial news MVP with:

- static frontend pages
- Node HTTP API
- persistent local JSON storage
- RSS ingestion
- draft generation and editorial review
- optional OpenRouter, Pexels, and Supabase integrations

## Run locally

1. Copy `.env.example` to `.env` and fill any optional keys you want to use.
2. Start the server:

```bash
npm start
```

3. Open `http://127.0.0.1:3000`

## Useful API routes

- `GET /api/health`
- `GET /api/dashboard`
- `POST /api/jobs/fetch`
- `POST /api/jobs/generate`
- `GET /api/articles?status=published`
- `GET /api/articles/:slug`
- `PUT /api/articles/:id`
- `POST /api/articles/:id/publish`
- `POST /api/articles/:id/force-publish`
- `POST /api/articles/:id/reject`
- `POST /api/articles/:id/retry-image`

## Notes

- Local state is stored in `data/db.json`
- `robots.txt` and `sitemap.xml` are served dynamically by `server.js`
- GitHub Actions schedule is defined in `.github/workflows/daily-news.yml`
- Supabase table bootstrap SQL is in `supabase-schema.sql`
- Blueprint support docs are in `docs/prompts.md`, `docs/source-policy.md`, and `docs/deployment-notes.md`
