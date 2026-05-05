// backend/src/services/auditService.ts
import pool from '../db';

// =====================================================
// REGISTRAR CONSULTA EN AUDITORÍA
// =====================================================
export async function registrarAuditoriaConsulta(
  cedulaConsultada: string,
  usuarioId: number | null,
  ip: string,
  userAgent: string | undefined,
  exitosa: boolean
) {
  try {
    await pool.query(
      `INSERT INTO "AuditoriaConsulta" ("cedulaConsultada", "usuarioId", ip, "userAgent", exitosa, fecha)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [cedulaConsultada, usuarioId, ip, userAgent || null, exitosa]
    );
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}

// =====================================================
// REGISTRAR INTENTO FALLIDO Y BLOQUEAR IP
// =====================================================
const CONFIG = {
  MAX_INTENTOS_LOGIN: 5,
  BLOQUEO_TEMPORAL_MINUTOS: 30,
};

export async function registrarIntentoFallido(ip: string, tipo: string, detalle?: string) {
  try {
    await pool.query(
      `INSERT INTO "IntentoFallido" (ip, tipo, detalle, fecha)
       VALUES ($1, $2, $3, NOW())`,
      [ip, tipo, detalle || null]
    );

    // Contar intentos en los últimos 5 minutos
    const result = await pool.query(
      `SELECT COUNT(*) FROM "IntentoFallido" 
       WHERE ip = $1 AND fecha > NOW() - INTERVAL '5 minutes'`,
      [ip]
    );
    
    const intentos = parseInt(result.rows[0].count);
    
    if (intentos >= CONFIG.MAX_INTENTOS_LOGIN) {
      await pool.query(
        `INSERT INTO "IPBloqueada" (ip, motivo, "fechaExpiracion", "fechaBloqueo")
         VALUES ($1, $2, NOW() + INTERVAL '${CONFIG.BLOQUEO_TEMPORAL_MINUTOS} minutes', NOW())
         ON CONFLICT (ip) DO UPDATE SET 
           "fechaExpiracion" = EXCLUDED."fechaExpiracion",
           motivo = EXCLUDED.motivo`,
        [ip, `${intentos} intentos fallidos en 5 minutos`]
      );
    }
  } catch (error) {
    console.error('Error al registrar intento fallido:', error);
  }
}

// =====================================================
// VERIFICAR SI IP ESTÁ BLOQUEADA
// =====================================================
export async function isIPBloqueada(ip: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT id FROM "IPBloqueada" 
       WHERE ip = $1 AND ("fechaExpiracion" IS NULL OR "fechaExpiracion" > NOW())`,
      [ip]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error al verificar IP bloqueada:', error);
    return false;
  }
}