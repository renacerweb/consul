import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde .env
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('========================================');
console.log('🔍 [db.ts] Configuración:');
console.log('  Ruta .env:', envPath);
console.log('  .env cargado:', result.error ? '❌ Error' : '✅ OK');
console.log('  DATABASE_URL:', DATABASE_URL ? '✅ Configurada' : '❌ No configurada');
if (DATABASE_URL) {
  console.log('  Puerto:', DATABASE_URL.includes(':6543') ? '6543 (Pooler)' : '5432 (Directo)');
}
console.log('========================================');

// Si no hay DATABASE_URL, mostrar error pero no detener (para debugging)
if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no está definida en .env');
  console.error('   El servidor se iniciará sin conexión a BD');
  // No hacemos process.exit(1) para poder debuggear
}

// Crear pool solo si hay URL
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}) : null;

if (pool) {
  pool.on('connect', () => {
    console.log('✅ Conexión a Supabase establecida correctamente');
  });

  pool.on('error', (err) => {
    console.error('❌ Error de conexión a la base de datos:', err.message);
  });
}

export default pool;