const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cs = process.env.DATABASE_URL || '';
if (!cs) {
  console.error('ERROR: DATABASE_URL not found in .env');
  process.exit(2);
}

// Mask credentials for logging
const masked = cs.replace(/:[^:@]+@/, ':***@');
console.log('DATABASE_URL (masked):', masked);

const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await client.connect();
    const now = await client.query('SELECT NOW() AS now, current_database() AS db');
    const tables = await client.query("SELECT COUNT(*)::int AS tables FROM information_schema.tables WHERE table_schema='public'");
    console.log('Connection successful');
    console.log('Database:', now.rows[0].db);
    console.log('Server time:', now.rows[0].now);
    console.log('Public tables count:', tables.rows[0].tables);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err.message || err);
    try { await client.end(); } catch (_) {}
    process.exit(3);
  }
})();
