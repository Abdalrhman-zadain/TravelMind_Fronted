# 🚀 TravelMind Backend - Quick Start Guide for Beginners

## ⚡ Super Simple Steps to Run the Project (No Programming Knowledge Required!)

### Step 1: Open PowerShell Terminal

1. Go to the `backend` folder
2. Right-click → "Open PowerShell window here"

### Step 2: Check Prerequisites

Make sure you have these installed (ask a tech friend if unsure):

- **Node.js** - Download from https://nodejs.org/ (get the LTS version)
- **PostgreSQL** - Download from https://www.postgresql.org/download/
- Start PostgreSQL service (it usually runs automatically)

### Step 3: Install Project Dependencies

Copy and paste this command into PowerShell:

```powershell
npm install
```

Wait for it to finish (may take a few minutes).

### Step 4: Restore the Database with Real Data

This is important! Copy and paste this command into PowerShell:

```powershell
$env:PGPASSWORD = "postgres123"; psql -U postgres -h localhost -d travelmind -f "D:\project\TravelMind_Fronted\backend\database_backup_2026-06-06_234758.sql"
```

This restores all the real data from the backup file.

### Step 5: Generate Database Connection

Copy and paste this command:

```powershell
npx prisma generate
```

### Step 6: Start the Backend Server

Copy and paste this command:

```powershell
npm run dev
```

**You should see this message:**

```
TravelMind Node API running at http://localhost:3000/api
```

### Step 7: Open the Website

Copy and paste this into your browser address bar:

```
http://127.0.0.1:3000/index.html
```

**Done!** 🎉 The website is now running with real data!

---

## 📝 Frequently Asked Questions

**Q: What if I get a "Cannot find module" error?**
A: Run `npm install` again

**Q: What if the website doesn't load?**
A: Check that PostgreSQL is running and the backend terminal shows the running message

**Q: How do I stop the server?**
A: Press `Ctrl + C` in the PowerShell terminal

**Q: Where do I restore the database again if I need to reset?**
A: The backup file is at: `D:\project\TravelMind_Fronted\backend\database_backup_2026-06-06_234758.sql`
Just run Step 4 again!

---

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

---

## How to Run the Project

### Prerequisites

- **Node.js** v16+ and npm installed
- **PostgreSQL** v12+ running on localhost:5432
- Database: `travelmind` with user `postgres` and password `postgres123`
- Port 3000 available for backend

### Backend Setup & Startup

From the `backend` folder:

```powershell
# 1. Navigate to backend
cd backend

# 2. Install dependencies (if not already installed)
npm install

# 3. Ensure database is running
# PostgreSQL should be running at localhost:5432

# 4. Generate Prisma client
npx prisma generate

# 5. Start the development server
npm run dev
```

**Expected output:**

```
TravelMind Node API running at http://localhost:3000/api
```

**Verify backend is working:**

```powershell
# In a new terminal, test an API endpoint
curl http://localhost:3000/api/attractions/1/detail
# Should return attraction data with status 200
```

### Frontend Access

Once the backend is running on port 3000, you can access the frontend through the backend server:

- **Home Page:** http://127.0.0.1:3000/index.html
- **Attractions Listing:** http://127.0.0.1:3000/attractions.html
- **Attraction Profile (Example):** http://127.0.0.1:3000/company-detail.html?id=3
- **Hotels:** http://127.0.0.1:3000/hotels.html
- **Restaurants:** http://127.0.0.1:3000/restaurants.html
- **Gallery:** http://127.0.0.1:3000/gallery.html
- **Trip Planner:** http://127.0.0.1:3000/trip-planner.html
- **Admin Dashboard:** http://127.0.0.1:3000/admin.html
- **Auth (Login/Register):** http://127.0.0.1:3000/auth.html

### API Documentation

- **Swagger Docs:** http://127.0.0.1:3000/api/docs

### Full Project Structure

