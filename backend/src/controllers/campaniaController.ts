import { Request, Response } from 'express';
import pool from '../db';

async function ensureCampaniaTables() {
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
  await pool.query(`ALTER TABLE "Campania" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "VendedoraCampania" (
      id SERIAL PRIMARY KEY,
      "vendedoraId" INTEGER NOT NULL REFERENCES "Vendedora"(id) ON DELETE CASCADE,
      "campaniaId" INTEGER NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("vendedoraId", "campaniaId")
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "VendedoraCampaniaHistorial" (
      id SERIAL PRIMARY KEY,
      "vendedoraId" INTEGER NOT NULL REFERENCES "Vendedora"(id) ON DELETE CASCADE,
      "campaniaId" INTEGER NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
      accion TEXT NOT NULL DEFAULT 'ASIGNADA',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CampaniaRegion" (
      id SERIAL PRIMARY KEY,
      "campaniaId" INTEGER NOT NULL REFERENCES "Campania"(id) ON DELETE CASCADE,
      "regionId" INTEGER NOT NULL REFERENCES "Region"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("campaniaId", "regionId")
    )
  `);

  await pool.query(`
    INSERT INTO "CampaniaRegion" ("campaniaId", "regionId")
    SELECT c.id, c."regionId"
    FROM "Campania" c
    WHERE c."regionId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "CampaniaRegion" cr
        WHERE cr."campaniaId" = c.id
          AND cr."regionId" = c."regionId"
      )
  `);
}

