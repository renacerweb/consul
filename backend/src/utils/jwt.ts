import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'renacer_checkin_2026_secret_key';

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