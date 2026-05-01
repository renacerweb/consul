// api/controllers/authController.ts
import { Request, Response } from 'express';
import { login, registrarUsuario } from '../services/authService';
import pool from '../db';

export async function loginController(req: Request, res: Response) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const resultado = await login(email, password);
    res.json(resultado);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function meController(req: Request, res: Response) {
  try {
    const usuario = (req as any).usuario;
    const result = await pool.query(
      `SELECT u.id, u.email, u.nombre, u.rol, u."regionId"
       FROM "Usuario" u
       WHERE u.id = $1`,
      [usuario.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: error.message });
  }
}