// api/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ==================== MIDDLEWARES ====================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://sistema-renacer.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== RUTAS ====================
import authRoutes from './routes/authRoutes';
import vendedoraRoutes from './routes/vendedoraRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/vendedora', vendedoraRoutes);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// ==================== EXPORTAR PARA VERCEL ====================
export default app;