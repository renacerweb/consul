const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function quoteIdent(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function quoteQualifiedName(name) {
  return name
    .split('.')
    .map((part) => quoteIdent(part.replace(/^"|"$/g, '')))
    .join('.');
}

function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function getColumnType(column) {
  if (column.data_type === 'USER-DEFINED') return column.udt_name;
  if (column.data_type === 'ARRAY') return `${column.udt_name}[]`;
  return column.data_type;
}

function buildColumnDefinition(column) {
  let sql = `${quoteIdent(column.column_name)} ${getColumnType(column)}`;

  if (column.character_maximum_length) {
    sql += `(${column.character_maximum_length})`;
  } else if (column.numeric_precision && column.numeric_scale !== null) {
    sql += `(${column.numeric_precision}, ${column.numeric_scale})`;
  } else if (column.numeric_precision) {
    sql += `(${column.numeric_precision})`;
  }

  if (column.column_default) {
    sql += ` DEFAULT ${column.column_default}`;
  }

  if (column.is_nullable === 'NO') {
    sql += ' NOT NULL';;
  }

  return sql;
}

async function listTables() {
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  return res.rows.map((row) => row.table_name);
}

async function getColumns(tableName) {
  const res = await client.query(`
    SELECT column_name, data_type, udt_name, is_nullable, column_default,
           character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return res.rows;
}

async function getConstraints(tableName) {
  const res = await client.query(`
    SELECT conname, pg_get_constraintdef(c.oid, true) AS definition
    FROM pg_constraint c
    JOIN pg_class cls ON cls.oid = c.conrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    WHERE ns.nspname = 'public' AND cls.relname = $1
    ORDER BY conname
  `, [tableName]);
  return res.rows;
}

async function getIndexes(tableName) {
  const res = await client.query(`
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = $1
      AND indexname NOT LIKE '%_pkey'
    ORDER BY indexname
  `, [tableName]);
  return res.rows.map((row) => row.indexdef);
}

async function getSequenceColumns(tableName) {
  const res = await client.query(`
    SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
      AND column_default IS NOT NULL
      AND column_default LIKE 'nextval(%'
  `, [tableName]);
  return res.rows;
}

async function getTableRows(tableName, columns) {
  const columnNames = columns.map((c) => quoteIdent(c.column_name));
  const res = await client.query(`SELECT ${columnNames.join(', ')} FROM ${quoteIdent(tableName)}`);
  return res.rows;
}

async function backup() {
  await client.connect();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `supabase-backup-with-schema-${timestamp}.sql`);

  const tables = await listTables();
  const lines = [];
  lines.push('-- Respaldo con esquema y datos');
  lines.push(`-- Generado: ${new Date().toISOString()}`);
  lines.push('BEGIN;');
  lines.push('');

  for (const tableName of tables) {
    const columns = await getColumns(tableName);
    const constraints = await getConstraints(tableName);
    const indexes = await getIndexes(tableName);
    const sequenceColumns = await getSequenceColumns(tableName);

    lines.push(`-- Tabla: ${tableName}`);
    lines.push(`DROP TABLE IF EXISTS ${quoteIdent(tableName)} CASCADE;`);
    lines.push(`CREATE TABLE ${quoteIdent(tableName)} (\n  ${columns.map(buildColumnDefinition).join(',\n  ')}`);

    if (constraints.length > 0) {
      const constraintLines = constraints.map((constraint) => {
        const definition = constraint.definition;
        const normalized = definition.startsWith('CHECK') ? definition : `CONSTRAINT ${quoteIdent(constraint.conname)} ${definition}`;
        return `  ${normalized}`;
      });
      lines[lines.length - 1] += ',\n' + constraintLines.join(',\n');
    }

    lines[lines.length - 1] += '\n);';
    lines.push('');

    for (const seqInfo of sequenceColumns) {
      const defaultValue = seqInfo.column_default;
      const match = defaultValue.match(/nextval\('([^']+)'/);
      if (match) {
        const sequenceName = match[1];
        lines.push(`CREATE SEQUENCE IF NOT EXISTS ${quoteQualifiedName(sequenceName)};`);
      }
    }

    if (indexes.length > 0) {
      lines.push(...indexes.map((indexSql) => `${indexSql};`));
      lines.push('');
    }
  }

  for (const tableName of tables) {
    const columns = await getColumns(tableName);
    const rows = await getTableRows(tableName, columns);
    if (rows.length === 0) continue;

    lines.push(`-- Datos: ${tableName}`);
    const columnNames = columns.map((col) => quoteIdent(col.column_name));
    for (const row of rows) {
      const values = columnNames.map((columnName) => escapeValue(row[columnName.replace(/^"|"$/g, '')]));
      lines.push(`INSERT INTO ${quoteIdent(tableName)} (${columnNames.join(', ')}) VALUES (${values.join(', ')});`);
    }
    lines.push('');
  }

  for (const tableName of tables) {
    const sequenceColumns = await getSequenceColumns(tableName);
    for (const seqInfo of sequenceColumns) {
      const defaultValue = seqInfo.column_default;
      const match = defaultValue.match(/nextval\('([^']+)'/);
      if (match) {
        const sequenceName = match[1];
        const columnName = seqInfo.column_name;
        lines.push(`SELECT setval('${sequenceName}', COALESCE((SELECT MAX(${quoteIdent(columnName)}) FROM ${quoteIdent(tableName)}), 1), true);`);
      }
    }
  }

  lines.push('COMMIT;');
  fs.writeFileSync(backupFile, lines.join('\n'), 'utf8');
  fs.copyFileSync(backupFile, path.join(backupDir, 'restore-ready-with-schema.sql'));
  console.log(`Respaldo con esquema creado: ${backupFile}`);
  console.log(`Tablas incluidas: ${tables.length}`);
}

backup()
  .catch((err) => {
    console.error('Error al crear el respaldo con esquema:', err);
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });
