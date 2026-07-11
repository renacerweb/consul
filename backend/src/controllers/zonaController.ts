/**
 * CONTROLADOR DE ZONAS / REGIONES
 * 
 * Este archivo maneja las operaciones relacionadas con zonas y regiones:
 * - Listar todas las zonas (para usar en selectores del frontend)
 * - Crear nuevas zonas (solo admin o gerente regional)
 * 
 * @module ZonaController
 */

import { Request, Response } from 'express';
import pool from '../db';
import { registrarUsuario } from '../services/authService';

const normalizeReputacion = (value?: string) => {
  const reputacion = value?.toString().trim().toUpperCase();
  if (!reputacion) return 'BUENA';
  if (reputacion === 'ACTIVA') return 'BUENA';
  return reputacion;
};

/**
 * LISTAR ZONAS
 * 
 * Endpoint: GET /api/zonas
 * 
 * Acceso: ADMIN y GERENTE_REGIONAL
 * 
 * Devuelve todas las zonas disponibles con su región asociada
 * para usar en formularios de creación/edición de gerentes
 * 
 * @param req - Petición HTTP
 * @param res - Respuesta HTTP
 */
export async function listarZonasController(req: Request, res: Response) {
  try {
    // Asegurar columnas opcionales existentes
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS cedula VARCHAR(64)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS email VARCHAR(128)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS telefono VARCHAR(64)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS descripcion TEXT');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS reputacion VARCHAR(32)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS "usuarioId" INTEGER');

    const result = await pool.query('SELECT id, nombre, region, cedula, email, telefono, descripcion, reputacion FROM "GerenteZona" ORDER BY id');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar zonas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * CREAR NUEVA ZONA
 * 
 * Endpoint: POST /api/zonas
 * 
 * Acceso: ADMIN y GERENTE_REGIONAL
 * 
 * Permite crear una nueva zona (gerente) con su región asignada
 * 
 * @param req - Petición HTTP (contiene nombre y region en body)
 * @param res - Respuesta HTTP
 */
export async function crearZonaController(req: Request, res: Response) {
  try {
    const { nombre, region, cedula, email, telefono, descripcion, reputacion, crearUsuario, usuarioExistenteId, usuarioEmail, usuarioPassword, usuarioRegionId } = req.body;
    if (!nombre || !region) {
      return res.status(400).json({ error: 'Nombre y región son obligatorios' });
    }

    // Añadir columnas opcionales si no existen
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS cedula VARCHAR(64)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS email VARCHAR(128)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS telefono VARCHAR(64)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS descripcion TEXT');

    const rep = normalizeReputacion(reputacion);

    // Si se solicita crear o vincular usuario, manejar primero la creación/vinculación
    let usuarioIdToLink: number | null = null;
    if (crearUsuario) {
      // crear una cuenta Usuario con rol GERENTE_ZONA
      if (!usuarioEmail || !usuarioPassword) {
        return res.status(400).json({ error: 'Email y password requeridos para crear usuario' });
      }
      // Validar que no exista un usuario con ese email
      const existeEmail = await pool.query('SELECT id FROM "Usuario" WHERE LOWER(email) = LOWER($1)', [usuarioEmail]);
      if (existeEmail.rows.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      try {
        const nuevoUsuario = await registrarUsuario({
          email: usuarioEmail,
          nombre: nombre,
          password: usuarioPassword,
          rol: 'GERENTE_ZONA',
          regionId: usuarioRegionId || null,
          creadoPorId: (req as any).usuario?.id || null
        });
        usuarioIdToLink = nuevoUsuario.id;
      } catch (err: any) {
        console.error('Error al crear usuario vinculado:', err);
        return res.status(500).json({ error: 'Error al crear usuario vinculado: ' + (err.message || err) });
      }
    } else if (usuarioExistenteId) {
      // vincular a usuario existente
      const r = await pool.query('SELECT id FROM "Usuario" WHERE id = $1', [usuarioExistenteId]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario a vincular no encontrado' });
      usuarioIdToLink = usuarioExistenteId;
    }

    const result = await pool.query(
      'INSERT INTO "GerenteZona" (nombre, region, cedula, email, telefono, descripcion, reputacion, "usuarioId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [String(nombre).trim(), String(region).trim(), cedula || null, email || null, telefono || null, descripcion || null, rep, usuarioIdToLink]
    );
    const nuevo = result.rows[0];

    // Si la reputación inicial no es BUENA, crear un reporte automático
    if (rep !== 'BUENA') {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "GerenteZonaReporte" (
          id SERIAL PRIMARY KEY,
          "gerenteZonaId" INTEGER NOT NULL,
          reputacion VARCHAR(32) NOT NULL,
          comentario TEXT,
          "creadoPorId" INTEGER,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `);
      const creadoPorId = (req as any).usuario?.id || null;
      await pool.query(
        'INSERT INTO "GerenteZonaReporte" ("gerenteZonaId", reputacion, comentario, "creadoPorId") VALUES ($1, $2, $3, $4)',
        [nuevo.id, rep, 'Registro inicial con reputación ' + rep, creadoPorId]
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al crear zona:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * REPORTAR GERENTE DE ZONA
 *
 * Endpoint: POST /api/zonas/:id/reportar
 * Acceso: ADMIN y GERENTE_REGIONAL
 *
 * Body: { reputacion: string, comentario?: string }
 */
export async function reportarGerenteZonaController(req: Request, res: Response) {
  try {
    const gerenteId = parseInt(req.params.id, 10);
    const { reputacion, comentario } = req.body;

    if (!gerenteId || !reputacion) {
      return res.status(400).json({ error: 'Id de gerente y reputación son requeridos' });
    }

    const allowed = ['BUENA', 'ACTIVA', 'OBSERVADA', 'RESTRINGIDA', 'MALA'];
    const rep = normalizeReputacion(reputacion);
    if (!allowed.includes(rep)) {
      return res.status(400).json({ error: 'Reputación no válida' });
    }

    // Asegurar que el gerente exista
    const existe = await pool.query('SELECT id FROM "GerenteZona" WHERE id = $1', [gerenteId]);
    if (existe.rows.length === 0) {
      return res.status(404).json({ error: 'Gerente de zona no encontrado' });
    }

    // Crear tabla de reportes si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "GerenteZonaReporte" (
        id SERIAL PRIMARY KEY,
        "gerenteZonaId" INTEGER NOT NULL,
        reputacion VARCHAR(32) NOT NULL,
        comentario TEXT,
        "creadoPorId" INTEGER,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    const creadoPorId = (req as any).usuario?.id || null;
    const result = await pool.query(
      'INSERT INTO "GerenteZonaReporte" ("gerenteZonaId", reputacion, comentario, "creadoPorId") VALUES ($1, $2, $3, $4) RETURNING *',
      [gerenteId, rep, comentario || null, creadoPorId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al reportar gerente zona:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * LISTAR REPORTES DE UN GERENTE
 * Endpoint: GET /api/zonas/:id/reportes
 */
export async function listarReportesGerenteController(req: Request, res: Response) {
  try {
    const gerenteId = parseInt(req.params.id, 10);
    if (!gerenteId) return res.status(400).json({ error: 'Id inválido' });

    // Asegurar tabla existe (si no, devolver vacío)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "GerenteZonaReporte" (
        id SERIAL PRIMARY KEY,
        "gerenteZonaId" INTEGER NOT NULL,
        reputacion VARCHAR(32) NOT NULL,
        comentario TEXT,
        "creadoPorId" INTEGER,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      )
    `);

    const result = await pool.query(
      'SELECT r.*, u.nombre as creadoPorNombre FROM "GerenteZonaReporte" r LEFT JOIN "Usuario" u ON r."creadoPorId" = u.id WHERE r."gerenteZonaId" = $1 ORDER BY r."createdAt" DESC',
      [gerenteId]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al listar reportes gerente:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * EDITAR GERENTE DE ZONA
 * Endpoint: PUT /api/zonas/:id
 */
export async function editarZonaController(req: Request, res: Response) {
  try {
    const gerenteId = parseInt(req.params.id, 10);
    const { nombre, region, cedula, email, telefono, descripcion, reputacion, usuarioId } = req.body;
    if (!gerenteId || !nombre || !region) return res.status(400).json({ error: 'Id, nombre y region son requeridos' });

    // Asegurar columnas
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS cedula VARCHAR(64)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS email VARCHAR(128)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS telefono VARCHAR(64)');
    await pool.query('ALTER TABLE "GerenteZona" ADD COLUMN IF NOT EXISTS descripcion TEXT');

    const result = await pool.query(
      'UPDATE "GerenteZona" SET nombre = $1, region = $2, cedula = $3, email = $4, telefono = $5, descripcion = $6, reputacion = $7, "usuarioId" = $8 WHERE id = $9 RETURNING *',
      [String(nombre).trim(), String(region).trim(), cedula || null, email || null, telefono || null, descripcion || null, reputacion || null, usuarioId || null, gerenteId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Gerente no encontrado' });
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error al editar zona:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * ELIMINAR GERENTE DE ZONA
 * Endpoint: DELETE /api/zonas/:id
 */
export async function eliminarZonaController(req: Request, res: Response) {
  try {
    const gerenteId = parseInt(req.params.id, 10);
    if (!gerenteId) return res.status(400).json({ error: 'Id inválido' });

    const result = await pool.query('DELETE FROM "GerenteZona" WHERE id = $1 RETURNING id', [gerenteId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Gerente no encontrado' });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error al eliminar zona:', error);
    res.status(500).json({ error: error.message });
  }
}