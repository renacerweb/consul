const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const email = process.argv[2];
if (!email) {
  console.error('Uso: node scripts/show-user.js email');
  process.exit(2);
}

(async () => {
  try {
    const res = await pool.query(`SELECT * FROM "Usuario" WHERE LOWER(email)=LOWER($1)`, [email]);
    if (res.rows.length === 0) {
      console.error('Usuario no encontrado:', email);
      process.exit(3);
    }
    console.log('Usuario:', res.rows[0]);
    await pool.end();
  } catch (err) {
    console.error('Error al consultar Usuario:', err.message || err);
    process.exit(1);
  }
})();
