// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

export interface UsuarioPayload {
  id: number;
  email: string;
  rol: string;
  regionId?: number;
  creadoPorId?: number;
}

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verificarToken(token) as UsuarioPayload;
    (req as any).usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function permitirRoles(...rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuario;

    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
    }

    next();
  };
}