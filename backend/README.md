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

## 6. External Hotels Import (`fetchHotels.js`)

This project includes a standalone script at `backend/fetchHotels.js` that fetches hotels from the external Hotels API and upserts them into PostgreSQL.

### Environment variables required

- `DATABASE_URL` (PostgreSQL connection string)
- `HOTELS_API_KEY` (your Hotels API key)
- Optional: `HOTELS_COUNTRY` (default: `Jordan`)
- Optional: `HOTELS_LIMIT` (default: `10`)

### Run the script

```bash
cd backend
npm run hotels:fetch
```

### Run with custom country/limit

```bash
npm run hotels:fetch -- --country=Jordan --limit=50
```

What it does:
- Calls the Hotels API with `X-API-KEY` using selected country/limit
- Normalizes hotel fields (id, name, city, country, lat/lng, rating, amenities)
- Inserts new rows and updates existing rows (upsert behavior)
- Closes DB connections safely when finished

### API endpoint option

You can also trigger external import from the backend API endpoint:

- `POST /api/hotels/fetch-external`

This is what the Hotels page "Import Hotels from External API" button uses.

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
