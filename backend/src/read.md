# src Folder Overview

The src folder is organized into three parts.

## 1. App Entry

- server.js
- This is the bootstrap file.
- It creates the Express app, loads middleware, mounts Swagger docs, and registers all route modules.

## 2. Shared Utilities (common)

- common/auth/auth.js
  - JWT auth helpers (token creation and request auth guard)
- common/http/async-handler.js
  - Async wrapper for route handlers
- common/utils/parsers.js
  - Shared parsing helpers for number/date/string inputs
- common/utils/normalizers.js
  - Payload normalizers for trips, expenses, journals, reviews, chat, attractions, hotels, restaurants, and categories

## 3. Feature Modules (modules)

- modules/health/health.routes.js
  - Health endpoint
- modules/auth/auth.routes.js
  - Register and login endpoints
- modules/catalog/catalog.routes.js
  - Attractions, hotels, and restaurants routes (CRUD plus import/update/filter endpoints)
- modules/meta/meta.routes.js
  - Categories and photos routes
- modules/planning/planning.routes.js
  - Trips, expenses, and journals routes
- modules/community/community.routes.js
  - Reviews and chat routes

## Request Flow

1. Frontend calls an API route.
2. A matching route in modules handles the request.
3. The module uses shared helpers from common.
4. Database reads/writes happen through Prisma.

## Geoapify Places Enrichment (Script + API)

- Core enrichment logic lives in modules/catalog/attraction-geoapify-enrichment.service.js.
- API routes that call the service live in modules/catalog/catalog.routes.js.
- Batch script lives outside src at scripts/enrichAttractionsOpenTripMap.js.

Run the batch script from backend with npm:

- npm run attractions:enrich-geoapify
- npm run attractions:enrich-geoapify -- --limit=242
- npm run attractions:enrich-geoapify -- --overwrite
- npm run attractions:enrich-geoapify -- --all

From PowerShell in the backend folder:

- cd backend
- npm run attractions:enrich-geoapify

Options:

- --limit=NUMBER: process only the first N candidates.
- --overwrite: update fields even when values already exist.
- --all: include all attractions, not only rows with missing fields.

Geoapify setup:

- Set GEOAPIFY_API_KEY in backend/.env.
- Attraction data is fetched from Geoapify Places and Place Details APIs.
