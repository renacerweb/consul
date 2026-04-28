import pool from '../db';

export async function crearVendedora(data: {
  nombre: string;
  cedula: string;
  reputacion: string;
  gerenteZonaId: number;
  creadaPorId: number;
}) {
  const result = await pool.query(
    `INSERT INTO "Vendedora" (nombre, cedula, reputacion, "gerenteZonaId", "creadaPorId")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.nombre, data.cedula, data.reputacion, data.gerenteZonaId, data.creadaPorId]
  );
  return result.rows[0];
}

export async function listarVendedoras(usuarioId: number, rol: string, gerenteZonaId?: number) {
  let query = `SELECT v.*, g.nombre as "gerenteZona" FROM "Vendedora" v
               LEFT JOIN "GerenteZona" g ON v."gerenteZonaId" = g.id`;
  const params: any[] = [];

  if (rol === 'GERENTE_ZONA' && gerenteZonaId) {
    query += ` WHERE v."gerenteZonaId" = $1`;
    params.push(gerenteZonaId);
  }

  query += ` ORDER BY v.id DESC`;
  const result = await pool.query(query, params);
  return result.rows;
}

export async function buscarVendedoraPorCedula(cedula: string) {
  const result = await pool.query(
    `SELECT v.*, g.nombre as "gerenteZona" FROM "Vendedora" v
     LEFT JOIN "GerenteZona" g ON v."gerenteZonaId" = g.id
     WHERE v.cedula = $1`,
    [cedula]
  );
  return result.rows[0];
}

export async function actualizarVendedora(id: number, data: { reputacion?: string; gerenteZonaId?: number }) {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.reputacion !== undefined) {
    updates.push(`reputacion = $${idx++}`);
    values.push(data.reputacion);
  }
  if (data.gerenteZonaId !== undefined) {
    updates.push(`"gerenteZonaId" = $${idx++}`);
    values.push(data.gerenteZonaId);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE "Vendedora" SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function eliminarVendedora(id: number) {
  const result = await pool.query(`DELETE FROM "Vendedora" WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
}