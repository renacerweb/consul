const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const res = await pool.query(`SELECT id, email, nombre, rol, activo FROM "Usuario" ORDER BY id LIMIT 100`);
    console.log(`Usuarios encontrados: ${res.rows.length}`);
    for (const r of res.rows) {
      console.log(r);
    }
    await pool.end();
  } catch (err) {
    console.error('Error al listar usuarios:', err.message || err);
    process.exit(1);
  }
})();
