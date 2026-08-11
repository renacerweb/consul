const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, '../sql/create_contacto_mensaje_table.sql'), 'utf8');
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration error', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
