// Script de utilidad para crear tablas de Campania y VendedoraCampania
// Ejecuta las mismas consultas que ensureCampaniaTables() del controlador.
const pool = require('../dist/db').default || require('../dist/db');

(async () => {
  try {
    console.log('Conectando a la base de datos...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Campania" (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        activo BOOLEAN NOT NULL DEFAULT true,
        "regionId" INTEGER,
        "cantidadPrendas" INTEGER,
        "tipoColeccion" TEXT,
        "fechaInicio" DATE,
        "fechaFin" DATE,
        observaciones TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`ALTER TABLE "Campania" ADD COLUMN IF NOT EXISTS "cantidadPrendas" INTEGER`);
    await pool.query(`ALTER TABLE "Campania" ADD COLUMN IF NOT EXISTS "tipoColeccion" TEXT`);
    await pool.query(`ALTER TABLE "Campania" ADD COLUMN IF NOT EXISTS "fechaInicio" DATE`);
    await pool.query(`ALTER TABLE "Campania" ADD COLUMN IF NOT EXISTS "fechaFin" DATE`);
    await pool.query(`ALTER TABLE "Campania" ADD COLUMN IF NOT EXISTS observaciones TEXT`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "VendedoraCampania" (
        id SERIAL PRIMARY KEY,
        "vendedoraId" INTEGER NOT NULL REFERENCES "Vendedora"(id) ON DELETE CASCADE,
        "campaniaId" INTEGER NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE ("vendedoraId", "campaniaId")
      )
    `);

    console.log('Tablas "Campania" y "VendedoraCampania" creadas o verificadas correctamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando script:', err.message || err);
    process.exit(1);
  }
})();
