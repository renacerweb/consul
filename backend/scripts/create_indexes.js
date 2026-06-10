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
CREATE INDEX IF NOT EXISTS idx_vendedora_cedula ON "Vendedora"(cedula);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON "Usuario"(email);
`;

(async () => {
  try {
    await client.connect();
    console.log('Conectado a la base de datos — creando índices...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Índices creados (o ya existían)');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    console.error('Error al crear índices:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
