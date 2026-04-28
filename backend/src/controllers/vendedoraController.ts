import { Request, Response } from 'express';
import pool from '../db';
import { registrarConsultaAuditoria } from '../middleware/security';

export async function listarVendedorasController(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;
    let query = `
      SELECT 
        v.*, 
        u.nombre as "creadaPorNombre",
        (
          SELECT reputacion 
          FROM "HistorialVendedora" h2 
          WHERE h2."vendedoraId" = v.id 
          ORDER BY h2."fechaReporte" DESC 
          LIMIT 1
        ) as reputacion
      FROM "Vendedora" v
      LEFT JOIN "Usuario" u ON v."creadaPorId" = u.id
    `;
    const params: any[] = [];

    if (usuario.rol === 'GERENTE_ZONA') {
      query += ` WHERE v."creadaPorId" = $1`;
      params.push(usuario.id);
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
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { cedula } = req.params;
  const usuario = (req as any).usuario;
  
  const cedulaStr = Array.isArray(cedula) ? cedula[0] : cedula;

  try {
    const vendedoraResult = await pool.query(
      `SELECT v.* FROM "Vendedora" v WHERE v.cedula = $1`,
      [cedulaStr]
    );
    
    const exitosa = vendedoraResult.rows.length > 0;
    const vendedora = exitosa ? vendedoraResult.rows[0] : null;

    let historial = [];
    if (exitosa && vendedora.id) {
      const historialResult = await pool.query(
        `SELECT h.*, g.nombre as "gerenteZona", g.region
         FROM "HistorialVendedora" h
         LEFT JOIN "GerenteZona" g ON h."gerenteZonaId" = g.id
         WHERE h."vendedoraId" = $1
         ORDER BY h."fechaReporte" DESC`,
        [vendedora.id]
      );
      historial = historialResult.rows;
    }
    
    await registrarConsultaAuditoria(
      cedulaStr, 
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
        gerenteZona: h.gerenteZona,
        region: h.region,
        reputacion: h.reputacion,
        fechaReporte: h.fechaReporte
      }))
    });
  } catch (error: any) {
    const cedulaStr = Array.isArray(cedula) ? cedula[0] : cedula;
    await registrarConsultaAuditoria(cedulaStr, usuario?.id || null, ip, req.headers['user-agent'] as string | undefined, false);
    res.status(500).json({ error: error.message });
  }
}

