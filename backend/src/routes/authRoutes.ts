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
// REGIONES (para selects en frontend)
// =====================================================
router.get('/regiones', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarRegionesController);

// =====================================================
// GERENTES ZONA (para selector)
// =====================================================
router.get('/gerentes-zona', autenticar, listarGerentesZonaPorRegionController);

export default router;