export async function listarCampaniasController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const activoParam = req.query.activo;

    let query = `
      SELECT
        c.id,
        c.nombre,
        c.descripcion,
        c.activo,
        c."regionId",
        c."cantidadPrendas",
        c."tipoColeccion",
        c."fechaInicio",
        c."fechaFin",
        c.observaciones,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT r.id), NULL), ARRAY[]::int[]) AS regionIds,
        COALESCE(string_agg(DISTINCT r.nombre, ', ' ORDER BY r.nombre), '') AS region_nombre
      FROM "Campania" c
      LEFT JOIN "CampaniaRegion" cr ON cr."campaniaId" = c.id
      LEFT JOIN "Region" r ON cr."regionId" = r.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    let index = 1;

    if (activoParam !== undefined) {
      const activo = String(activoParam).toLowerCase() === 'true';
      conditions.push(`c.activo = $${index++}`);
      params.push(activo);
    }

    if (usuario?.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIds = regionesResult.rows.map((row: any) => row.regionId);
      if (regionIds.length > 0) {
        conditions.push(`cr."regionId" = ANY($${index++}::int[])`);
        params.push(regionIds);
      } else {
        return res.json([]);
      }
    } else if (usuario?.rol === 'GERENTE_ZONA') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIds = regionesResult.rows.map((row: any) => row.regionId);
      if (regionIds.length > 0) {
        conditions.push(`cr."regionId" = ANY($${index++}::int[])`);
        params.push(regionIds);
      } else {
        return res.json([]);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.id';
    query += ' ORDER BY c.id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar campañas:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarHistorialCampaniasController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const campaniaIdParam = req.query.campaniaId;

    let query = `
      SELECT
        sub.id,
        sub."vendedoraId",
        sub."vendedoraNombre",
        sub.cedula,
        sub."gerenteZonaId",
        sub."gerenteZonaNombre",
        sub."campaniaId",
        sub."campaniaNombre",
        sub."campaniaDescripcion",
        sub.accion,
        sub."createdAt"
      FROM (
        SELECT
          h.id,
          h."vendedoraId",
          v.nombre AS "vendedoraNombre",
          v.cedula,
          v."gerenteZonaId",
          gz.nombre AS "gerenteZonaNombre",
          h."campaniaId",
          c.nombre AS "campaniaNombre",
          c.descripcion AS "campaniaDescripcion",
          h.accion,
          h."createdAt",
          ROW_NUMBER() OVER (PARTITION BY h."vendedoraId", h."campaniaId" ORDER BY h."createdAt" DESC) AS rn,
          v."regionId" AS "regionId"
        FROM "VendedoraCampaniaHistorial" h
        JOIN "Vendedora" v ON v.id = h."vendedoraId"
        LEFT JOIN "Usuario" gz ON gz.id = v."gerenteZonaId"
        LEFT JOIN "Campania" c ON c.id = h."campaniaId"
      ) sub
      WHERE sub.rn = 1 AND sub.accion = 'FINALIZADA'
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    let index = 1;

    if (usuario?.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIds = regionesResult.rows.map((row: any) => row.regionId);
      if (regionIds.length === 0) {
        return res.json([]);
      }
      conditions.push(`sub."regionId" = ANY($${index++}::int[])`);
      params.push(regionIds);
    } else if (usuario?.rol === 'GERENTE_ZONA') {
      // Gerente de zona debe ver el historial de SUS vendedoras
      conditions.push(`sub."gerenteZonaId" = $${index++}`);
      params.push(usuario.id);
    } else if (usuario?.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para ver el historial de campañas' });
    }

    // Filtrar por campaña específica si se pasa campaniaId en query
    if (campaniaIdParam) {
      const campaniaId = Number(campaniaIdParam);
      if (!isNaN(campaniaId)) {
        conditions.push(`sub."campaniaId" = $${index++}`);
        params.push(campaniaId);
      }
    }

    // Filtrar por vendedora específica si se pasa vendedoraId en query
    const vendedoraIdParam = req.query.vendedoraId;
    if (vendedoraIdParam) {
      const vendedoraId = Number(vendedoraIdParam);
      if (!isNaN(vendedoraId)) {
        conditions.push(`sub."vendedoraId" = $${index++}`);
        params.push(vendedoraId);
      }
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sub."gerenteZonaNombre" NULLS LAST, sub."campaniaNombre", sub."vendedoraNombre"';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar historial de campañas:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function crearCampaniaController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const { nombre, descripcion, activo = true, regionIds, cantidadPrendas, tipoColeccion, fechaInicio, fechaFin, observaciones } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'El nombre de la campaña es obligatorio' });
    }

    const selectedRegionIds = Array.isArray(regionIds)
      ? regionIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
      : [];

    if (selectedRegionIds.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos una región' });
    }

    if (usuario?.rol === 'GERENTE_REGIONAL') {
      const regionesPermitidas = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIdsPermitidos = regionesPermitidas.rows.map((row: any) => row.regionId);
      if (!selectedRegionIds.every((id: number) => regionIdsPermitidos.includes(id))) {
        return res.status(403).json({ error: 'No tienes permiso para crear campañas en una o más regiones seleccionadas' });
      }
    } else if (usuario?.rol === 'ADMIN') {
      // Admin puede crear campañas en cualquier región
    } else {
      return res.status(403).json({ error: 'No tienes permiso para crear campañas' });
    }

    const cantidadPrendasValue = cantidadPrendas === '' || cantidadPrendas === null || cantidadPrendas === undefined ? null : Number(cantidadPrendas);
    const tipoColeccionValue = tipoColeccion && String(tipoColeccion).trim() ? String(tipoColeccion).trim() : null;
    const fechaInicioValue = fechaInicio && String(fechaInicio).trim() ? String(fechaInicio).trim() : null;
    const fechaFinValue = fechaFin && String(fechaFin).trim() ? String(fechaFin).trim() : null;
    const observacionesValue = observaciones && String(observaciones).trim() ? String(observaciones).trim() : null;

    const primaryRegionId = selectedRegionIds[0];

    const insertResult = await pool.query(
      `INSERT INTO "Campania" (nombre, descripcion, activo, "regionId", "cantidadPrendas", "tipoColeccion", "fechaInicio", "fechaFin", observaciones) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [String(nombre).trim(), descripcion ? String(descripcion).trim() : null, activo !== false, primaryRegionId, cantidadPrendasValue, tipoColeccionValue, fechaInicioValue, fechaFinValue, observacionesValue]
    );

    const campaniaId = insertResult.rows[0].id;
    const regionValues = selectedRegionIds.map((id: number, index: number) => `($1, $${index + 2})`).join(', ');
    await pool.query(
      `INSERT INTO "CampaniaRegion" ("campaniaId", "regionId") VALUES ${regionValues}`,
      [campaniaId, ...selectedRegionIds]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error: any) {
    console.error('Error al crear campaña:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function actualizarCampaniaController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const campaniaId = Number(req.params.id);
    const { nombre, descripcion, activo, cantidadPrendas, tipoColeccion, fechaInicio, fechaFin, observaciones, regionIds } = req.body;

    const campaniaResult = await pool.query(`SELECT * FROM "Campania" WHERE id = $1`, [campaniaId]);
    if (campaniaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const campania = campaniaResult.rows[0];

    if (usuario?.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIds = regionesResult.rows.map((row: any) => row.regionId);
      if (!regionIds.includes(campania.regionId)) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta campaña' });
      }
    } else if (usuario?.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para modificar campañas' });
    }

    const updates: string[] = [];
    const params: any[] = [];
    let index = 1;

    if (nombre !== undefined) {
      updates.push(`nombre = $${index++}`);
      params.push(String(nombre).trim());
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${index++}`);
      params.push(descripcion ? String(descripcion).trim() : null);
    }
    if (activo !== undefined) {
      updates.push(`activo = $${index++}`);
      params.push(Boolean(activo));
    }
    if (cantidadPrendas !== undefined) {
      updates.push(`"cantidadPrendas" = $${index++}`);
      params.push(cantidadPrendas === '' || cantidadPrendas === null ? null : Number(cantidadPrendas));
    }
    if (tipoColeccion !== undefined) {
      updates.push(`"tipoColeccion" = $${index++}`);
      params.push(tipoColeccion && String(tipoColeccion).trim() ? String(tipoColeccion).trim() : null);
    }
    if (fechaInicio !== undefined) {
      updates.push(`"fechaInicio" = $${index++}`);
      params.push(fechaInicio && String(fechaInicio).trim() ? String(fechaInicio).trim() : null);
    }
    if (fechaFin !== undefined) {
      updates.push(`"fechaFin" = $${index++}`);
      params.push(fechaFin && String(fechaFin).trim() ? String(fechaFin).trim() : null);
    }
    if (observaciones !== undefined) {
      updates.push(`observaciones = $${index++}`);
      params.push(observaciones && String(observaciones).trim() ? String(observaciones).trim() : null);
    }
    const selectedRegionIds = Array.isArray(regionIds)
      ? regionIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id))
      : undefined;
    if (selectedRegionIds !== undefined) {
      if (selectedRegionIds.length === 0) {
        return res.status(400).json({ error: 'Debes seleccionar al menos una región' });
      }
      updates.push(`"regionId" = $${index++}`);
      params.push(selectedRegionIds[0]);
    }

    const cambiarActivo = activo !== undefined && campania.activo === true && Boolean(activo) === false;

    if (updates.length === 0) {
      if (cambiarActivo) {
        const asignadasResult = await pool.query(
          `SELECT "vendedoraId" FROM "VendedoraCampania" WHERE "campaniaId" = $1`,
          [campaniaId]
        );

        if (asignadasResult.rows.length > 0) {
          const historialValues = asignadasResult.rows
            .map((row: any, index: number) => `($${index + 2}, $1, 'FINALIZADA')`)
            .join(', ');

          await pool.query(
            `INSERT INTO "VendedoraCampaniaHistorial" ("vendedoraId", "campaniaId", accion) VALUES ${historialValues}`,
            [campaniaId, ...asignadasResult.rows.map((row: any) => row.vendedoraId)]
          );
        }
      }
      return res.json(campania);
    }

    if (cambiarActivo) {
      const asignadasResult = await pool.query(
        `SELECT "vendedoraId" FROM "VendedoraCampania" WHERE "campaniaId" = $1`,
        [campaniaId]
      );

      if (asignadasResult.rows.length > 0) {
        const historialValues = asignadasResult.rows
          .map((row: any, index: number) => `($${index + 2}, $1, 'FINALIZADA')`)
          .join(', ');

        await pool.query(
          `INSERT INTO "VendedoraCampaniaHistorial" ("vendedoraId", "campaniaId", accion) VALUES ${historialValues}`,
          [campaniaId, ...asignadasResult.rows.map((row: any) => row.vendedoraId)]
        );
      }
    }

    params.push(campaniaId);
    const result = await pool.query(
      `UPDATE "Campania" SET ${updates.join(', ')} , "updatedAt" = CURRENT_TIMESTAMP WHERE id = $${index} RETURNING *`,
      params
    );

    if (selectedRegionIds !== undefined) {
      await pool.query(`DELETE FROM "CampaniaRegion" WHERE "campaniaId" = $1`, [campaniaId]);
      if (selectedRegionIds.length > 0) {
        const regionValues = selectedRegionIds.map((id: number, idx: number) => `($1, $${idx + 2})`).join(', ');
        await pool.query(
          `INSERT INTO "CampaniaRegion" ("campaniaId", "regionId") VALUES ${regionValues}`,
          [campaniaId, ...selectedRegionIds]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al actualizar campaña:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarCampaniasDeVendedoraController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const vendedoraId = Number(req.params.id);
    const vendedoraResult = await pool.query(
      `SELECT "regionId" FROM "Vendedora" WHERE id = $1`,
      [vendedoraId]
    );

    if (vendedoraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    const regionId = vendedoraResult.rows[0].regionId;
    if (!regionId) {
      return res.json([]);
    }

    const result = await pool.query(
      `
        SELECT
          c.id,
          c.nombre,
          c.descripcion,
          c.activo,
          c."regionId",
          MAX(CASE WHEN vc."vendedoraId" IS NOT NULL THEN 1 ELSE 0 END) = 1 AS asignada
        FROM "Campania" c
        LEFT JOIN "CampaniaRegion" cr ON cr."campaniaId" = c.id
        LEFT JOIN "VendedoraCampania" vc
          ON vc."campaniaId" = c.id AND vc."vendedoraId" = $1
        WHERE c.activo = true AND cr."regionId" = $2
        GROUP BY c.id
        ORDER BY c.id DESC
      `,
      [vendedoraId, regionId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar campañas de vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarParticipantesPorCampaniaController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const campaniaId = Number(req.params.id);
    if (isNaN(campaniaId)) return res.status(400).json({ error: 'campaniaId inválido' });
    let query = `SELECT v.id, v.nombre, v.cedula, v.reputacion, v."gerenteZonaId", gz.nombre as "gerenteZonaNombre", v."regionId"
                 FROM "Vendedora" v
                 JOIN "VendedoraCampania" vc ON vc."vendedoraId" = v.id
                 LEFT JOIN "Usuario" gz ON gz.id = v."gerenteZonaId"
                 WHERE vc."campaniaId" = $1`;
    const params: any[] = [campaniaId];

    if (usuario?.rol === 'GERENTE_ZONA') {
      // Filtrar solo las vendedoras que pertenecen al gerente de zona
      query += ` AND v."gerenteZonaId" = $${params.length + 1}`;
      params.push(usuario.id);
    }

    query += ` ORDER BY gz.nombre NULLS LAST, v.nombre`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar participantes de campaña:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarCampaniaController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const campaniaId = Number(req.params.id);

    const campaniaResult = await pool.query(`SELECT * FROM "Campania" WHERE id = $1`, [campaniaId]);
    if (campaniaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaña no encontrada' });
    }

    const campania = campaniaResult.rows[0];

    if (usuario?.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIds = regionesResult.rows.map((row: any) => row.regionId);
      if (!regionIds.includes(campania.regionId)) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar esta campaña' });
      }
    } else if (usuario?.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar campañas' });
    }

    await pool.query(`DELETE FROM "Campania" WHERE id = $1`, [campaniaId]);
    res.json({ mensaje: 'Campaña eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar campaña:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function asignarCampaniasAVendedoraController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;
    const vendedoraId = Number(req.params.id);
    const { campaniaIds = [] } = req.body;

    const vendedoraResult = await pool.query(
      `SELECT "regionId", "creadaPorId", "gerenteZonaId" FROM "Vendedora" WHERE id = $1`,
      [vendedoraId]
    );

    if (vendedoraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    const vendedora = vendedoraResult.rows[0];
    let puedeEditar = false;

    if (usuario?.rol === 'ADMIN') {
      puedeEditar = true;
    } else if (usuario?.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionesPermitidas = regionesResult.rows.map((row: any) => row.regionId);
      puedeEditar = regionesPermitidas.includes(vendedora.regionId);
    } else if (usuario?.rol === 'GERENTE_ZONA') {
      puedeEditar = vendedora.creadaPorId === usuario.id || vendedora.gerenteZonaId === usuario.id;
    }

    if (!puedeEditar) {
      return res.status(403).json({ error: 'No tienes permiso para modificar las campañas de esta vendedora' });
    }

    await pool.query(`DELETE FROM "VendedoraCampania" WHERE "vendedoraId" = $1`, [vendedoraId]);

    if (Array.isArray(campaniaIds) && campaniaIds.length > 0) {
      const values = campaniaIds.map((campaniaId: any, index: number) => `($1, $${index + 2})`).join(', ');
      await pool.query(
        `INSERT INTO "VendedoraCampania" ("vendedoraId", "campaniaId") VALUES ${values}`,
        [vendedoraId, ...campaniaIds]
      );

      const historialValues = campaniaIds.map((campaniaId: any, index: number) => `($1, $${index + 2}, 'ASIGNADA')`).join(', ');
      await pool.query(
        `INSERT INTO "VendedoraCampaniaHistorial" ("vendedoraId", "campaniaId", accion) VALUES ${historialValues}`,
        [vendedoraId, ...campaniaIds]
      );
    }

    res.json({ mensaje: 'Campañas actualizadas correctamente' });
  } catch (error: any) {
    console.error('Error al asignar campañas a vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarParticipacionesPorGerenteController(req: Request, res: Response) {
  try {
    await ensureCampaniaTables();
    const usuario = (req as any).usuario;

    // Solo usuarios autenticados
    if (!usuario) return res.status(401).json({ error: 'No autenticado' });

    // Construir consulta: vendedoras creadas por el gerente o asignadas a su gerencia
    const params: any[] = [];
    let whereClause = '';

    if (usuario.rol === 'GERENTE_ZONA') {
      whereClause = `WHERE v."creadaPorId" = $1 OR v."gerenteZonaId" = $1`;
      params.push(usuario.id);
    } else if (usuario.rol === 'GERENTE_REGIONAL') {
      // Gerente regional: devolver vendedoras en sus regiones
      const regionesResult = await pool.query(`SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`, [usuario.id]);
      const regionIds = regionesResult.rows.map((r: any) => r.regionId);
      if (regionIds.length === 0) return res.json([]);
      whereClause = `WHERE v."regionId" = ANY($1::int[])`;
      params.push(regionIds);
    } else if (usuario.rol === 'ADMIN') {
      whereClause = '';
    } else {
      return res.status(403).json({ error: 'No tienes permiso para ver estas participaciones' });
    }

    const query = `
      SELECT
        v.id,
        v.nombre,
        v.cedula,
        v."regionId",
        COUNT(DISTINCT vc."campaniaId") AS participaciones,
        MAX(h."createdAt") AS ultima_participacion
      FROM "Vendedora" v
      LEFT JOIN "VendedoraCampania" vc ON vc."vendedoraId" = v.id
      LEFT JOIN "VendedoraCampaniaHistorial" h ON h."vendedoraId" = v.id
      ${whereClause}
      GROUP BY v.id
      ORDER BY participaciones DESC, v.nombre
    `;

    const result = await pool.query(query, params);
    res.json(result.rows.map((r: any) => ({
      ...r,
      participaciones: Number(r.participaciones || 0),
      ultima_participacion: r.ultima_participacion || null,
    })));
  } catch (error: any) {
    console.error('Error al listar participaciones por gerente:', error);
    res.status(500).json({ error: error.message });
  }
}