export async function crearVendedoraController(req: Request, res: Response) {
  try {
    const { nombre, cedula, reputacion, telefono, direccion, gerenteZonaId } = req.body;
    const usuario = (req as any).usuario;

    console.log('📥 Datos recibidos:', { nombre, cedula, reputacion, gerenteZonaId, usuarioRol: usuario.rol });

    // Determinar quién es el responsable (creadaPorId)
    let creadaPorId = null;
    
    if (usuario.rol === 'GERENTE_ZONA') {
      if (!usuario.gerenteZonaId) {
        console.error('Gerente sin gerenteZonaId:', usuario);
        return res.status(400).json({ error: 'Usuario gerente no tiene zona asignada' });
      }
      creadaPorId = usuario.gerenteZonaId;
      console.log('📌 Es GERENTE, creadaPorId =', creadaPorId);
    } else if (usuario.rol === 'ADMIN' && gerenteZonaId) {
      creadaPorId = parseInt(gerenteZonaId);
      console.log('📌 Es ADMIN con gerente seleccionado, creadaPorId =', creadaPorId);
    } else {
      creadaPorId = usuario.id;
      console.log('📌 Por defecto, creadaPorId =', creadaPorId);
    }

    // Buscar o crear vendedora
    let vendedoraResult = await pool.query(
      `SELECT id FROM "Vendedora" WHERE cedula = $1`,
      [cedula]
    );
    
    let vendedoraId;
    
    if (vendedoraResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO "Vendedora" (nombre, cedula, telefono, direccion, "creadaPorId")
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [nombre, cedula, telefono || null, direccion || null, creadaPorId]
      );
      vendedoraId = insertResult.rows[0].id;
      console.log('✅ Vendedora creada, ID:', vendedoraId);
    } else {
      vendedoraId = vendedoraResult.rows[0].id;
      console.log('📌 Vendedora existente, ID:', vendedoraId);
    }

    // Verificar si ya existe un reporte reciente
    const existeReporte = await pool.query(
      `SELECT id FROM "HistorialVendedora" 
       WHERE "vendedoraId" = $1 AND "gerenteZonaId" = $2 AND reputacion = $3
       AND "fechaReporte" > NOW() - INTERVAL '10 seconds'`,
      [vendedoraId, creadaPorId, reputacion]
    );

    if (existeReporte.rows.length === 0) {
      await pool.query(
        `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
         VALUES ($1, $2, $3)`,
        [vendedoraId, creadaPorId, reputacion]
      );
      console.log(`✅ Historial creado: vendedora ${vendedoraId}, gerente ${creadaPorId}, reputacion ${reputacion}`);
    } else {
      console.log(`⚠️ Reporte duplicado evitado para vendedora ${vendedoraId}`);
      return res.status(409).json({ mensaje: 'Ya has reportado esta vendedora recientemente con la misma reputación' });
    }

    res.status(201).json({ mensaje: 'Vendedora reportada correctamente', vendedoraId, creadaPorId });
  } catch (error: any) {
    console.error('❌ Error al reportar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function actualizarVendedoraController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reputacion } = req.body;
    const usuario = (req as any).usuario;

    const vendedoraResult = await pool.query(
      `SELECT * FROM "Vendedora" WHERE id = $1`,
      [id]
    );
    
    const vendedora = vendedoraResult.rows[0];
    
    if (!vendedora) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    if (usuario.rol === 'ADMIN' || usuario.rol === 'AUXILIAR') {
      const existeReporte = await pool.query(
        `SELECT id FROM "HistorialVendedora" 
         WHERE "vendedoraId" = $1 AND "gerenteZonaId" = $2 AND reputacion = $3
         AND "fechaReporte" > NOW() - INTERVAL '10 seconds'`,
        [id, vendedora.creadaPorId, reputacion]
      );

      if (existeReporte.rows.length === 0) {
        await pool.query(
          `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
           VALUES ($1, $2, $3)`,
          [id, vendedora.creadaPorId, reputacion]
        );
      }
      return res.json({ mensaje: 'Reporte actualizado' });
    }

    if (vendedora.creadaPorId !== usuario.id && vendedora.creadaPorId !== usuario.gerenteZonaId) {
      return res.status(403).json({ error: 'Solo puedes editar vendedoras que registraste tú' });
    }
    
    const minutosTranscurridos = (Date.now() - new Date(vendedora.createdAt).getTime()) / 60000;
    if (minutosTranscurridos > 30) {
      return res.status(403).json({ 
        error: 'Pasaron más de 30 minutos. Solo el administrador puede editar esta vendedora.' 
      });
    }

    const existeReporte = await pool.query(
      `SELECT id FROM "HistorialVendedora" 
       WHERE "vendedoraId" = $1 AND "gerenteZonaId" = $2 AND reputacion = $3
       AND "fechaReporte" > NOW() - INTERVAL '10 seconds'`,
      [id, vendedora.creadaPorId, reputacion]
    );

    if (existeReporte.rows.length === 0) {
      await pool.query(
        `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
         VALUES ($1, $2, $3)`,
        [id, vendedora.creadaPorId, reputacion]
      );
    }

    res.json({ mensaje: 'Reporte actualizado' });
  } catch (error: any) {
    console.error('Error al actualizar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarVendedoraController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuario = (req as any).usuario;

    if (usuario.rol !== 'ADMIN' && usuario.rol !== 'AUXILIAR') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar vendedoras' });
    }
    
    const result = await pool.query(
      `DELETE FROM "Vendedora" WHERE id = $1 RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }
    
    res.json({ mensaje: 'Vendedora eliminada', vendedora: result.rows[0] });
  } catch (error: any) {
    console.error('Error al eliminar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}