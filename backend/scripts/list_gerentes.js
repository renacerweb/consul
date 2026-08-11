const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    const result = await pool.query('SELECT id, email, nombre, rol, "regionId", activo FROM "Usuario" WHERE rol IN (\'GERENTE_REGIONAL\', \'GERENTE_ZONA\') ORDER BY rol, id LIMIT 50');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
})();
