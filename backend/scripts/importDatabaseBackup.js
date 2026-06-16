import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

function quoteIdentifier(name) {
  return `"${String(name).replace(/"/g, "\"\"")}"`;
}

function topoSort(nodes, edges) {
  const indegree = new Map(nodes.map((node) => [node, 0]));
  const adjacency = new Map(nodes.map((node) => [node, []]));

  for (const [from, to] of edges) {
    if (!indegree.has(from) || !indegree.has(to) || from === to) continue;
    adjacency.get(from).push(to);
    indegree.set(to, indegree.get(to) + 1);
  }

  const queue = nodes.filter((node) => indegree.get(node) === 0);
  const order = [];

  while (queue.length) {
    const current = queue.shift();
    order.push(current);
    for (const next of adjacency.get(current)) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }

  for (const node of nodes) {
    if (!order.includes(node)) order.push(node);
  }

  return order;
}

async function getInsertOrder(client, tableNames) {
  const result = await client.query(`
    select
      tc.table_name as child_table,
      ccu.table_name as parent_table
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
     and tc.constraint_schema = ccu.constraint_schema
    where tc.constraint_type = 'FOREIGN KEY'
      and tc.table_schema = 'public'
      and ccu.table_schema = 'public'
  `);

  const edges = result.rows.map((row) => [row.parent_table, row.child_table]);
  return topoSort(tableNames, edges);
}

async function resetSequences(client, tableName, rows) {
  if (!rows.length) return;

  const columnsResult = await client.query(
    `
      select
        column_name,
        pg_get_serial_sequence($1, column_name) as sequence_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $2
    `,
    [`public.${tableName}`, tableName]
  );

  for (const row of columnsResult.rows) {
    if (!row.sequence_name) continue;

    const maxValue = rows.reduce((currentMax, item) => {
      const value = item[row.column_name];
      if (typeof value !== "number") return currentMax;
      return Math.max(currentMax, value);
    }, 0);

    await client.query("select setval($1, $2, $3)", [
      row.sequence_name,
      maxValue > 0 ? maxValue : 1,
      maxValue > 0,
    ]);
  }
}

async function insertRows(client, tableName, rows) {
  if (!rows.length) return;

  const columns = Object.keys(rows[0]);
  if (!columns.length) return;

  const columnList = columns.map(quoteIdentifier).join(", ");

  for (const item of rows) {
    const values = columns.map((column) => item[column] ?? null);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    const sql = `insert into ${quoteIdentifier(tableName)} (${columnList}) values (${placeholders})`;
    await client.query(sql, values);
  }

  await resetSequences(client, tableName, rows);
}

async function importDatabaseBackup() {
  const connectionString = String(process.env.DATABASE_URL || "").trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing in backend/.env");
  }

  const backupArg = process.argv[2];
  if (!backupArg) {
    throw new Error("Usage: node scripts/importDatabaseBackup.js <backup-file>");
  }

  const backupPath = path.resolve(process.cwd(), backupArg);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  const tableNames = Object.keys(backup.tables || {});
  if (!tableNames.length) {
    throw new Error("Backup file does not contain any tables");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const existingTablesResult = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
    `);
    const existingTables = new Set(existingTablesResult.rows.map((row) => row.table_name));
    const missingTables = tableNames.filter((name) => !existingTables.has(name));

    if (missingTables.length) {
      throw new Error(`Target database is missing tables: ${missingTables.join(", ")}`);
    }

    const orderedTables = await getInsertOrder(client, tableNames);
    const truncateList = orderedTables.map(quoteIdentifier).join(", ");

    await client.query("begin");
    await client.query(`truncate table ${truncateList} restart identity cascade`);

    for (const tableName of orderedTables) {
      await insertRows(client, tableName, backup.tables[tableName] || []);
    }

    await client.query("commit");
    console.log(`Imported backup into ${backup.database || "database"} from ${backupPath}`);
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

importDatabaseBackup().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
