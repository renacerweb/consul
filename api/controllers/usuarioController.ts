// api/controllers/usuarioController.ts
import { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcryptjs';

export async function listarUsuariosController(req: Request, res: Response) {
  try {
    const { rol } = req.query;
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT u.id, u.email, u.nombre, u.rol, u.activo, u."createdAt",
             r.nombre as region, r.id as regionId,
             c.nombre as creado_por, c.id as creado_por_id
      FROM "Usuario" u
      LEFT JOIN "Region" r ON u."regionId" = r.id
      LEFT JOIN "Usuario" c ON u."creadoPorId" = c.id
    `;
    const params: any[] = [];

    if (rol) {
      query += ` WHERE u.rol = $1`;
      params.push(rol);
    }

    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      query += params.length === 0 ? ' WHERE' : ' AND';
      query += ` u."creadoPorId" = $${params.length + 1}`;
      params.push(usuarioAuth.id);
    }

    query += ` ORDER BY u.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarRegionesController(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT id, nombre FROM "Region" ORDER BY id');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar regiones:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function listarGerentesZonaController(req: Request, res: Response) {
  try {
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT u.id, u.nombre, u.email, r.nombre as region
      FROM "Usuario" u
      LEFT JOIN "Region" r ON u."regionId" = r.id
      WHERE u.rol = 'GERENTE_ZONA' AND u.activo = true
    `;
    const params: any[] = [];

    if (usuarioAuth.rol === 'GERENTE_REGIONAL' && usuarioAuth.regionId) {
      query += ` AND u."regionId" = $1`;
      params.push(usuarioAuth.regionId);
    }

    query += ` ORDER BY u.nombre`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar gerentes zona:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function registrarController(req: Request, res: Response) {
  try {
    const { email, nombre, password, rol, regionId } = req.body;
    const usuarioAuth = (req as any).usuario;

    const existe = await pool.query('SELECT id FROM "Usuario" WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    let finalRegionId = regionId || null;

    if (usuarioAuth.rol === 'ADMIN') {
      if (rol !== 'GERENTE_REGIONAL' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      if (rol === 'GERENTE_REGIONAL' && !regionId) {
        return res.status(400).json({ error: 'Debes seleccionar una región' });
      }
    } 
    else if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      if (rol !== 'GERENTE_ZONA' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      finalRegionId = usuarioAuth.regionId;
    } 
    else {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO "Usuario" (email, nombre, password, rol, "regionId", "creadoPorId", activo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, nombre, rol`,
      [email, nombre, passwordHash, rol, finalRegionId, usuarioAuth.id]
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function editarUsuarioController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { email, nombre, rol, activo } = req.body;
    const usuarioAuth = (req as any).usuario;

    if (usuarioAuth.rol === 'GERENTE_ZONA') {
      return res.status(403).json({ error: 'No tienes permiso para editar usuarios' });
    }

    const existe = await pool.query(
      'SELECT id FROM "Usuario" WHERE email = $1 AND id != $2',
      [email, id]
    );
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
    }

    let query = 'UPDATE "Usuario" SET email = $1, nombre = $2, rol = $3';
    const params: any[] = [email, nombre, rol];
    let paramIndex = 4;

    if (usuarioAuth.rol === 'ADMIN' && activo !== undefined) {
      query += `, activo = $${paramIndex++}`;
      params.push(activo);
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, email, nombre, rol, activo`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario actualizado correctamente', usuario: result.rows[0] });
  } catch (error: any) {
    console.error('Error al editar usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function eliminarUsuarioController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const usuarioAuth = (req as any).usuario;

    if (usuarioAuth.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar usuarios' });
    }

    if (id === usuarioAuth.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    const result = await pool.query(
      'DELETE FROM "Usuario" WHERE id = $1 AND rol != $2 RETURNING id, nombre, email',
      [id, 'ADMIN']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado o no se puede eliminar' });
    }

    res.json({ mensaje: 'Usuario eliminado correctamente', usuario: result.rows[0] });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: error.message });
  }
}