# Team Collaboration Setup (Backend)

This file explains how to share this backend safely with teammates.

## What to share vs keep private

- Commit `backend/.env.example` to Git.
- Do NOT commit `backend/.env` (it contains real secrets/passwords).

## First-time setup for each teammate

1. Go to `backend/`.
2. Copy template to local env file:
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
3. Edit `.env` with personal/local values:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` (optional)

## Database setup

Run in `backend/`:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

## Important notes

- If login/register fails with `Internal server error`, check `.env` and DB credentials first.
- If port `3000` is busy, set a different `PORT` in `.env` (for example `3001`) and update frontend API base URL.
- Keep secrets only in `.env`, never in code, screenshots, or commits.