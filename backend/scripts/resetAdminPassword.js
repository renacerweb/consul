const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    const res = await pool.query('UPDATE "Usuario" SET password = $1 WHERE email = $2 RETURNING id, email', [hash, 'admin@renacer.com']);
    console.log('Updated:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message || err);
  } finally {
    await pool.end();
  }
})();
