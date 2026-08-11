const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    const result = await pool.query("SELECT m.id, m.titulo, m.contenido, m.leido, m.\"destinatarioId\", m.\"paraTodosGerentes\", m.\"remitenteId\", m.\"createdAt\", u.nombre as remitenteNombre FROM \"Mensaje\" m LEFT JOIN \"Usuario\" u ON m.\"remitenteId\" = u.id ORDER BY m.\"createdAt\" DESC LIMIT 20");
    console.log('messages', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));
    const result2 = await pool.query("SELECT id, nombre, email, rol FROM \"Usuario\" WHERE rol IN ('GERENTE_REGIONAL','GERENTE_ZONA') ORDER BY id LIMIT 20");
    console.log('users', result2.rows.length);
    console.log(JSON.stringify(result2.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
