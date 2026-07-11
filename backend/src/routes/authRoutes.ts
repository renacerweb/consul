// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { loginController, meController } from '../controllers/authController';
import { 
  listarUsuariosController, 
  registrarController, 
  editarUsuarioController,
  eliminarUsuarioController,
  listarRegionesController,
  listarGerentesZonaPorRegionController,
  listarRegionesPorUsuarioController,
  pausarUsuarioController,
} from '../controllers/usuarioController';
import { autenticar, permitirRoles } from '../middleware/auth';

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
router.put('/usuarios/:id/activo', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), pausarUsuarioController);
router.delete('/usuarios/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), eliminarUsuarioController);

// =====================================================
// REGIONES
// =====================================================
router.get('/regiones', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarRegionesController);
router.get('/usuarios/:usuarioId/regiones', autenticar, listarRegionesPorUsuarioController);

// =====================================================
// GERENTES ZONA (para selector)
// =====================================================
router.get('/gerentes-zona', autenticar, listarGerentesZonaPorRegionController);

export default router;