const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const email = process.argv[2];
const newPass = process.argv[3] || 'TempPass123!';

if (!email) {
  console.error('Uso: node scripts/reset-password.js email [newPassword]');
  process.exit(2);
}

(async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPass, salt);
    const res = await pool.query('UPDATE "Usuario" SET password = $1 WHERE LOWER(email) = LOWER($2) RETURNING id, email', [hash, email]);
    if (res.rows.length === 0) {
      console.error('No se encontró el usuario:', email);
      process.exit(3);
    }
    console.log('Contraseña restablecida para:', res.rows[0].email, 'Nueva contraseña:', newPass);
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
