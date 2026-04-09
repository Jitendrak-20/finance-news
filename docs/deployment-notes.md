# Deployment Notes

## Local

- `npm start`
- app listens on `PORT`
- static pages and API are both served by `server.js`

## Environment

- `BASE_URL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `PEXELS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Supabase

- create tables using `supabase-schema.sql`
- after that, the server can mirror local state into Supabase when the env vars are present

## Scheduler

- GitHub Actions workflow is in `.github/workflows/daily-news.yml`
- it starts the server, waits for health, then triggers fetch and generate jobs
