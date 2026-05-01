// api/utils/jwt.ts
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'mi-secreto-super-seguro-cambiar-en-produccion';

export interface UsuarioPayload {
  id: number;
  email: string;
  rol: string;
  regionId?: number;
}

export function generarToken(usuario: UsuarioPayload) {
  return jwt.sign(usuario, SECRET, { expiresIn: '24h' });
}

export function verificarToken(token: string): UsuarioPayload {
  return jwt.verify(token, SECRET) as UsuarioPayload;
}