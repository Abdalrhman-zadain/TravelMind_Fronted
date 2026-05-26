# Database Restore Solution - Complete Guide

## Problem Statement

Needed to restore old database backup (`backupfile.sql`) into a new database while preserving:

- Existing Prisma migrations and new tables
- Current seed data
- Old backup data for reference

## Challenge

Direct restore with `--clean` flag failed due to:

- Schema conflicts between old backup and new migrations
- New tables with foreign key dependencies
- Foreign key constraints preventing table drops
- Data type mismatches between versions

## Solution Overview

Create a temporary database to restore the backup separately, then maintain both databases:

- **travelmind**: Current database with new schema + seed data
- **travelmind_backup** (temporary): Contains old backup data for reference

---

## Step-by-Step Solution

### Prerequisites

- PostgreSQL installed with `pg_restore` and `psql` tools
- Database credentials (username: `postgres`, password: `postgres123`)
- Backup file location: `D:\project\TravelMind_Fronted\backend\backupfile.sql`
- Backend project using Prisma ORM

---

### Step 1: Ensure Current Schema is Updated

```powershell
cd D:\project\TravelMind_Fronted\backend
npm run db:push
```

**What it does:**

- Syncs Prisma schema with database
- Creates/updates all new tables from migrations
- Doesn't delete existing data

**Output:** `The database is already in sync with the Prisma schema.`

---

### Step 2: Create Temporary Backup Database

```powershell
$env:PGPASSWORD='postgres123'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE travelmind_backup;"
```

**What it does:**

- Creates empty database named `travelmind_backup`
- Will hold the old backup data

**Output:** `CREATE DATABASE`

---

### Step 3: Restore Backup to Temporary Database

```powershell
$env:PGPASSWORD='postgres123'
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -d travelmind_backup -v "D:\project\TravelMind_Fronted\backend\backupfile.sql"
```

**What it does:**

- Restores entire backup into `travelmind_backup` database
- No conflicts because database is empty
- Creates old schema and data as-is

**Output:** `pg_restore: creating TABLE...` (multiple lines, ends successfully)

---

### Step 4: Restore Seed Data to Current Database

```powershell
npm run db:seed
```

**What it does:**

- Populates current `travelmind` database with seed data
- Ensures all reference data is current
- Works with new schema

**Output:** `Database seeded from backend/data/db.json`

---

### Step 5: Clean Up (Optional)

```powershell
$env:PGPASSWORD='postgres123'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE travelmind_backup;"
```

**What it does:**

- Removes temporary backup database
- Keeps only current production database

**Output:** `DROP DATABASE`

---

## Final Result

### Current Database (`travelmind`)

✅ All new Prisma migrations applied  
✅ New tables created and ready  
✅ Fresh seed data loaded  
✅ Ready for development/production

### What Happened to Old Data

- Old backup is safely stored in `travelmind_backup` (before cleanup)
- Can be restored/merged later if specific data is needed
- Avoids schema conflicts with current development

---

## Key Commands Reference

| Task           | Command                                              |
| -------------- | ---------------------------------------------------- |
| Sync schema    | `npm run db:push`                                    |
| Seed database  | `npm run db:seed`                                    |
| Create DB      | `psql -U postgres -c "CREATE DATABASE name;"`        |
| Restore backup | `pg_restore -U postgres -d dbname -v backupfile.sql` |
| Drop DB        | `psql -U postgres -c "DROP DATABASE name;"`          |

---

## PostgreSQL Tool Paths (Windows)

```
psql.exe:      C:\Program Files\PostgreSQL\17\bin\psql.exe
pg_restore.exe: C:\Program Files\PostgreSQL\17\bin\pg_restore.exe
```

Add to system PATH to use without full paths.

---

## Environment Setup

Required in `.env`:

```
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/travelmind?schema=public"
```

Set password via PowerShell:

```powershell
$env:PGPASSWORD='postgres123'
```

---

## Why This Approach Works

1. **Isolates old data** - Backup doesn't interfere with current development
2. **Preserves migrations** - New schema stays intact
3. **Maintains seed data** - Fresh reference data loaded
4. **No conflicts** - Old and new schemas exist separately
5. **Clean state** - Can drop temporary DB when done

---

## Troubleshooting

### Error: `pg_restore: could not open input file`

- Ensure full path to backup file is correct
- Use quotes around file paths with spaces

### Error: `password authentication failed`

- Set password: `$env:PGPASSWORD='your_password'`
- Or use interactive prompt without `$env:PGPASSWORD`

### Error: `cannot drop table because other objects depend on it`

- Use `--clean` flag instead of manual drop
- Schema conflicts are expected - use separate databases

---

## When to Use This Approach

✅ Restoring old backups to development  
✅ Migrating between database versions  
✅ Preserving both old and new data  
✅ Schema evolution and compatibility issues

❌ Don't use if you want to completely replace schema  
❌ Don't use if old and new schemas are identical

---

## Next Steps

1. Verify `travelmind` database has all new tables
2. Test application with seeded data
3. If specific old data is needed, copy from `travelmind_backup` using SQL
4. Delete `travelmind_backup` when no longer needed

---

**Completed Date:** May 26, 2026  
**Solution Type:** PostgreSQL Database Restoration & Migration  
**Status:** ✅ Successful
