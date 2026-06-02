// backend/src/controllers/usuarioController.ts
import { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcryptjs';

// =====================================================
// LISTAR USUARIOS (con regiones concatenadas)
// =====================================================
export async function listarUsuariosController(req: Request, res: Response) {
  try {
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.nombre, 
        u.rol, 
        u.activo, 
        u."createdAt",
        COALESCE(
          (SELECT STRING_AGG(r.nombre, ', ')
           FROM "UsuarioRegion" ur
           JOIN "Region" r ON ur."regionId" = r.id
           WHERE ur."usuarioId" = u.id
          ), 
          (SELECT r.nombre FROM "Region" r WHERE r.id = u."regionId")
        ) as regiones,
        c.nombre as creado_por, 
        c.id as creado_por_id
      FROM "Usuario" u
      LEFT JOIN "Usuario" c ON u."creadoPorId" = c.id
    `;
    const params: any[] = [];

    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      query += ` WHERE u."creadoPorId" = $1`;
      params.push(usuarioAuth.id);
    }

    query += ` ORDER BY u.id DESC`;

    const result = await pool.query(query, params);
    
    console.log('📋 Usuarios encontrados:', result.rows.length);
    result.rows.forEach(row => {
      console.log(`  ${row.nombre} (${row.rol}): regiones = "${row.regiones}"`);
    });
    
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
// LISTAR REGIONES POR USUARIO (para GERENTE_REGIONAL)
// =====================================================
export async function listarRegionesPorUsuarioController(req: Request, res: Response) {
  try {
    const { usuarioId } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.nombre
       FROM "Region" r
       JOIN "UsuarioRegion" ur ON r.id = ur."regionId"
       WHERE ur."usuarioId" = $1`,
      [usuarioId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar regiones por usuario:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// LISTAR GERENTES ZONA
// =====================================================
export async function listarGerentesZonaPorRegionController(req: Request, res: Response) {
  try {
    const usuarioAuth = (req as any).usuario;

    let query = `
      SELECT u.id, u.nombre, u.email, 
             (
               SELECT STRING_AGG(DISTINCT r.nombre, ', ')
               FROM "UsuarioRegion" ur
               JOIN "Region" r ON ur."regionId" = r.id
               WHERE ur."usuarioId" = u.id
             ) as region
      FROM "Usuario" u
      WHERE u.rol = 'GERENTE_ZONA' AND u.activo = true
    `;
    const params: any[] = [];

    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      const regionesResult = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuarioAuth.id]
      );
      const regionIds = regionesResult.rows.map(r => r.regionId);
      if (regionIds.length > 0) {
        query += ` AND EXISTS (
          SELECT 1 FROM "UsuarioRegion" ur2 
          WHERE ur2."usuarioId" = u.id AND ur2."regionId" = ANY($1::int[])
        )`;
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
// REGISTRAR USUARIO
// =====================================================
export async function registrarController(req: Request, res: Response) {
  try {
    const { email, nombre, password, rol, regionIds } = req.body;
    const usuarioAuth = (req as any).usuario;

    console.log('📝 Registrando usuario:', { email, nombre, rol, regionIds, creadoPor: usuarioAuth.id });

    const existe = await pool.query('SELECT id FROM "Usuario" WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    let finalRegionIds: number[] = [];
    if (regionIds && Array.isArray(regionIds)) {
      finalRegionIds = regionIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id);
    }

    console.log(`🔍 [DEBUG] finalRegionIds después de parsear: ${JSON.stringify(finalRegionIds)}`);

    // =====================================================
    // VALIDAR PERMISOS SEGÚN EL ROL DEL CREADOR
    // =====================================================
    
    if (usuarioAuth.rol === 'ADMIN') {
      if (rol !== 'GERENTE_REGIONAL' && rol !== 'GERENTE_ZONA' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      if ((rol === 'GERENTE_REGIONAL' || rol === 'GERENTE_ZONA') && (!finalRegionIds || finalRegionIds.length === 0)) {
        return res.status(400).json({ error: 'Debes seleccionar al menos una región' });
      }
    } 
    else if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      if (rol !== 'GERENTE_ZONA' && rol !== 'AUXILIAR') {
        return res.status(403).json({ error: 'No tienes permiso para crear este rol' });
      }
      
      const regionesGerente = await pool.query(
        `SELECT "regionId" FROM "UsuarioRegion" WHERE "usuarioId" = $1`,
        [usuarioAuth.id]
      );
      const regionesPermitidas = regionesGerente.rows.map(r => r.regionId);
      console.log(`🔍 [DEBUG] Regiones permitidas del GR: ${JSON.stringify(regionesPermitidas)}`);
      
      if (rol === 'GERENTE_ZONA') {
        if (!finalRegionIds || finalRegionIds.length === 0) {
          return res.status(400).json({ error: 'Debes seleccionar al menos una región para el GERENTE_ZONA' });
        }
        
        for (const regionId of finalRegionIds) {
          if (!regionesPermitidas.includes(regionId)) {
            return res.status(403).json({ error: 'No puedes asignar una región que no te pertenece' });
          }
        }
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
    console.log(`🔍 [DEBUG] Usuario creado con ID: ${usuarioId}`);

    // =====================================================
    // INSERTAR REGIONES EN UsuarioRegion Y ACTUALIZAR Usuario
    // =====================================================
    console.log(`🔍 [DEBUG] finalRegionIds.length = ${finalRegionIds.length}`);

    if (finalRegionIds.length > 0) {
      console.log(`🔍 [DEBUG] Insertando regiones: ${JSON.stringify(finalRegionIds)}`);
      
      for (const regionId of finalRegionIds) {
        await pool.query(
          `INSERT INTO "UsuarioRegion" ("usuarioId", "regionId")
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [usuarioId, regionId]
        );
      }
      
      // =====================================================
      // ACTUALIZAR TAMBIÉN EL CAMPO regionId EN LA TABLA Usuario
      // =====================================================
      console.log(`🔍 [DEBUG] finalRegionIds ANTES del UPDATE: ${JSON.stringify(finalRegionIds)}`);
      
      const primaryRegionId = finalRegionIds[0];
      console.log(`🔍 [DEBUG] Actualizando regionId del usuario ${usuarioId} a ${primaryRegionId}`);
      
      const updateResult = await pool.query(
        `UPDATE "Usuario" SET "regionId" = $1 WHERE id = $2 RETURNING id, "regionId"`,
        [primaryRegionId, usuarioId]
      );
      
      console.log(`✅ [DEBUG] Resultado UPDATE: ${JSON.stringify(updateResult.rows[0])}`);
      
      if (updateResult.rows[0]?.regionId !== primaryRegionId) {
        console.error(`❌ [ERROR] El UPDATE no funcionó correctamente. Esperado: ${primaryRegionId}, Obtenido: ${updateResult.rows[0]?.regionId}`);
      }
    } else {
      console.log(`⚠️ [DEBUG] No hay regiones para insertar (finalRegionIds está vacío)`);
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
    const { email, nombre, rol, activo, password, regionIds } = req.body;
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

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      query += `, password = $${paramIndex++}`;
      params.push(passwordHash);
    }

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

    if ((rol === 'GERENTE_REGIONAL' || rol === 'GERENTE_ZONA') && regionIds && Array.isArray(regionIds)) {
      await pool.query('DELETE FROM "UsuarioRegion" WHERE "usuarioId" = $1', [id]);
      
      for (const regionId of regionIds) {
        await pool.query(
          `INSERT INTO "UsuarioRegion" ("usuarioId", "regionId") VALUES ($1, $2)`,
          [id, regionId]
        );
      }
      
      if (rol === 'GERENTE_ZONA' && regionIds.length > 0) {
        await pool.query(
          `UPDATE "Usuario" SET "regionId" = $1 WHERE id = $2`,
          [regionIds[0], id]
        );
      }
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

    if (usuarioAuth.rol !== 'ADMIN' && usuarioAuth.rol !== 'GERENTE_REGIONAL') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar usuarios' });
    }

    if (usuarioAuth.rol === 'GERENTE_REGIONAL') {
      const check = await pool.query(
        'SELECT id FROM "Usuario" WHERE id = $1 AND "creadoPorId" = $2',
        [id, usuarioAuth.id]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'No puedes eliminar este usuario' });
      }
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