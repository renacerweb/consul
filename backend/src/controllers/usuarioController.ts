// backend/src/controllers/usuarioController.ts
import { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcryptjs';

// =====================================================
// LISTAR USUARIOS (con regiones concatenadas)
// =====================================================
export async function listarUsuariosController(req: Request, res: Response) {
  try {
    const { rol } = req.query;
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT u.id, u.email, u.nombre, u.rol, u.activo, u."createdAt",
             STRING_AGG(DISTINCT r.nombre, ', ') as regiones,
             c.nombre as creado_por, c.id as creado_por_id
      FROM "Usuario" u
      LEFT JOIN "UsuarioRegion" ur ON u.id = ur."usuarioId"
      LEFT JOIN "Region" r ON ur."regionId" = r.id
      LEFT JOIN "Usuario" c ON u."creadoPorId" = c.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (rol) {
      conditions.push(`u.rol = $${params.length + 1}`);
      params.push(rol);
    }

    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      conditions.push(`u."creadoPorId" = $${params.length + 1}`);
      params.push(usuarioAuth.id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY u.id, c.nombre, c.id ORDER BY u.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// LISTAR REGIONES (para selects)
// =====================================================
export async function listarRegionesController(req: Request, res: Response) {
  try {
    const result = await pool.query('SELECT id, nombre FROM "Region" ORDER BY id');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar regiones:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// OBTENER GERENTES ZONA POR REGIÓN (para selector)
// =====================================================
export async function listarGerentesZonaPorRegionController(req: Request, res: Response) {
  try {
    const { regionId } = req.query;
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT u.id, u.nombre, u.email, r.nombre as region
      FROM "Usuario" u
      LEFT JOIN "Region" r ON u."regionId" = r.id
      WHERE u.rol = 'GERENTE_ZONA' AND u.activo = true
    `;
    const params: any[] = [];

    if (regionId) {
      query += ` AND u."regionId" = $1`;
      params.push(regionId);
    } 
    else if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuarioAuth.id]
      );
      const regionIds = regionesResult.rows.map(r => r.regionId);
      if (regionIds.length > 0) {
        query += ` AND u."regionId" = ANY($1::int[])`;
        params.push(regionIds);
      }
    }

    query += ` ORDER BY u.nombre`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar gerentes zona:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// REGISTRAR USUARIO (con múltiples regiones para GERENTE_REGIONAL)
// =====================================================
export async function registrarController(req: Request, res: Response) {
  try {
    const { email, nombre, password, rol, regionIds } = req.body;
    const usuarioAuth = (req as any).usuario;

    const existe = await pool.query('SELECT id FROM "Usuario" WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    let finalRegionIds = regionIds || [];

    if (usuarioAuth.rol === 'ADMIN') {
      if (rol !== 'GERENTE_REGIONAL' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      if (rol === 'GERENTE_REGIONAL' && (!finalRegionIds || finalRegionIds.length === 0)) {
        return res.status(400).json({ error: 'Debes seleccionar al menos una región para el GERENTE_REGIONAL' });
      }
    } 
    else if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      if (rol !== 'GERENTE_ZONA' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
    } 
    else {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO "Usuario" (email, nombre, password, rol, "creadoPorId", activo)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, nombre, rol`,
      [email, nombre, passwordHash, rol, usuarioAuth.id]
    );

    const usuarioId = result.rows[0].id;

    if (rol === 'GERENTE_REGIONAL' && finalRegionIds.length > 0) {
      for (const regionId of finalRegionIds) {
        await pool.query(
          `INSERT INTO "UsuarioRegion" ("usuarioId", "regionId")
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [usuarioId, regionId]
        );
      }
    }

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      usuario: { id: usuarioId, email, nombre, rol, regionIds: finalRegionIds }
    });
  } catch (error: any) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// EDITAR USUARIO
// =====================================================
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

// =====================================================
// ELIMINAR USUARIO
// =====================================================
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

    await pool.query('DELETE FROM "UsuarioRegion" WHERE "usuarioId" = $1', [id]);

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