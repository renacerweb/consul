const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const res = await pool.query(`SELECT id, ip, tipo, detalle, fecha FROM "IntentoFallido" WHERE tipo='login' ORDER BY fecha DESC LIMIT 20`);
    console.log('Últimos intentos fallidos (login):', res.rows.length);
    for (const r of res.rows) {
      console.log(r);
    }
    await pool.end();
  } catch (err) {
    console.error('Error al consultar IntentoFallido:', err.message || err);
    process.exit(1);
  }
})();
