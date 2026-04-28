/**
 * PUNTO DE ENTRADA DEL BACKEND
 * 
 * Configuración del servidor Express:
 * - Middlewares (CORS, JSON, URL encoded)
 * - Rutas de la API
 * - Inicio del servidor
 * 
 * @module Server
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/authRoutes'
import vendedoraRoutes from './routes/vendedoraRoutes'
import zonaRoutes from './routes/zonaRoutes'
import mensajeRoutes from './routes/mensajeRoutes'
import seguridadRoutes from './routes/seguridadRoutes'

// Cargar variables de entorno desde .env
dotenv.config()

const app = express()
const PORT: number = parseInt(process.env.PORT || '3000', 10)

// Middlewares globales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ==================== RUTAS DE LA API ====================
app.use('/api/auth', authRoutes)           // Autenticación y usuarios
app.use('/api/vendedora', vendedoraRoutes) // Gestión de vendedoras
app.use('/api/zonas', zonaRoutes)          // Gestión de zonas/regiones
app.use('/api/mensajes', mensajeRoutes)    // Sistema de mensajería
app.use('/api/seguridad', seguridadRoutes) // Auditoría y bloqueo de IPs

// ==================== RUTAS DE PRUEBA ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' })
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'Ruta de prueba funcionando' })
})

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📋 Health: http://localhost:${PORT}/api/health`)
  console.log(`📋 Vendedora: http://localhost:${PORT}/api/vendedora/buscar/12345678`)
})