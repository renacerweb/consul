// backend/src/controllers/vendedoraController.ts
import { Request, Response } from 'express';
import pool from '../db';
import { registrarConsultaAuditoria } from '../middleware/security';

// =====================================================
// LISTAR VENDEDORAS (con filtros por rol)
// =====================================================
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

    // ADMIN: ve todo
    // GERENTE_REGIONAL: solo vendedoras de sus regiones
    if (usuario.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionIds = regionesResult.rows.map(r => r.regionId);
      if (regionIds.length > 0) {
        conditions.push(`v."regionId" = ANY($${params.length + 1}::int[])`);
        params.push(regionIds);
      }
    }
    // GERENTE_ZONA: solo vendedoras que él creó
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

// =====================================================
// BUSCAR VENDEDORA POR CÉDULA (público)
// =====================================================
export async function buscarVendedoraController(req: Request, res: Response) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
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

    await registrarConsultaAuditoria(
      cedula,
      usuario?.id || null,
      ip,
      req.headers['user-agent'] as string | undefined,
      exitosa
    );

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
    await registrarConsultaAuditoria(cedula, usuario?.id || null, ip, req.headers['user-agent'] as string | undefined, false);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// CREAR VENDEDORA (con permisos según rol)
// =====================================================
export async function crearVendedoraController(req: Request, res: Response) {
  try {
    const { nombre, cedula, reputacion, telefono, direccion, regionId, gerenteZonaId } = req.body;
    const usuario = (req as any).usuario;

    // Verificar que la cédula no exista
    const existe = await pool.query('SELECT id FROM "Vendedora" WHERE cedula = $1', [cedula]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una vendedora con esta cédula' });
    }

    let finalRegionId = regionId;
    let finalGerenteZonaId = gerenteZonaId || null;
    let creadaPorId = usuario.id;

    // =====================================================
    // LÓGICA SEGÚN EL ROL
    // =====================================================

    if (usuario.rol === 'GERENTE_REGIONAL') {
      // Obtener regiones del gerente regional
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionesGerente = regionesResult.rows.map(r => r.regionId);
      
      // Verificar que la región sea válida
      if (!finalRegionId || !regionesGerente.includes(finalRegionId)) {
        return res.status(403).json({ error: 'No tienes permiso para registrar vendedoras en esta región' });
      }
      
      // Si asignó un gerente zona, verificar que pertenezca a la región
      if (finalGerenteZonaId) {
        const gerenteResult = await pool.query(
          `SELECT u.id, u."regionId" FROM "Usuario" u WHERE u.id = $1 AND u.rol = 'GERENTE_ZONA'`,
          [finalGerenteZonaId]
        );
        if (gerenteResult.rows.length === 0) {
          return res.status(400).json({ error: 'El gerente de zona no existe' });
        }
        if (gerenteResult.rows[0].regionId !== finalRegionId) {
          return res.status(403).json({ error: 'El gerente de zona no pertenece a esta región' });
        }
      }
    } 
    else if (usuario.rol === 'GERENTE_ZONA') {
      // Obtener la región del gerente zona
      const gerenteResult = await pool.query(
        `SELECT "regionId" FROM "Usuario" WHERE id = $1`,
        [usuario.id]
      );
      finalRegionId = gerenteResult.rows[0].regionId;
      finalGerenteZonaId = usuario.id; // Forzar a su propio ID
      
      if (!finalRegionId) {
        return res.status(400).json({ error: 'Tu región no está configurada' });
      }
    }
    else if (usuario.rol === 'ADMIN') {
      if (!finalRegionId) {
        return res.status(400).json({ error: 'Debes seleccionar una región' });
      }
    }
    else if (usuario.rol === 'AUXILIAR') {
      if (!finalRegionId) {
        return res.status(400).json({ error: 'Debes seleccionar una región' });
      }
    }
    else {
      return res.status(403).json({ error: 'No tienes permiso para registrar vendedoras' });
    }

    // Insertar vendedora
    const result = await pool.query(
      `INSERT INTO "Vendedora" (nombre, cedula, reputacion, telefono, direccion, "regionId", "creadaPorId", "gerenteZonaId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nombre, cedula, reputacion || 'BUENA', telefono || null, direccion || null, finalRegionId, creadaPorId, finalGerenteZonaId]
    );

    // Registrar historial inicial
    await pool.query(
      `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
       VALUES ($1, $2, $3)`,
      [result.rows[0].id, finalGerenteZonaId, reputacion || 'BUENA']
    );

    res.status(201).json({ mensaje: 'Vendedora registrada correctamente', vendedora: result.rows[0] });
  } catch (error: any) {
    console.error('Error al crear vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// ACTUALIZAR REPUTACIÓN DE VENDEDORA
// =====================================================
export async function actualizarVendedoraController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { reputacion } = req.body;
    const usuario = (req as any).usuario;

    const vendedoraResult = await pool.query('SELECT * FROM "Vendedora" WHERE id = $1', [id]);
    if (vendedoraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    const vendedora = vendedoraResult.rows[0];

    let puedeEditar = false;
    if (usuario.rol === 'ADMIN') puedeEditar = true;
    else if (usuario.rol === 'GERENTE_REGIONAL') puedeEditar = vendedora.regionId === usuario.regionId;
    else if (usuario.rol === 'GERENTE_ZONA') puedeEditar = vendedora.creadaPorId === usuario.id;
    else if (usuario.rol === 'AUXILIAR') puedeEditar = true;

    if (!puedeEditar) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta vendedora' });
    }

    await pool.query(`UPDATE "Vendedora" SET reputacion = $1 WHERE id = $2`, [reputacion, id]);
    await pool.query(
      `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
       VALUES ($1, $2, $3)`,
      [id, vendedora.gerenteZonaId, reputacion]
    );

    res.json({ mensaje: 'Reputación actualizada correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// ELIMINAR VENDEDORA
// =====================================================
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