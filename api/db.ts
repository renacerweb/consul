// api/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Máximo de conexiones
  idleTimeoutMillis: 30000,   // Cerrar conexiones inactivas después de 30 segundos
  connectionTimeoutMillis: 2000,
});

export default pool;