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

// ==================== CARGAR VARIABLES DE ENTORNO PRIMERO ====================
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env (dotenv busca automáticamente en la raíz)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verificar que se cargó
console.log('========================================');
console.log('🔍 [index.ts] Verificando configuración:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ CONFIGURADA' : '❌ NO CONFIGURADA');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ CONFIGURADO' : '❌ NO CONFIGURADO');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('========================================');

// ==================== IMPORTS ====================
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { autenticar } from './middleware/auth';
import authRoutes from './routes/authRoutes'
import vendedoraRoutes from './routes/vendedoraRoutes'
import zonaRoutes from './routes/zonaRoutes'
import mensajeRoutes from './routes/mensajeRoutes'
import seguridadRoutes from './routes/seguridadRoutes'
import campaniaRoutes from './routes/campaniaRoutes'
import coleccionRoutes from './routes/coleccionRoutes'
import carruselRoutes from './routes/carruselRoutes'
import contactoRoutes from './routes/contactoRoutes'
import { listarRegionesController } from './controllers/usuarioController'

const app = express()
const PORT: number = parseInt(process.env.PORT || '3001', 10)

// ==================== MIDDLEWARES DE SEGURIDAD ====================

// Helmet - Protección de headers HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS - Configuración específica según entorno
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [FRONTEND_URL]
  : [/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Rate Limiting - Protección contra ataques de fuerza bruta
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 peticiones por IP en desarrollo
  message: 'Demasiadas peticiones, intente nuevamente en 15 minutos',
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // aumentado temporalmente para permitir pruebas locales
  message: 'Demasiados intentos de inicio de sesión, intente nuevamente en 15 minutos',
  skipSuccessfulRequests: true, // No contar intentos exitosos
})

// Aplicar rate limiting global a todas las rutas
app.use(globalLimiter)

// ==================== MIDDLEWARES ESTÁNDAR ====================
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ==================== ARCHIVOS ESTÁTICOS ====================
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads')
app.use('/uploads', express.static(UPLOADS_DIR))

// ==================== RUTAS DE LA API ====================
// Rate limiting más estricto para login
app.use(['/api/auth/login', '/auth/login'], authLimiter)
app.use(['/api/auth', '/auth'], authRoutes)
app.use(['/api/vendedora', '/vendedora'], vendedoraRoutes)
app.use(['/api/zonas', '/zonas'], zonaRoutes)
app.use(['/api/mensajes', '/mensajes'], mensajeRoutes)
app.use(['/api/contacto', '/contacto'], contactoRoutes)
app.use(['/api/seguridad', '/seguridad'], seguridadRoutes)
app.use(['/api/campania', '/campania'], campaniaRoutes)
app.use(['/api/coleccion', '/coleccion'], coleccionRoutes)
app.use(['/api/carrusel', '/carrusel'], carruselRoutes)

// ==================== RUTA SEGURA PARA REGIONES ====================
// Requiere autenticación (Bearer token)
app.get('/api/regiones', autenticar, listarRegionesController);

// ==================== RUTAS DE PRUEBA ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' })
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'Ruta de prueba funcionando' })
})

// ==================== EXPORTAR APP PARA RENDER/VERCEL ====================
// Esto es importante para despliegues en plataformas serverless
export default app;

// ==================== INICIAR SERVIDOR ====================
// Solo iniciar el servidor si este archivo se ejecuta directamente
// (no cuando es importado por Render o Vercel)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    console.log(`📋 Health: http://localhost:${PORT}/api/health`)
    console.log(`📋 Regiones: http://localhost:${PORT}/api/regiones`)
    console.log(`📋 Vendedora: http://localhost:${PORT}/api/vendedora/buscar/12345678`)
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`)
  })
}