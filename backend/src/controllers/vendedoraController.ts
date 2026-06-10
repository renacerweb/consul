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
        v.id,
        v.nombre,
        v.cedula,
        v.reputacion,
        v.telefono,
        v.direccion,
        v.descripcion,
        v."createdAt",
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
    else if (usuario.rol === 'GERENTE_ZONA') {
      conditions.push(`(
        v."creadaPorId" = $${params.length + 1} OR 
        EXISTS (
          SELECT 1 FROM "HistorialVendedora" h 
          WHERE h."vendedoraId" = v.id AND h."gerenteZonaId" = $${params.length + 1}
        )
      )`);
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
      `SELECT v.*, 
              r.nombre as region_nombre,
              u.nombre as creada_por_nombre,
              gz.nombre as gerente_zona_nombre
       FROM "Vendedora" v
       LEFT JOIN "Region" r ON v."regionId" = r.id
       LEFT JOIN "Usuario" u ON v."creadaPorId" = u.id
       LEFT JOIN "Usuario" gz ON v."gerenteZonaId" = gz.id
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
      id: vendedora.id,
      nombre: vendedora.nombre,
      cedula: vendedora.cedula,
      telefono: vendedora.telefono,
      direccion: vendedora.direccion,
      descripcion: vendedora.descripcion || null,
      reputacion: vendedora.reputacion,
      region_nombre: vendedora.region_nombre,
      creada_por_nombre: vendedora.creada_por_nombre || 'Desconocido',
      gerente_zona_nombre: vendedora.gerente_zona_nombre || 'No asignado',
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
// CREAR VENDEDORA O AGREGAR REPORTE A EXISTENTE
// =====================================================
export async function crearVendedoraController(req: Request, res: Response) {
  try {
    const { nombre, cedula, reputacion, telefono, direccion, descripcion, regionId, gerenteZonaId } = req.body;
    const usuario = (req as any).usuario;
    const reputacionUpper = reputacion?.toString().toUpperCase();
    const reputacionesGerenteZona = ['OBSERVADA', 'RESTRINGIDA'];

    if (usuario.rol === 'GERENTE_ZONA') {
      if (!reputacionUpper || !reputacionesGerenteZona.includes(reputacionUpper)) {
        return res.status(403).json({ error: 'Solo puedes asignar OBSERVADA o RESTRINGIDA como reputación' });
      }
    }

    let finalRegionId = regionId;
    let finalGerenteZonaId = gerenteZonaId || null;
    let creadaPorId = usuario.id;

    if (usuario.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionesGerente = regionesResult.rows.map(r => r.regionId);
      
      if (!finalRegionId || !regionesGerente.includes(finalRegionId)) {
        return res.status(403).json({ error: 'No tienes permiso para registrar vendedoras en esta región' });
      }
      
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
      const gerenteResult = await pool.query(
        `SELECT "regionId" FROM "Usuario" WHERE id = $1`,
        [usuario.id]
      );
      finalRegionId = gerenteResult.rows[0]?.regionId;
      finalGerenteZonaId = usuario.id;
      
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

    const vendedoraExistente = await pool.query(
      'SELECT id, nombre, cedula, telefono, direccion FROM "Vendedora" WHERE cedula = $1',
      [cedula]
    );

    let vendedoraId: number;

    if (vendedoraExistente.rows.length > 0) {
      vendedoraId = vendedoraExistente.rows[0].id;
      
      console.log(`📝 Vendedora existente encontrada (ID: ${vendedoraId}, Cédula: ${cedula}). Agregando reporte al historial.`);
      
      const reporteReciente = await pool.query(
        `SELECT id FROM "HistorialVendedora" 
         WHERE "vendedoraId" = $1 AND "gerenteZonaId" = $2 
         AND "fechaReporte" > NOW() - INTERVAL '10 seconds'`,
        [vendedoraId, finalGerenteZonaId]
      );
      
      if (reporteReciente.rows.length > 0) {
        return res.status(409).json({ 
          mensaje: 'Ya has reportado esta vendedora recientemente. Espera unos segundos.',
          tipo: 'reporte_duplicado'
        });
      }
      
      await pool.query(
        `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
         VALUES ($1, $2, $3)`,
        [vendedoraId, finalGerenteZonaId, reputacionUpper || 'BUENA']
      );
      
      res.status(200).json({ 
        mensaje: 'Reporte agregado al historial de la vendedora',
        vendedora: vendedoraExistente.rows[0],
        nuevoReporte: true,
        id: vendedoraId
      });
      
    } else {
      console.log(`📝 Creando nueva vendedora: ${nombre} (${cedula})`);
      
      const result = await pool.query(
        `INSERT INTO "Vendedora" (nombre, cedula, reputacion, telefono, direccion, descripcion, "regionId", "creadaPorId", "gerenteZonaId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [nombre, cedula, reputacionUpper || 'BUENA', telefono || null, direccion || null, descripcion || null, finalRegionId, creadaPorId, finalGerenteZonaId]
      );
      
      vendedoraId = result.rows[0].id;
      
      await pool.query(
        `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
         VALUES ($1, $2, $3)`,
        [vendedoraId, finalGerenteZonaId, reputacionUpper || 'BUENA']
      );
      
      console.log(`✅ Vendedora creada exitosamente (ID: ${vendedoraId})`);
      
      res.status(201).json({ 
        mensaje: 'Vendedora registrada correctamente',
        vendedora: result.rows[0],
        nuevoReporte: false
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error al procesar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// ACTUALIZAR REPUTACIÓN
// =====================================================
export async function actualizarVendedoraController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { reputacion } = req.body;
    const usuario = (req as any).usuario;
    const reputacionUpper = reputacion?.toString().toUpperCase();
    const reputacionesGerenteZona = ['OBSERVADA', 'RESTRINGIDA'];

    if (usuario.rol === 'GERENTE_ZONA') {
      if (!reputacionUpper || !reputacionesGerenteZona.includes(reputacionUpper)) {
        return res.status(403).json({ error: 'Solo puedes asignar OBSERVADA o RESTRINGIDA como reputación' });
      }
    }

    const vendedoraResult = await pool.query('SELECT * FROM "Vendedora" WHERE id = $1', [id]);
    if (vendedoraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    const vendedora = vendedoraResult.rows[0];

    let puedeEditar = false;
    
    if (usuario.rol === 'ADMIN') {
      puedeEditar = true;
    } 
    else if (usuario.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionesPermitidas = regionesResult.rows.map(r => r.regionId);
      if (!vendedora.regionId) {
        return res.status(403).json({ error: 'Esta vendedora no tiene región asignada. Contacta al administrador.' });
      }
      puedeEditar = regionesPermitidas.includes(vendedora.regionId);
    }
    else if (usuario.rol === 'GERENTE_ZONA') {
      puedeEditar = vendedora.creadaPorId === usuario.id;
    }
    else if (usuario.rol === 'AUXILIAR') {
      puedeEditar = true;
    }

    if (!puedeEditar) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta vendedora' });
    }

    await pool.query(`UPDATE "Vendedora" SET reputacion = $1 WHERE id = $2`, [reputacionUpper || reputacion, id]);
    await pool.query(
      `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
       VALUES ($1, $2, $3)`,
      [id, vendedora.gerenteZonaId, reputacionUpper || reputacion]
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
    
    if (usuario.rol === 'ADMIN') {
      puedeEliminar = true;
    }
    else if (usuario.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuario.id]
      );
      const regionesPermitidas = regionesResult.rows.map(r => r.regionId);
      if (!vendedora.regionId) {
        return res.status(403).json({ error: 'Esta vendedora no tiene región asignada. Contacta al administrador.' });
      }
      puedeEliminar = regionesPermitidas.includes(vendedora.regionId);
    }
    else {
      puedeEliminar = false;
    }

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

// =====================================================
// NUEVO: REPORTE CON FILTRO MÚLTIPLE DE REPUTACIONES
// =====================================================
export async function obtenerReportePorReputaciones(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;
    const { rol, id: usuarioId } = usuario;
    const { reputaciones } = req.query; // ejemplo: "MALA,DUDOSA"

    let reputacionesArray: string[] = [];
    if (reputaciones && typeof reputaciones === 'string') {
      reputacionesArray = reputaciones.split(',').map(r => r.trim().toUpperCase());
    }

    let query = `
      SELECT 
        v.id, 
        v.nombre, 
        v.cedula, 
        v.telefono, 
        v.direccion,
        v.reputacion,
        r.nombre as region
      FROM "Vendedora" v
      LEFT JOIN "Region" r ON v."regionId" = r.id
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (reputacionesArray.length > 0) {
      conditions.push(`v.reputacion = ANY($${paramIndex}::text[])`);
      params.push(reputacionesArray);
      paramIndex++;
    }

    if (rol === 'GERENTE_REGIONAL') {
      const regionesQuery = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuarioId]
      );
      const regionesIds = regionesQuery.rows.map(row => row.regionId);
      if (regionesIds.length === 0) return res.json([]);
      conditions.push(`v."regionId" = ANY($${paramIndex}::int[])`);
      params.push(regionesIds);
      paramIndex++;
    } else if (rol === 'AUXILIAR') {
      conditions.push(`v."creadaPorId" = $${paramIndex}`);
      params.push(usuarioId);
      paramIndex++;
    } else {
      return res.status(403).json({ error: 'No autorizado' });
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ` ORDER BY v.reputacion DESC, v.nombre ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error en reporte por reputaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}