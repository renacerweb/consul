#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL no está definida.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT tablename, indexname, indexdef
       FROM pg_indexes
       WHERE tablename IN ('Vendedora', 'Usuario')
       ORDER BY tablename, indexname`
    );

    if (res.rows.length === 0) {
      console.log('No se encontraron índices para Vendedora/Usuario.');
    } else {
      console.log('Índices encontrados:');
      res.rows.forEach(r => {
        console.log(`- ${r.tablename} :: ${r.indexname} -> ${r.indexdef}`);
      });
    }
  } catch (err) {
    console.error('Error comprobando índices:', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
