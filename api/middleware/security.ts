// api/middleware/security.ts
import { Request, Response, NextFunction } from 'express';
import pool from '../db';

export async function registrarConsultaAuditoria(
  cedulaConsultada: string,
  usuarioId: number | null,
  ip: string,
  userAgent: string | undefined,
  exitosa: boolean
) {
  try {
    await pool.query(
      `INSERT INTO "AuditoriaConsulta" ("cedulaConsultada", "usuarioId", ip, "userAgent", exitosa)
       VALUES ($1, $2, $3, $4, $5)`,
      [cedulaConsultada, usuarioId, ip, userAgent || null, exitosa]
    );
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}

export function securityMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}