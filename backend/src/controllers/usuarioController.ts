// backend/src/controllers/usuarioController.ts
import { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcryptjs';

// =====================================================
// LISTAR USUARIOS (con filtros por rol y región)
// =====================================================
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
    const conditions: string[] = [];

    // Filtrar por rol
    if (rol) {
      conditions.push(`u.rol = $${params.length + 1}`);
      params.push(rol);
    }

    // Si es GERENTE_REGIONAL, solo ver usuarios de su región
    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      conditions.push(`u."regionId" = $${params.length + 1}`);
      params.push(usuarioAuth.regionId);
    }

    // Si es GERENTE_ZONA, solo ver sus propios datos
    if (usuarioAuth.rol === 'GERENTE_ZONA') {
      conditions.push(`u.id = $${params.length + 1}`);
      params.push(usuarioAuth.id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY u.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// OBTENER REGIONES (para selects)
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

    // Si hay regionId en query, filtrar por ella
    if (regionId) {
      query += ` AND u."regionId" = $1`;
      params.push(regionId);
    } 
    // Si es GERENTE_REGIONAL, filtrar por su región
    else if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
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

// =====================================================
// REGISTRAR USUARIO (con permisos según rol)
// =====================================================
export async function registrarController(req: Request, res: Response) {
  try {
    const { email, nombre, password, rol, regionId } = req.body;
    const usuarioAuth = (req as any).usuario;

    // Verificar si el email ya existe
    const existe = await pool.query('SELECT id FROM "Usuario" WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // === VALIDAR PERMISOS SEGÚN QUIEN CREA ===
    let finalRegionId = regionId || null;

    if (usuarioAuth.rol === 'ADMIN') {
      // ADMIN puede crear: GERENTE_REGIONAL, AUXILIAR
      if (rol !== 'GERENTE_REGIONAL' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      // ADMIN debe seleccionar región para GERENTE_REGIONAL
      if (rol === 'GERENTE_REGIONAL' && !regionId) {
        return res.status(400).json({ error: 'Debes seleccionar una región para el GERENTE_REGIONAL' });
      }
    } 
    else if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      // GERENTE_REGIONAL puede crear: GERENTE_ZONA, AUXILIAR (solo en su región)
      if (rol !== 'GERENTE_ZONA' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      // Forzar que la región sea la del GERENTE_REGIONAL
      finalRegionId = usuarioAuth.regionId;
      if (!finalRegionId) {
        return res.status(400).json({ error: 'Tu región no está configurada' });
      }
    } 
    else {
      return res.status(403).json({ error: 'No tienes permiso para crear usuarios' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO "Usuario" (email, nombre, password, rol, "regionId", "creadoPorId", activo)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, email, nombre, rol, "regionId"`,
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

// =====================================================
// EDITAR USUARIO
// =====================================================
export async function editarUsuarioController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id as string);
    const { email, nombre, rol, regionId, activo } = req.body;
    const usuarioAuth = (req as any).usuario;

    // Verificar permisos
    if (usuarioAuth.rol === 'GERENTE_ZONA') {
      return res.status(403).json({ error: 'No tienes permiso para editar usuarios' });
    }

    // Verificar si el email ya existe (excluyendo el usuario actual)
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

    // Solo ADMIN puede cambiar región
    if (usuarioAuth.rol === 'ADMIN' && regionId !== undefined) {
      query += `, "regionId" = $${paramIndex++}`;
      params.push(regionId || null);
    }

    // Actualizar activo (solo ADMIN)
    if (usuarioAuth.rol === 'ADMIN' && activo !== undefined) {
      query += `, activo = $${paramIndex++}`;
      params.push(activo);
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, email, nombre, rol, "regionId", activo`;
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

    // Solo ADMIN puede eliminar usuarios
    if (usuarioAuth.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar usuarios' });
    }

    // No permitir eliminar a sí mismo
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