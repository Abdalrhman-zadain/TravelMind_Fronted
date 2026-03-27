# TravelMind Node.js Backend (PostgreSQL)

This backend now uses `Node.js + Express + Prisma + PostgreSQL` and keeps the same API contract your frontend already uses.

## Team Onboarding (Quick Start)

If a teammate clones this repo for the first time, use this exact flow:

1. Open terminal in `backend/`
2. Install packages: `npm install`
3. Create `.env` from example and fill real values
4. Prepare DB: `npm run db:push && npm run db:generate`
5. (Optional) Seed starter data: `npm run db:seed`
6. Start API: `npm run dev`
7. Open frontend and make sure API base is `http://localhost:3000/api`

## Project Structure (Backend)

- `src/server.js`: main Express API
- `src/modules/attractions/`: attractions module (routes/controller/service/repository)
- `scripts/fetchHotels.js`: import hotels from Hotels API into PostgreSQL
- `scripts/importAttractionsOverpass.js`: import attractions from Overpass API
- `scripts/updateAttractionImages.js`: enrich attractions with Wikimedia/Wikipedia images
- `prisma/schema.prisma`: Prisma models
- `data/db.json`: seed source data

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

Minimum required env vars:

- `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public`
- `HOTELS_API_KEY=...` (required for hotels import)

Optional:

- `PORT=3000`
- `ALLOW_LEGACY_NUMERIC_TOKEN=true`

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

## Daily Commands (Team Cheatsheet)

- Start backend: `npm run dev`
- Import external hotels: `npm run hotels:fetch`
- Import attractions from Overpass: `npm run attractions:import`
- Update attraction images: `npm run attractions:update-images`

## 6. External Hotels Import (`scripts/fetchHotels.js`)

This project includes a standalone script at `backend/scripts/fetchHotels.js` that fetches hotels from the external Hotels API and upserts them into PostgreSQL.

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

## 7. Overpass Attractions Import (OpenStreetMap)

This backend includes an Overpass-based attractions importer:

- Service file: `backend/scripts/importAttractionsOverpass.js`
- API endpoint: `POST /api/attractions/import-overpass`
- Optional body: `{ "limit": 300 }`

### Run import via API (PowerShell)

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:3000/api/attractions/import-overpass" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"limit":300}'
```

### Run import via npm script

```bash
npm run attractions:import
```

### What it does

- Calls Overpass API for Jordan attractions (`attraction`, `museum`, `viewpoint`, `zoo`)
- Maps data into existing `attractions` table columns used by your Prisma model
- Skips rows without `name`
- Prevents duplicates by checking:
  - same `latitude + longitude`, or
  - same `nameEn` (case-insensitive)

### Jordan-only safety

Importer query uses Jordan country area by ISO code:

- `area["ISO3166-1"="JO"][admin_level=2]`

It also applies a Jordan coordinate-bounds filter before insert.

### Optional cleanup (wrong old rows)

If you imported data with an older broad query, clean non-Jordan rows:

```sql
DELETE FROM attractions
WHERE latitude < 29 OR latitude > 34.5
   OR longitude < 34 OR longitude > 40.5;
```

## Common Team Issues

1. `ENOENT ... package.json`  
You are not inside `backend/`. Run:
```bash
cd backend
```

2. `EADDRINUSE: port 3000 already in use`  
Another process is already running. Stop old server or use another `PORT` in `.env`.

3. `SASL ... client password must be a string`  
`DATABASE_URL` or DB password is missing/invalid in `.env`.

4. Attractions page still shows old data  
Hard refresh browser (`Ctrl + F5`) and confirm API is running at `http://localhost:3000/api`.

5. Images not showing for every attraction  
Not all places have Wikimedia/Wikipedia images. Run:
```bash
npm run attractions:update-images
```
Coverage is best-effort, not guaranteed 100%.

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
