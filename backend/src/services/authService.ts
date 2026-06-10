// backend/src/services/authService.ts
import bcrypt from 'bcryptjs'
import { generarToken } from '../utils/jwt'
import pool from '../db'

export async function login(email: string, password: string) {
  const normalizedEmail = email?.toString().trim().toLowerCase();
  const result = await pool.query(
    `SELECT id, email, nombre, password, rol, "regionId", "creadoPorId", activo
     FROM "Usuario" 
     WHERE LOWER(email) = $1 AND activo = true`,
    [normalizedEmail]
  )

  const usuario = result.rows[0]

  if (!usuario) {
    throw new Error('Usuario no encontrado')
  }

  const passwordValida = await bcrypt.compare(password, usuario.password)
  if (!passwordValida) {
    throw new Error('Contraseña incorrecta')
  }

  const token = generarToken({
    id: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    regionId: usuario.regionId
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      regionId: usuario.regionId,
      creadoPorId: usuario.creadoPorId
    }
  }
}

export async function registrarUsuario(data: {
  email: string
  nombre: string
  password: string
  rol: string
  regionId?: number
  creadoPorId?: number
}) {
  const normalizedEmail = data.email?.toString().trim().toLowerCase();
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(data.password, salt)

  const result = await pool.query(
    `INSERT INTO "Usuario" (email, nombre, password, rol, "regionId", "creadoPorId", activo)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     RETURNING id, email, nombre, rol`,
    [normalizedEmail, data.nombre, passwordHash, data.rol, data.regionId || null, data.creadoPorId || null]
  )

  return result.rows[0]
}