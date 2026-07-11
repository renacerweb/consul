import { Request, Response } from 'express';
import pool from '../db';

async function ensureColeccionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Coleccion" (
      id SERIAL PRIMARY KEY,
      "campaniaId" INTEGER NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
      "gerenteZonaId" INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
      cantidad INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("campaniaId", "gerenteZonaId")
    )
  `);
}

export async function listarGerentesZonaParaColeccionesController(req: Request, res: Response) {
  try {
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT u.id, u.nombre, u.email,
             (
               SELECT STRING_AGG(DISTINCT r.nombre, ', ')
               FROM "UsuarioRegion" ur
               JOIN "Region" r ON ur."regionId" = r.id
               WHERE ur."usuarioId" = u.id
             ) as region
      FROM "Usuario" u
      WHERE u.rol = 'GERENTE_ZONA' AND u.activo = true
    `;
    const params: any[] = [];

    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuarioAuth.id]
      );
      const regionIds = regionesResult.rows.map((r: any) => r.regionId);
      if (regionIds.length > 0) {
        query += ` AND EXISTS (
          SELECT 1 FROM "UsuarioRegion" ur2
          WHERE ur2."usuarioId" = u.id AND ur2."regionId" = ANY($1::int[])
        )`;
        params.push(regionIds);
      } else {
        return res.json([]);
      }
    } else if (usuarioAuth.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para ver gerentes de zona' });
    }

    query += ` ORDER BY u.nombre`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar gerentes zona para colecciones:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarColeccionesPorCampaniaController(req: Request, res: Response) {
  try {
    await ensureColeccionTables();
    const campaniaId = Number(req.params.campaniaId);
    if (isNaN(campaniaId)) {
      return res.status(400).json({ error: 'campaniaId inválido' });
    }

    const result = await pool.query(
      `SELECT c.id, c.cantidad, c."campaniaId", c."gerenteZonaId",
              gz.nombre AS "gerenteZonaNombre",
              gz.email AS "gerenteZonaEmail"
       FROM "Coleccion" c
       JOIN "Usuario" gz ON gz.id = c."gerenteZonaId"
       WHERE c."campaniaId" = $1
       ORDER BY gz.nombre`,
      [campaniaId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar colecciones por campaña:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarColeccionesComparacionController(req: Request, res: Response) {
  try {
    await ensureColeccionTables();

    const result = await pool.query(
      `SELECT c.id, c.cantidad, c."campaniaId", c."gerenteZonaId",
              gz.nombre AS "gerenteZonaNombre",
              gz.email AS "gerenteZonaEmail",
              campania.nombre AS "campaniaNombre",
              campania.descripcion AS "campaniaDescripcion"
       FROM "Coleccion" c
       JOIN "Usuario" gz ON gz.id = c."gerenteZonaId"
       JOIN "Campania" campania ON campania.id = c."campaniaId"
       ORDER BY campania.nombre, gz.nombre`
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar colecciones comparacion:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function guardarColeccionesController(req: Request, res: Response) {
  try {
    await ensureColeccionTables();
    const usuarioAuth = (req as any).usuario;
    const { campaniaId, valores } = req.body;

    if (!campaniaId || !Array.isArray(valores)) {
      return res.status(400).json({ error: 'campaniaId y valores son requeridos' });
    }

    const campaniaResult = await pool.query(
      `SELECT id FROM "Campania" WHERE id = $1`,
      [campaniaId]
    );
    if (campaniaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    let allowedGerentes: number[] = [];
    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuarioAuth.id]
      );
      const regionIds = regionesResult.rows.map((r: any) => r.regionId);
      if (regionIds.length > 0) {
        const gerentesResult = await pool.query(
          `SELECT DISTINCT u.id
           FROM "Usuario" u
           JOIN "UsuarioRegion" ur ON ur."usuarioId" = u.id
           WHERE u.rol = 'GERENTE_ZONA' AND u.activo = true AND ur."regionId" = ANY($1::int[])`,
          [regionIds]
        );
        allowedGerentes = gerentesResult.rows.map((r: any) => r.id);
      }
    }

    if (usuarioAuth.rol === 'GERENTE_REGIONAL' && allowedGerentes.length === 0) {
      return res.status(403).json({ error: 'No tienes gerentes de zona permitidos para esta acción' });
    }

    const valuesToUpsert: Array<{ gerenteZonaId: number; cantidad: number }> = valores
      .map((item: any) => ({
        gerenteZonaId: Number(item.gerenteZonaId),
        cantidad: Number(item.cantidad)
      }))
      .filter((item) => !isNaN(item.gerenteZonaId) && !isNaN(item.cantidad) && item.cantidad >= 0);

    if (valuesToUpsert.length === 0) {
      return res.status(400).json({ error: 'Debes enviar al menos un valor válido' });
    }

    const queries: string[] = [];
    const params: any[] = [];
    valuesToUpsert.forEach((item, index) => {
      if (usuarioAuth.rol === 'GERENTE_REGIONAL' && !allowedGerentes.includes(item.gerenteZonaId)) {
        throw new Error('Uno o más gerentes de zona no están en tus regiones');
      }
      const baseIndex = index * 3;
      queries.push(`($1, $${baseIndex + 2}, $${baseIndex + 3})`);
      params.push(item.gerenteZonaId, item.cantidad);
    });

    const insertParams = [campaniaId, ...params];
    const insertValues = valuesToUpsert
      .map((item, index) => `($1, $${index * 2 + 2}, $${index * 2 + 3})`)
      .join(', ');

    await pool.query(
      `INSERT INTO "Coleccion" ("campaniaId", "gerenteZonaId", cantidad)
       VALUES ${insertValues}
       ON CONFLICT ("campaniaId", "gerenteZonaId") DO UPDATE
         SET cantidad = EXCLUDED.cantidad,
             "updatedAt" = CURRENT_TIMESTAMP`,
      insertParams
    );

    res.json({ mensaje: 'Colecciones guardadas correctamente' });
  } catch (error: any) {
    console.error('Error al guardar colecciones:', error);
    res.status(500).json({ error: error.message });
  }
}
