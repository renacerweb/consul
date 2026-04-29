// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { loginController, meController } from '../controllers/authController';
import { 
  listarUsuariosController, 
  registrarController, 
  editarUsuarioController,
  eliminarUsuarioController,
  listarRegionesController,
  listarGerentesZonaPorRegionController
} from '../controllers/usuarioController';
import { autenticar, permitirRoles } from '../middleware/auth';
import pool from '../db';

const router = Router();

// =====================================================
// RUTAS PÚBLICAS
// =====================================================
router.post('/login', loginController);

// =====================================================
// RUTAS PROTEGIDAS
// =====================================================
router.get('/me', autenticar, meController);

// =====================================================
// USUARIOS
// =====================================================
router.get('/usuarios', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarUsuariosController);
router.post('/registrar', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), registrarController);
router.put('/usuarios/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), editarUsuarioController);
router.delete('/usuarios/:id', autenticar, permitirRoles('ADMIN'), eliminarUsuarioController);

// =====================================================
// REGIONES (para selects)
// =====================================================
router.get('/regiones', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarRegionesController);

// =====================================================
// REGIONES SIMPLE (alternativa directa - funciona siempre)
// =====================================================
router.get('/regiones-simple', autenticar, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM "Region" ORDER BY id');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al obtener regiones:', error);
    res.status(500).json({ error: 'Error al obtener regiones' });
  }
});

// =====================================================
// GERENTES ZONA (para selector)
// =====================================================
router.get('/gerentes-zona', autenticar, listarGerentesZonaPorRegionController);

// =====================================================
// REGIONES POR USUARIO (para GERENTE_REGIONAL)
// =====================================================
router.get('/usuarios/:id/regiones', autenticar, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.nombre
       FROM "Region" r
       JOIN "UsuarioRegion" ur ON r.id = ur."regionId"
       WHERE ur."usuarioId" = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error al obtener regiones del usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;