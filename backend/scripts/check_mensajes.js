const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const r = await pool.query('SELECT "id","titulo","contenido","paraTodosGerentes","createdAt" FROM "Mensaje" ORDER BY "createdAt" DESC LIMIT 10');
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (err) {
    console.error('ERROR', err.message || err);
  } finally {
    await pool.end();
  }
})();
