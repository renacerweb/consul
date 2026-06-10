/**
 * CONTROLADOR DE MENSAJES
 * 
 * Este archivo maneja el sistema de mensajería interna:
 * - Enviar mensajes (Admin/Auxiliar → Gerentes)
 * - Recibir mensajes (cada usuario ve los suyos)
 * - Marcar mensajes como leídos
 * - Listar gerentes disponibles para enviar mensajes
 * 
 * @module MensajeController
 */

import { Request, Response } from 'express';
import pool from '../db';

/**
 * ENVIAR MENSAJE
 * 
 * Endpoint: POST /api/mensajes/enviar
 * 
 * Acceso: Solo ADMIN o AUXILIAR
 * 
 * Tipos de envío:
 * - A un gerente específico (destinatarioId)
 * - A TODOS los gerentes (paraTodosGerentes = true)
 * 
 * @param req - Petición HTTP (contiene titulo, contenido, destinatarioId, paraTodosGerentes)
 * @param res - Respuesta HTTP
 */
export async function enviarMensajeController(req: Request, res: Response) {
  try {
    const { titulo, contenido, destinatarioId, paraTodosGerentes } = req.body;
    const remitente = (req as any).usuario;

    // Validar que el remitente tenga permisos (Admin, Auxiliar o Gerente Regional)
    if (remitente.rol !== 'ADMIN' && remitente.rol !== 'AUXILIAR' && remitente.rol !== 'GERENTE_REGIONAL') {
      return res.status(403).json({ error: 'No tienes permiso para enviar mensajes' });
    }

    let result;

    if (paraTodosGerentes) {
      // Enviar a todos los gerentes
      result = await pool.query(
        `INSERT INTO "Mensaje" (titulo, contenido, "remitenteId", "paraTodosGerentes")
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [titulo, contenido, remitente.id, true]
      );
    } else {
      // Enviar a un gerente específico
      result = await pool.query(
        `INSERT INTO "Mensaje" (titulo, contenido, "remitenteId", "destinatarioId")
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [titulo, contenido, remitente.id, destinatarioId]
      );
    }

    res.status(201).json({ mensaje: 'Mensaje enviado', data: result.rows[0] });
  } catch (error: any) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * RECIBIR MENSAJES
 * 
 * Endpoint: GET /api/mensajes/recibidos
 * 
 * Acceso: Requiere autenticación (todos los roles)
 * 
 * Filtros según rol:
 * - ADMIN/AUXILIAR: ven todos los mensajes enviados (como historial)
 * - GERENTE: solo ve mensajes dirigidos a él o mensajes para todos los gerentes
 * 
 * @param req - Petición HTTP (contiene usuario autenticado)
 * @param res - Respuesta HTTP
 */
export async function recibirMensajesController(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;

    if (usuario.rol === 'ADMIN' || usuario.rol === 'AUXILIAR') {
      // Admin y Auxiliar ven todos los mensajes enviados
      const result = await pool.query(`
        SELECT m.*, u.nombre as "remitenteNombre"
        FROM "Mensaje" m
        LEFT JOIN "Usuario" u ON m."remitenteId" = u.id
        ORDER BY m."createdAt" DESC
      `);
      return res.json(result.rows);
    } else {
      // Gerente solo ve mensajes para él o para todos
      const result = await pool.query(
        `
        SELECT m.*, u.nombre as "remitenteNombre"
        FROM "Mensaje" m
        LEFT JOIN "Usuario" u ON m."remitenteId" = u.id
        WHERE m."destinatarioId" = $1 OR m."paraTodosGerentes" = true
        ORDER BY m."createdAt" DESC
        `,
        [usuario.id]
      );
      return res.json(result.rows);
    }
  } catch (error: any) {
    console.error('Error al recibir mensajes:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * MARCAR MENSAJE COMO LEÍDO
 * 
 * Endpoint: PUT /api/mensajes/:id/leer
 * 
 * Acceso: Requiere autenticación
 * 
 * Un usuario solo puede marcar como leído un mensaje que:
 * - Le fue dirigido a él (destinatarioId)
 * - O es un mensaje para todos los gerentes (y él es gerente)
 * 
 * @param req - Petición HTTP (contiene id del mensaje en params)
 * @param res - Respuesta HTTP
 */
export async function marcarComoLeidoController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuario = (req as any).usuario;

    const result = await pool.query(
      `UPDATE "Mensaje" 
       SET leido = true 
       WHERE id = $1 AND ("destinatarioId" = $2 OR "paraTodosGerentes" = true)
       RETURNING *`,
      [id, usuario.id]
    );

    res.json({ mensaje: 'Mensaje marcado como leído', data: result.rows[0] });
  } catch (error: any) {
    console.error('Error al marcar mensaje como leído:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * LISTAR GERENTES (para selector de destinatarios)
 * 
 * Endpoint: GET /api/mensajes/gerentes
 * 
 * Acceso: Solo ADMIN o AUXILIAR
 * 
 * Devuelve lista de todos los usuarios con rol GERENTE_ZONA
 * para que el remitente pueda elegir a quién enviar el mensaje
 * 
 * @param req - Petición HTTP
 * @param res - Respuesta HTTP
 */
export async function listarGerentesController(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;

    if (usuario.rol === 'GERENTE_REGIONAL') {
      // Si es Gerente Regional, listar solo los gerentes de zona en sus regiones
      const regionesRes = await pool.query(`SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`, [usuario.id]);
      const regionIds = regionesRes.rows.map((r: any) => r.regionId);
      if (regionIds.length === 0) return res.json([]);

      const result = await pool.query(
        `SELECT DISTINCT u.id, u.nombre, u.email
         FROM "Usuario" u
         JOIN "UsuarioRegion" ur ON ur."usuarioId" = u.id
         WHERE u.rol = 'GERENTE_ZONA' AND ur."regionId" = ANY($1::int[])
         ORDER BY u.nombre`,
        [regionIds]
      );
      return res.json(result.rows);
    }

    const result = await pool.query(
      `SELECT id, nombre, email FROM "Usuario" WHERE rol = 'GERENTE_ZONA' ORDER BY nombre`
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar gerentes:', error);
    res.status(500).json({ error: error.message });
  }
}