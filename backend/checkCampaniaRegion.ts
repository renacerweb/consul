import pool from './src/db';

(async () => {
  try {
    const res1 = await pool.query(`SELECT to_regclass('public."CampaniaRegion"') as exists`);
    console.log(res1.rows);
    if (!res1.rows[0].exists) {
      console.log('No existe CampaniaRegion, creando...');
      await pool.query(`CREATE TABLE IF NOT EXISTS "CampaniaRegion" (
        id SERIAL PRIMARY KEY,
        "campaniaId" INTEGER NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
        "regionId" INTEGER NOT NULL REFERENCES "Region"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("campaniaId", "regionId")
      )`);
      console.log('Tabla creada.');
      await pool.query(`INSERT INTO "CampaniaRegion" ("campaniaId", "regionId")
        SELECT c.id, c."regionId"
        FROM "Campania" c
        WHERE c."regionId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM "CampaniaRegion" cr
            WHERE cr."campaniaId" = c.id
              AND cr."regionId" = c."regionId"
          )`);
      console.log('Migración completada.');
    } else {
      console.log('La tabla CampaniaRegion ya existe.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
})();