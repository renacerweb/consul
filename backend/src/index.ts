/**
 * PUNTO DE ENTRADA DEL BACKEND
 * 
 * Configuración del servidor Express:
 * - Middlewares de seguridad (Helmet, CORS, Rate Limit)
 * - Middlewares estándar (JSON, URL encoded)
 * - Rutas de la API
 * - Inicio del servidor
 * 
 * @module Server
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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

// ==================== MIDDLEWARES DE SEGURIDAD ====================

// Helmet - Protección de headers HTTP
app.use(helmet())

// CORS - Configuración específica según entorno
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000', FRONTEND_URL]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate Limiting - Protección contra ataques de fuerza bruta
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por IP
  message: 'Demasiadas peticiones, intente nuevamente en 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: 'Demasiados intentos de inicio de sesión, intente nuevamente en 15 minutos',
  skipSuccessfulRequests: true, // No contar intentos exitosos
})

// Aplicar rate limiting global a todas las rutas
app.use(globalLimiter)

// ==================== MIDDLEWARES ESTÁNDAR ====================
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ==================== RUTAS DE LA API ====================
// Rate limiting más estricto para login
app.use('/api/auth/login', authLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/vendedora', vendedoraRoutes)
app.use('/api/zonas', zonaRoutes)
app.use('/api/mensajes', mensajeRoutes)
app.use('/api/seguridad', seguridadRoutes)

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
  console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`)
})
// Forzar redeploy
