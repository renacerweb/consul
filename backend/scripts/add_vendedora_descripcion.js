#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL no está definida. Carga backend/.env o exporta la variable.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const sql = `
ALTER TABLE "Vendedora"
ADD COLUMN IF NOT EXISTS descripcion TEXT;
`;

(async () => {
  try {
    await client.connect();
    console.log('Conectado a la base de datos — aplicando columna descripcion...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Columna descripcion creada en Vendedora (o ya existía)');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    console.error('Error al crear columna descripcion:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
