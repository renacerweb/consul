// api/controllers/vendedoraController.ts
import { Request, Response } from 'express';
import pool from '../db';

const normalizeReputacion = (value?: string) => {
  const reputacion = value?.toString().trim().toUpperCase();
  if (!reputacion) return 'BUENA';
  if (reputacion === 'ACTIVA') return 'BUENA';
  return reputacion;
};

export async function listarVendedorasController(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;

    let query = `
      SELECT 
        v.*,
        r.nombre as region_nombre,
        u.nombre as creada_por_nombre,
        gz.nombre as gerente_zona_nombre
      FROM "Vendedora" v
      LEFT JOIN "Region" r ON v."regionId" = r.id
      LEFT JOIN "Usuario" u ON v."creadaPorId" = u.id
      LEFT JOIN "Usuario" gz ON v."gerenteZonaId" = gz.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (usuario.rol === 'GERENTE_REGIONAL') {
      conditions.push(`v."regionId" = $${params.length + 1}`);
      params.push(usuario.regionId);
    }
    else if (usuario.rol === 'GERENTE_ZONA') {
      conditions.push(`v."creadaPorId" = $${params.length + 1}`);
      params.push(usuario.id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY v.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar vendedoras:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function buscarVendedoraController(req: Request, res: Response) {
  const cedula = req.params.cedula as string;
  const usuario = (req as any).usuario;

  try {
    const vendedoraResult = await pool.query(
      `SELECT v.*, r.nombre as region_nombre
       FROM "Vendedora" v
       LEFT JOIN "Region" r ON v."regionId" = r.id
       WHERE v.cedula = $1`,
      [cedula]
    );

    const exitosa = vendedoraResult.rows.length > 0;
    const vendedora = exitosa ? vendedoraResult.rows[0] : null;

    let historial = [];
    if (exitosa && vendedora.id) {
      const historialResult = await pool.query(
        `SELECT h.*, u.nombre as gerente_zona_nombre
         FROM "HistorialVendedora" h
         LEFT JOIN "Usuario" u ON h."gerenteZonaId" = u.id
         WHERE h."vendedoraId" = $1
         ORDER BY h."fechaReporte" DESC`,
        [vendedora.id]
      );
      historial = historialResult.rows;
    }

    if (!exitosa) {
      return res.status(404).json({ mensaje: 'Vendedora no encontrada' });
    }

    res.json({
      ...vendedora,
      historial: historial.map(h => ({
        gerenteZonaNombre: h.gerente_zona_nombre,
        reputacion: h.reputacion,
        fechaReporte: h.fechaReporte
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function crearVendedoraController(req: Request, res: Response) {
  try {
    const { nombre, cedula, reputacion, telefono, direccion, gerenteZonaId } = req.body;
    const usuario = (req as any).usuario;
    const reputacionUpper = reputacion?.toString().toUpperCase();
    const reputacionNormalizada = normalizeReputacion(reputacionUpper);
    const reputacionesGerenteZona = ['BUENA', 'ACTIVA', 'OBSERVADA', 'RESTRINGIDA'];

    if (usuario.rol === 'GERENTE_ZONA') {
      if (!reputacionUpper || !reputacionesGerenteZona.includes(reputacionUpper)) {
        return res.status(403).json({ error: 'Solo puedes asignar ACTIVA, OBSERVADA o RESTRINGIDA como reputación' });
      }
    }

    let regionId = null;
    let creadaPorId = usuario.id;
    let finalGerenteZonaId = gerenteZonaId || null;

    if (usuario.rol === 'GERENTE_REGIONAL') {
      regionId = usuario.regionId;
    } 
    else if (usuario.rol === 'GERENTE_ZONA') {
      regionId = usuario.regionId;
      finalGerenteZonaId = usuario.id;
    }
    else if (usuario.rol === 'ADMIN') {
      if (!req.body.regionId) {
        return res.status(400).json({ error: 'Debes seleccionar una región' });
      }
      regionId = req.body.regionId;
    }

    if (!regionId) {
      return res.status(400).json({ error: 'No se pudo determinar la región' });
    }

    const result = await pool.query(
      `INSERT INTO "Vendedora" (nombre, cedula, reputacion, telefono, direccion, "regionId", "creadaPorId", "gerenteZonaId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nombre, cedula, reputacionNormalizada, telefono || null, direccion || null, regionId, creadaPorId, finalGerenteZonaId]
    );

    await pool.query(
      `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
       VALUES ($1, $2, $3)`,
      [result.rows[0].id, finalGerenteZonaId, reputacionNormalizada]
    );

    res.status(201).json({ mensaje: 'Vendedora registrada correctamente', vendedora: result.rows[0] });
  } catch (error: any) {
    console.error('Error al crear vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function actualizarVendedoraController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { reputacion } = req.body;
    const usuario = (req as any).usuario;
    const reputacionUpper = reputacion?.toString().toUpperCase();
    const reputacionNormalizada = normalizeReputacion(reputacionUpper);
    const reputacionesGerenteZona = ['BUENA', 'ACTIVA', 'OBSERVADA', 'RESTRINGIDA'];

    if (usuario.rol === 'GERENTE_ZONA') {
      if (!reputacionUpper || !reputacionesGerenteZona.includes(reputacionUpper)) {
        return res.status(403).json({ error: 'Solo puedes asignar ACTIVA, OBSERVADA o RESTRINGIDA como reputación' });
      }
    }

    const vendedoraResult = await pool.query('SELECT * FROM "Vendedora" WHERE id = $1', [id]);
    if (vendedoraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    const vendedora = vendedoraResult.rows[0];

    let puedeEditar = false;
    if (usuario.rol === 'ADMIN') puedeEditar = true;
    else if (usuario.rol === 'GERENTE_REGIONAL') puedeEditar = vendedora.regionId === usuario.regionId;
    else if (usuario.rol === 'GERENTE_ZONA') puedeEditar = vendedora.creadaPorId === usuario.id;

    if (!puedeEditar) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta vendedora' });
    }

    await pool.query(`UPDATE "Vendedora" SET reputacion = $1 WHERE id = $2`, [reputacionNormalizada, id]);
    await pool.query(
      `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
       VALUES ($1, $2, $3)`,
      [id, vendedora.gerenteZonaId, reputacionNormalizada]
    );

    res.json({ mensaje: 'Vendedora actualizada correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarVendedoraController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const usuario = (req as any).usuario;

    const vendedoraResult = await pool.query('SELECT * FROM "Vendedora" WHERE id = $1', [id]);
    if (vendedoraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    const vendedora = vendedoraResult.rows[0];

    let puedeEliminar = false;
    if (usuario.rol === 'ADMIN') puedeEliminar = true;
    else if (usuario.rol === 'GERENTE_REGIONAL') puedeEliminar = vendedora.regionId === usuario.regionId;

    if (!puedeEliminar) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta vendedora' });
    }

    await pool.query('DELETE FROM "Vendedora" WHERE id = $1', [id]);
    res.json({ mensaje: 'Vendedora eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}