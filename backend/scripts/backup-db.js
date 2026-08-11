const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function escapeSql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function backupDatabase() {
  const backupDir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `supabase-backup-${timestamp}.sql`);

  const tablesResult = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tables = tablesResult.rows.map((row) => row.table_name);

  let sql = `-- Backup generado el ${new Date().toISOString()}\n-- Base: ${process.env.DATABASE_URL ? 'DATABASE_URL configurada' : 'DATABASE_URL no configurada'}\n\n`;

  for (const table of tables) {
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    const columns = columnsResult.rows.map((row) => row.column_name);
    if (!columns.length) continue;

    const quotedColumns = columns.map((c) => `"${c}"`).join(', ');
    const quotedTable = `"${table}"`;

    const rowsResult = await pool.query(`SELECT ${columns.map((c) => `"${c}"`).join(', ')} FROM ${quotedTable}`);

    sql += `\n-- Tabla: ${table}\n`;
    for (const row of rowsResult.rows) {
      const values = columns.map((column) => escapeSql(row[column]));
      sql += `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES (${values.join(', ')});\n`;
    }
  }

  fs.writeFileSync(backupFile, sql, 'utf8');
  console.log(`Backup creado: ${backupFile}`);
  console.log(`Tablas respaldadas: ${tables.length}`);
}

backupDatabase()
  .catch((err) => {
    console.error('Error al crear el respaldo:', err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
