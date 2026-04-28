// backend/src/utils/jwt.ts
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'mi-secreto-super-seguro-cambiar-en-produccion';

export interface UsuarioPayload {
  id: number;
  email: string;
  rol: string;
  regionId?: number;
  creadoPorId?: number;
}

export function generarToken(usuario: {
  id: number;
  email: string;
  rol: string;
  regionId?: number;
  creadoPorId?: number;
}) {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      rol: usuario.rol,
      regionId: usuario.regionId,
      creadoPorId: usuario.creadoPorId
    },
    SECRET,
    { expiresIn: '24h' }
  );
}

export function verificarToken(token: string): UsuarioPayload {
  return jwt.verify(token, SECRET) as UsuarioPayload;
}