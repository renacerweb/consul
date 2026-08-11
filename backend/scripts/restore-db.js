const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Uso: node scripts/restore-db.js <archivo.sql>');
  process.exit(1);
}

const absoluteBackupFile = path.resolve(backupFile);
if (!fs.existsSync(absoluteBackupFile)) {
  console.error(`No se encontró el archivo: ${absoluteBackupFile}`);
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function restore() {
  const sql = fs.readFileSync(absoluteBackupFile, 'utf8');
  await client.connect();
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`Restauración completada desde: ${absoluteBackupFile}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    await client.end();
  }
}

restore().catch((err) => {
  console.error('Error al restaurar:', err);
  process.exit(1);
});
