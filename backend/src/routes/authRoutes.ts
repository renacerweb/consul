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
  listarRegionesPorUsuarioController
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
router.delete('/usuarios/:id', autenticar, permitirRoles('ADMIN'), eliminarUsuarioController);

// =====================================================
// REGIONES
// =====================================================
router.get('/regiones', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarRegionesController);
router.get('/usuarios/:usuarioId/regiones', autenticar, listarRegionesPorUsuarioController);

// =====================================================
// GERENTES ZONA
// =====================================================
router.get('/gerentes-zona', autenticar, listarGerentesZonaPorRegionController);

export default router;