```
TravelMind_Fronted/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── server.js          # Express app entry point
│   │   ├── modules/           # Feature route modules
│   │   └── common/            # Shared utilities (auth, parsing)
│   ├── prisma/
│   │   ├── schema.prisma      # Database models
│   │   └── seed.js            # Database seed script
│   ├── scripts/               # Batch scripts (data import, enrichment)
│   ├── data/
│   │   └── db.json            # Fallback data file
│   ├── package.json
│   └── .env                   # Environment variables
│
├── css/                       # Frontend stylesheets
├── js/                        # Frontend JavaScript
├── image/                     # Static images
│
├── *.html                     # Frontend pages
│   ├── index.html             # Home page
│   ├── company-detail.html    # Attraction profile page
│   ├── admin.html             # Admin dashboard
│   ├── attractions.html       # Attractions listing
│   ├── hotels.html            # Hotels listing
│   ├── restaurants.html       # Restaurants listing
│   ├── gallery.html           # Photo gallery
│   ├── trip-planner.html      # Trip planning tool
│   ├── auth.html              # Login/register page
│   └── account.html           # User account page
│
└── requirement/               # Project documentation
    ├── ATTRACTION_PROFILE_PAGE_REQUIREMENTS.md
    ├── QUICK_START_GUIDE.md
    └── COMPONENT_STRUCTURE.md
```

### Database Setup

If database is empty or corrupted:

```powershell
# From backend folder

# 1. Restore from the latest backup file
$env:PGPASSWORD = "postgres123"; psql -U postgres -h localhost -d travelmind -f "database_backup_2026-06-06_234758.sql"

# 2. Sync Prisma schema
npx prisma db pull

# 3. Generate Prisma client
npx prisma generate
```

**Available backup files:**

- `database_backup_2026-06-06_234758.sql` - Latest backup with all real data (9.3 MB)
- `backupfile.sql` - Previous backup
- `all_data_backup.sql` - Full data backup

### Troubleshooting

**Port 3000 already in use:**

```powershell
# Kill Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Then restart
npm run dev
```

**Database connection fails:**

- Check PostgreSQL is running: `psql -U postgres -d travelmind`
- Verify .env has correct DB credentials
- Check .env DATABASE_URL format: `postgresql://postgres:postgres123@localhost:5432/travelmind`

## Prisma Migration Guide

Follow these steps to update the database schema.

### 1. Creating a New Migration

When you modify `prisma/schema.prisma`, run:

```powershell
npx prisma migrate dev --name your_migration_name
```

This will:

- Generate a new SQL migration file.
- Apply it to your local database.
- Regenerate the Prisma Client.

### 2. Handling "Shadow Database" Errors

If `migrate dev` fails with errors like "table does not exist" or "P3006":

1. **Mark local sync:** If your database is already correct but Prisma is confused:
   ```powershell
   npx prisma migrate resolve --applied your_last_migration_name
   ```
2. **Reset (Caution):** If you don't mind losing dev data:
   ```powershell
   npx prisma migrate reset
   ```

### 3. Migration Best Practices

- **Do not edit migration files manually** unless absolutely necessary.
- **Keep history clean:** We consolidated the initial schema into `20260525000000_init`. Always ensure this migration is the first in your `prisma/migrations` folder for a fresh setup.
- **Check Status:** Run `npx prisma migrate status` to see if your DB and local files are in sync.

### 4. Deploying to a New Environment

To apply all existing migrations to a fresh database without using the "shadow database" logic (useful for production/staging):

```powershell
npx prisma migrate deploy
```

### 5. If You Already Wrote a New Migration File

If the migration SQL file already exists in `prisma/migrations`, use this flow to update the database:

1. Stop the backend server first.
   This is important on Windows because `node` can lock Prisma files.
2. Open a terminal in the `backend` folder.
3. Apply the migration to the database:
   ```powershell
   npx prisma migrate deploy
   ```
4. Regenerate the Prisma client:
   ```powershell
   npx prisma generate
   ```
5. Start the backend again:
   ```powershell
   npm run dev
   ```

Useful checks:

```powershell
npx prisma migrate status
npx prisma studio
```

If `npx prisma generate` fails with a Windows `EPERM` or file lock error:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
npx prisma generate
```

---

**nodemon not restarting on file changes:**

- Make sure you're in the backend folder when running `npm run dev`
- nodemon watches the working directory and all subdirectories
