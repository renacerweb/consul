import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

console.log('DB - DATABASE_URL cargada:', DATABASE_URL ? '✅ Sí' : '❌ No');

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL no está definida');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  console.log('✅ Conexión a Supabase establecida');
});

pool.on('error', (err) => {
  console.error('❌ Error de conexión:', err.message);
});

// Por defecto, mantener la DB viva cada 5 minutos (útil en entornos serverless).
// Puedes sobrescribir con la variable de entorno DB_KEEPALIVE_INTERVAL_MINUTES.
const keepAliveIntervalMinutes = parseInt(process.env.DB_KEEPALIVE_INTERVAL_MINUTES || '5', 10);
const keepAliveKey = Symbol.for('backend.db.keepaliveStarted');

if (!(globalThis as any)[keepAliveKey]) {
  if (keepAliveIntervalMinutes > 0) {
    const keepAliveMs = keepAliveIntervalMinutes * 60 * 1000;

    const keepAlive = async () => {
      try {
        await pool.query('SELECT 1');
        console.log(`🟢 DB keepalive ejecutada cada ${keepAliveIntervalMinutes} min`);
      } catch (error) {
        console.error('❌ DB keepalive error:', (error as Error).message || error);
      }
    };

    keepAlive();
    setInterval(keepAlive, keepAliveMs);
  }

  (globalThis as any)[keepAliveKey] = true;
}

export default pool;