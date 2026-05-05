// backend/src/services/vendedoraService.ts
import pool from '../db';
import { Vendedora, HistorialVendedora } from '../types';

// =====================================================
// LISTAR VENDEDORAS CON TODAS SUS RELACIONES
// =====================================================
export async function listarVendedorasConRelaciones(filtros?: { 
  regionId?: number; 
  gerenteZonaId?: number;
  creadaPorId?: number;
}) {
  let query = `
    SELECT 
      v.*,
      r.id as "region_id", r.nombre as "region_nombre",
      u.id as "creada_por_id", u.nombre as "creada_por_nombre",
      gz.id as "gerente_zona_id", gz.nombre as "gerente_zona_nombre"
    FROM "Vendedora" v
    LEFT JOIN "Region" r ON v."regionId" = r.id
    LEFT JOIN "Usuario" u ON v."creadaPorId" = u.id
    LEFT JOIN "Usuario" gz ON v."gerenteZonaId" = gz.id
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;

  if (filtros?.regionId) {
    query += ` AND v."regionId" = $${idx++}`;
    params.push(filtros.regionId);
  }
  if (filtros?.gerenteZonaId) {
    query += ` AND v."gerenteZonaId" = $${idx++}`;
    params.push(filtros.gerenteZonaId);
  }
  if (filtros?.creadaPorId) {
    query += ` AND v."creadaPorId" = $${idx++}`;
    params.push(filtros.creadaPorId);
  }

  query += ` ORDER BY v.id DESC`;
  
  const result = await pool.query(query, params);
  return result.rows;
}

// =====================================================
// OBTENER VENDEDORA POR CÉDULA CON HISTORIAL
// =====================================================
export async function obtenerVendedoraConHistorial(cedula: string) {
  // Obtener vendedora con sus relaciones
  const vendedoraResult = await pool.query(
    `SELECT v.*, r.nombre as region_nombre,
            u.nombre as creada_por_nombre,
            gz.nombre as gerente_zona_nombre
     FROM "Vendedora" v
     LEFT JOIN "Region" r ON v."regionId" = r.id
     LEFT JOIN "Usuario" u ON v."creadaPorId" = u.id
     LEFT JOIN "Usuario" gz ON v."gerenteZonaId" = gz.id
     WHERE v.cedula = $1`,
    [cedula]
  );

  if (vendedoraResult.rows.length === 0) return null;

  // Obtener historial de reputación
  const historialResult = await pool.query(
    `SELECT h.*, u.nombre as gerente_zona_nombre
     FROM "HistorialVendedora" h
     LEFT JOIN "Usuario" u ON h."gerenteZonaId" = u.id
     WHERE h."vendedoraId" = $1
     ORDER BY h."fechaReporte" DESC`,
    [vendedoraResult.rows[0].id]
  );

  return {
    ...vendedoraResult.rows[0],
    historial: historialResult.rows
  };
}

// =====================================================
// CREAR VENDEDORA CON VALIDACIONES
// =====================================================
export async function crearVendedora(data: {
  nombre: string;
  cedula: string;
  reputacion: string;
  telefono?: string;
  direccion?: string;
  regionId: number;
  creadaPorId: number;
  gerenteZonaId?: number;
}) {
  // Verificar que la cédula no exista
  const existe = await pool.query('SELECT id FROM "Vendedora" WHERE cedula = $1', [data.cedula]);
  if (existe.rows.length > 0) {
    throw new Error('Ya existe una vendedora con esta cédula');
  }

  // Insertar vendedora
  const result = await pool.query(
    `INSERT INTO "Vendedora" (nombre, cedula, reputacion, telefono, direccion, "regionId", "creadaPorId", "gerenteZonaId")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.nombre, 
      data.cedula, 
      data.reputacion || 'BUENA', 
      data.telefono || null, 
      data.direccion || null, 
      data.regionId, 
      data.creadaPorId, 
      data.gerenteZonaId || null
    ]
  );

  // Crear registro inicial en historial
  await pool.query(
    `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
     VALUES ($1, $2, $3)`,
    [result.rows[0].id, data.gerenteZonaId || null, data.reputacion || 'BUENA']
  );

  return result.rows[0];
}

// =====================================================
// ACTUALIZAR REPUTACIÓN DE VENDEDORA
// =====================================================
export async function actualizarReputacionVendedora(
  vendedoraId: number, 
  nuevaReputacion: string, 
  gerenteZonaId: number
) {
  // Actualizar reputación actual
  await pool.query(
    `UPDATE "Vendedora" SET reputacion = $1 WHERE id = $2`,
    [nuevaReputacion, vendedoraId]
  );

  // Registrar en historial
  await pool.query(
    `INSERT INTO "HistorialVendedora" ("vendedoraId", "gerenteZonaId", reputacion)
     VALUES ($1, $2, $3)`,
    [vendedoraId, gerenteZonaId, nuevaReputacion]
  );
}

// =====================================================
// ELIMINAR VENDEDORA
// =====================================================
export async function eliminarVendedora(vendedoraId: number) {
  // El historial se eliminará automáticamente por CASCADE
  const result = await pool.query(
    'DELETE FROM "Vendedora" WHERE id = $1 RETURNING *',
    [vendedoraId]
  );
  return result.rows[0];
}