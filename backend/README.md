# TravelMind Backend

Backend API for the TravelMind project.

## Stack

- `Node.js`
- `Express`
- `Prisma`
- `PostgreSQL`
- `JWT`

## Purpose

The backend provides:

- authentication
- attractions, hotels, restaurants, companies, tours, and transport data
- trip planning, journals, expenses, reviews, and checkout flows
- traveler stories, analytics, and admin features

## Structure

```text
backend/
|- src/
|  |- common/
|  |- modules/
|  `- server.js
|- prisma/
|  |- migrations/
|  |- schema.prisma
|  `- seed.js
|- scripts/
|- data/
|- .env.example
|- package.json
`- README.md
```

## Main Modules

- `src/modules/auth/`
- `src/modules/catalog/`
- `src/modules/community/`
- `src/modules/health/`
- `src/modules/meta/`
- `src/modules/planning/`

## Setup

```sh
cd backend
npm install
```

Create `.env` from `.env.example`.

Minimum required values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
JWT_SECRET=replace-me
PORT=3000
```

Prepare the database:

```sh
npm run db:push
npm run db:generate
```

Optional seed:

```sh
npm run db:seed
```

Start the server:

```sh
npm run dev
```

API base URL:

```text
http://localhost:3000/api
```

## Scripts

### App

- `npm run dev`
- `npm start`

### Database

- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:push`
- `npm run db:seed`

### Import and Enrichment

- `npm run hotels:fetch`
- `npm run attractions:import`
- `npm run attractions:update-images`
- `npm run attractions:enrich-geoapify`
- `npm run attractions:enrich-opentripmap`
- `npm run restaurants:import`
- `npm run restaurants:update-photos`
- `npm run photos:import-pexels`

## Architecture

The backend uses a modular monolith structure:

1. `server.js` starts the app and registers routes.
2. `common/` contains shared auth, HTTP, and utility helpers.
3. `modules/` contains domain-based route logic.
4. Prisma connects the API to PostgreSQL.

## Frontend Integration

The frontend is in `../frontend/`.

The shared frontend API client is `../frontend/js/api.js`, which expects this backend to serve endpoints under `/api`.

## Notes

- Do not commit real `.env` values.
- Do not commit `node_modules/`.
- Some import scripts require extra API keys in `.env`.
