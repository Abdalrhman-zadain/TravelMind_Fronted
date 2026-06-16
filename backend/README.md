# TravelMind Backend

The TravelMind backend is a `Node.js + Express + Prisma + PostgreSQL` application that powers the frontend under `../frontend/`.

It is responsible for:

- authentication and authorization
- travel catalog data such as attractions, hotels, restaurants, companies, tours, and transport
- trip planning, journals, expenses, AI plans, checkout, and analytics
- traveler stories and moderation flows

## Tech Stack

- `Node.js`
- `Express`
- `Prisma ORM`
- `PostgreSQL`
- `JWT` authentication

## Project Structure

```text
backend/
|- src/
|  |- common/
|  |  |- auth/
|  |  |- http/
|  |  `- utils/
|  |- modules/
|  |  |- auth/
|  |  |- catalog/
|  |  |- community/
|  |  |- health/
|  |  |- meta/
|  |  `- planning/
|  |- read.md
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

## Main Backend Modules

- `src/server.js`
  Main application entry point. Creates the Express app, configures middleware, initializes Prisma, and registers routes.

- `src/common/auth/auth.js`
  Shared JWT auth helpers and authorization middleware such as `requireAuth`, `requireAdmin`, and ownership checks.

- `src/modules/auth/`
  Login and registration endpoints.

- `src/modules/catalog/`
  Catalog and discovery endpoints such as attractions, hotels, restaurants, companies, tours, packages, transport, and supporting enrichment flows.

- `src/modules/community/`
  Traveler stories and interaction endpoints.

- `src/modules/planning/`
  Trip planning, expenses, journals, analytics, notifications, guide bookings, checkout orders, payment transactions, and related business flows.

- `prisma/schema.prisma`
  Database schema and model definitions.

- `scripts/`
  External import and enrichment scripts for hotels, attractions, restaurants, images, and photos.

## Prerequisites

Before running the backend, make sure you have:

- `Node.js 18+`
- `npm`
- `PostgreSQL`

## Setup

### 1. Install dependencies

```sh
cd backend
npm install
```

### 2. Create environment file

Create a `.env` file in `backend/` based on `.env.example`.

Typical required values are:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
JWT_SECRET=replace-this-in-development-and-production
JWT_EXPIRES_IN=7d
PORT=3000
```

Depending on the scripts you want to run, you may also need:

- `HOTELS_API_KEY`
- `GEOAPIFY_API_KEY`
- `UNSPLASH_ACCESS_KEY` or `UNSPLASH_KEY`
- any other external integration key used by import scripts

### 3. Generate Prisma client and sync schema

```sh
npm run db:push
npm run db:generate
```

### 4. Seed sample data if needed

```sh
npm run db:seed
```

### 5. Start the backend

```sh
npm run dev
```

Default API base:

```text
http://localhost:3000/api
```

## Available Scripts

### Run the application

- `npm run dev`
  Starts the backend with `nodemon`.

- `npm start`
  Starts the backend with `node`.

### Database scripts

- `npm run db:generate`
  Generates the Prisma client.

- `npm run db:migrate`
  Runs Prisma migrations in development.

- `npm run db:push`
  Pushes the Prisma schema to the database.

- `npm run db:seed`
  Seeds the database using `prisma/seed.js`.

### Data import and enrichment scripts

- `npm run hotels:fetch`
  Imports hotel data from the configured hotels source.

- `npm run attractions:import`
  Imports attractions from Overpass/OpenStreetMap.

- `npm run attractions:update-images`
  Updates attraction image data.

- `npm run attractions:enrich-geoapify`
  Enriches existing attraction data with Geoapify-based details.

- `npm run attractions:enrich-opentripmap`
  Alias for the attraction enrichment script.

- `npm run restaurants:import`
  Imports restaurants from Overpass/OpenStreetMap.

- `npm run restaurants:update-photos`
  Updates restaurant photos from the configured external source.

- `npm run photos:import-pexels`
  Imports photos through the Pexels import script.

## Architecture Summary

The backend follows a modular monolithic architecture:

1. `server.js` boots the app and wires the modules together.
2. `common/` contains reusable infrastructure code.
3. `modules/` groups route logic by domain.
4. Prisma handles persistence to PostgreSQL.
5. The frontend communicates through REST-style JSON endpoints under `/api`.

## API Domains

The backend currently supports these major API areas:

- `auth`
- `catalog`
  Includes attractions, hotels, restaurants, categories, companies, tours, packages, transport, and photos-related operations.
- `community`
  Includes traveler stories and community interactions.
- `planning`
  Includes trips, expenses, journals, reviews, chat, analytics, notifications, guide bookings, checkout orders, and payment transaction flows.
- `health`
- `meta`

## Authentication

The backend uses JWT-based authentication.

Typical flow:

1. User logs in through the auth endpoint.
2. Backend returns a signed token.
3. Frontend stores the token and sends it in the `Authorization` header.
4. Protected endpoints use middleware such as:
   - `requireAuth`
   - `requireAdmin`
   - `requireSelfOrAdmin`
   - `requireCompanyOwnerOrAdmin`

There is also support for legacy numeric token behavior through:

```env
ALLOW_LEGACY_NUMERIC_TOKEN=true
```

This should only be used when compatibility is required.

## Frontend Integration

The frontend lives in:

```text
../frontend/
```

The shared frontend API client is:

```text
../frontend/js/api.js
```

That file expects this backend to expose endpoints under:

```text
/api
```

When working locally, the frontend typically points to:

```text
http://localhost:3000/api
```

## Common Development Flow

For a fresh local setup:

```sh
cd backend
npm install
npm run db:push
npm run db:generate
npm run db:seed
npm run dev
```

Then open the frontend from:

```text
../frontend/index.html
```

## Troubleshooting

### `ENOENT ... package.json`

You are probably not inside the backend folder.

```sh
cd backend
```

### `EADDRINUSE`

The configured port is already in use. Stop the running process or change `PORT` in `.env`.

### Prisma connection errors

Check:

- `DATABASE_URL`
- PostgreSQL is running
- database user and password are correct

### Frontend cannot load backend data

Check:

1. the backend is running
2. the API base is `http://localhost:3000/api`
3. the browser console has no blocked requests

### Import scripts fail

Check that the related API key exists in `.env` before running the script.

## Notes

- Do not commit your real `.env` values.
- Do not share `node_modules/`.
- Use `.env.example` as the template for onboarding other developers.
- The current backend is a single deployable service, even though it is organized into modules.
