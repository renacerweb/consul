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

export default pool;