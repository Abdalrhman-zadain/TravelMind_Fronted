# TravelMind Node.js Backend (PostgreSQL)

This backend now uses `Node.js + Express + Prisma + PostgreSQL` and keeps the same API contract your frontend already uses.

## 1. Prerequisites

- PostgreSQL running locally or remotely
- Node.js 18+

## 2. Setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env` and set your real PostgreSQL connection string in `DATABASE_URL`.

## 3. Create DB schema

```bash
npm run db:push
npm run db:generate
```

## 4. Seed initial data (from `backend/data/db.json`)

```bash
npm run db:seed
```

## 5. Run API

```bash
npm run dev
```

API base URL:

- `http://localhost:3000/api`

## Available API groups

- `auth`
- `attractions`
- `hotels`
- `restaurants`
- `categories`
- `trips`
- `expenses`
- `journals`
- `reviews`
- `chat`

## Notes

- Frontend compatibility is preserved (same endpoint paths and payload shape).
- Auth now uses `bcrypt` password hashing + signed JWT tokens.
- Backward compatibility: legacy numeric tokens can be temporarily accepted via `ALLOW_LEGACY_NUMERIC_TOKEN=true`.
