/**
 * MIDDLEWARE DE SEGURIDAD
 * 
 * Este archivo contiene funciones para:
 * - Registrar auditoría de consultas (IP, usuario, cédula consultada)
 * - Registrar intentos fallidos de login
 * - Bloquear IPs automáticamente después de múltiples fallos
 * - Verificar si una IP está bloqueada
 * 
 * @module SecurityMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// Configuración de límites
const CONFIG = {
  MAX_INTENTOS_LOGIN: 5,        // Intentos fallidos antes de bloquear
  BLOQUEO_TEMPORAL_MINUTOS: 30, // Duración del bloqueo en minutos
  VENTANA_MINUTOS: 5            // Ventana de tiempo para contar intentos
};

/**
 * REGISTRAR INTENTO FALLIDO
 * 
 * Guarda cada intento fallido de login en la base de datos
 * y bloquea la IP automáticamente si supera el límite
 * 
 * @param ip - Dirección IP del solicitante
 * @param tipo - Tipo de intento (ej: 'login')
 * @param detalle - Información adicional del error
 * @returns Número de intentos fallidos en la ventana de tiempo
 */
export async function registrarIntentoFallido(ip: string, tipo: string, detalle?: string) {
  try {
    // Insertar el intento fallido
    await pool.query(
      `INSERT INTO "IntentoFallido" (ip, tipo, detalle) VALUES ($1, $2, $3)`,
      [ip, tipo, detalle || null]
    );

    // Contar intentos en los últimos minutos
    const result = await pool.query(
      `SELECT COUNT(*) FROM "IntentoFallido" 
       WHERE ip = $1 AND fecha > NOW() - INTERVAL '${CONFIG.VENTANA_MINUTOS} minutes'`,
      [ip]
    );
    
    const intentos = parseInt(result.rows[0].count);
    
    // Si supera el límite, bloquear la IP
    if (intentos >= CONFIG.MAX_INTENTOS_LOGIN) {
      await bloquearIP(ip, `${intentos} intentos fallidos en ${CONFIG.VENTANA_MINUTOS} minutos`);
    }
    
    return intentos;
  } catch (error) {
    console.error('Error al registrar intento fallido:', error);
  }
}

/**
 * BLOQUEAR IP
 * 
 * Marca una IP como bloqueada temporalmente
 * 
 * @param ip - Dirección IP a bloquear
 * @param motivo - Razón del bloqueo
 */
export async function bloquearIP(ip: string, motivo: string) {
  try {
    await pool.query(
      `INSERT INTO "IPBloqueada" (ip, motivo, "fechaExpiracion", "intentosRegistrados")
       VALUES ($1, $2, NOW() + INTERVAL '${CONFIG.BLOQUEO_TEMPORAL_MINUTOS} minutes', 1)
       ON CONFLICT (ip) DO UPDATE SET
         motivo = EXCLUDED.motivo,
         "fechaExpiracion" = NOW() + INTERVAL '${CONFIG.BLOQUEO_TEMPORAL_MINUTOS} minutes',
         "intentosRegistrados" = "IPBloqueada"."intentosRegistrados" + 1`,
      [ip, motivo]
    );
    console.log(`🚫 IP bloqueada: ${ip} - Motivo: ${motivo}`);
  } catch (error) {
    console.error('Error al bloquear IP:', error);
  }
}

/**
 * VERIFICAR SI IP ESTÁ BLOQUEADA
 * 
 * Consulta si una IP está en la lista de bloqueadas y
 * si su bloqueo aún no ha expirado
 * 
 * @param ip - Dirección IP a verificar
 * @returns true si está bloqueada, false en caso contrario
 */
export async function isIPBloqueada(ip: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT * FROM "IPBloqueada" 
       WHERE ip = $1 AND ("fechaExpiracion" IS NULL OR "fechaExpiracion" > NOW())`,
      [ip]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error al verificar IP bloqueada:', error);
    return false;
  }
}

/**
 * REGISTRAR CONSULTA EN AUDITORÍA
 * 
 * Guarda cada consulta de búsqueda de vendedora
 * para trazabilidad y detección de actividad sospechosa
 * 
 * @param cedulaConsultada - Cédula que se buscó
 * @param usuarioId - ID del usuario que consultó (null si es público)
 * @param ip - Dirección IP del solicitante
 * @param userAgent - Navegador/dispositivo del solicitante
 * @param exitosa - Si la consulta encontró la vendedora
 */
export async function registrarConsultaAuditoria(
  cedulaConsultada: string,
  usuarioId: number | null,
  ip: string,
  userAgent: string | undefined,
  exitosa: boolean
) {
  try {
    // Fire-and-forget: no bloquear la respuesta esperando la inserción de auditoría
    pool.query(
      `INSERT INTO "AuditoriaConsulta" ("cedulaConsultada", "usuarioId", ip, "userAgent", exitosa)
       VALUES ($1, $2, $3, $4, $5)`,
      [cedulaConsultada, usuarioId, ip, userAgent || null, exitosa]
    ).catch(err => {
      console.error('Error al registrar auditoría (no bloqueante):', err);
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}

/**
 * MIDDLEWARE DE BLOQUEO DE IP
 * 
 * Se ejecuta en cada petición para verificar si la IP
 * está bloqueada antes de procesar la solicitud
 * 
 * @returns 403 si la IP está bloqueada, continua si no
 */
export function securityMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (await isIPBloqueada(ip)) {
      return res.status(403).json({ 
        error: 'IP bloqueada temporalmente por actividad sospechosa. Contacte al administrador.',
        codigo: 'IP_BLOQUEADA'
      });
    }
    
    next();
  };
}