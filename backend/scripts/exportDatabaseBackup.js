import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function quoteIdentifier(name) {
  return `"${String(name).replace(/"/g, "\"\"")}"`;
}

async function exportDatabaseBackup() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in backend/.env");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const dbResult = await client.query("select current_database() as name");
    const tablesResult = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name asc
    `);

    const backup = {
      exportedAt: new Date().toISOString(),
      database: dbResult.rows[0]?.name || "unknown",
      schema: "public",
      tables: {},
    };

    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const sql = `select * from ${quoteIdentifier(tableName)}`;
      const dataResult = await client.query(sql);
      backup.tables[tableName] = dataResult.rows;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.resolve(process.cwd(), "backups");
    const backupFile = path.join(backupDir, `travelmind-backup-${timestamp}.json`);

    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), "utf8");

    console.log(backupFile);
  } finally {
    await client.end();
  }
}

exportDatabaseBackup().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
