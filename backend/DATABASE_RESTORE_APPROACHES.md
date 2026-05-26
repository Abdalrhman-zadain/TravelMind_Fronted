# Database Restore Approaches

## Approach 1: Drop & Recreate (Recommended)

```powershell
# Drop the existing database
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "DROP DATABASE IF EXISTS travelmind;"

# Create a fresh database
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE travelmind;"

# Restore the backup
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -d travelmind -v backupfile.sql
```

**Pros:**

- Completely fresh start - removes all old data
- No conflicts or constraint errors
- Fastest and cleanest approach
- Guaranteed successful restore

**Cons:**

- Loses all current data in the database
- Requires recreating the database

---

## Approach 2: Clean Flag

```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U postgres -d travelmind -v --clean backupfile.sql
```

**Pros:**

- Attempts to clean (DROP) objects before creating new ones
- Safer if you want to preserve some data
- Single command
- Simpler execution

**Cons:**

- May still have conflicts if schemas differ
- Slower than dropping the whole database
- May fail on schema mismatches
- Risk of partial restoration

---

## Comparison Table

| Feature               | Drop & Recreate      | Clean Flag       |
| --------------------- | -------------------- | ---------------- |
| **Data Loss**         | Complete wipe        | Selective        |
| **Speed**             | Faster               | Slower           |
| **Error Risk**        | None                 | High             |
| **Conflict Handling** | Clean slate          | Attempts cleanup |
| **Command Count**     | 3 commands           | 1 command        |
| **Use Case**          | Fresh backup restore | Merging data     |
| **Success Rate**      | 100%                 | Variable         |

---

## Recommendation

**Use Approach 1 (Drop & Recreate)** when:

- You want to restore an old backup into a fresh environment
- You have schema conflicts or duplicate constraints
- You don't need to preserve current database data
- You want guaranteed success

**Use Approach 2 (Clean Flag)** when:

- You want to merge old backup data with current data
- You only need to clean specific tables
- You need a single-command solution
- You're confident there are no schema mismatches

---

## PostgreSQL Paths

For Windows with PostgreSQL 17 installed at default location:

- **psql**: `C:\Program Files\PostgreSQL\17\bin\psql.exe`
- **pg_restore**: `C:\Program Files\PostgreSQL\17\bin\pg_restore.exe`

Add to system PATH to use commands without full path.
