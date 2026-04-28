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

// Públicas
router.post('/login', loginController);

// Protegidas
router.get('/me', autenticar, meController);

// Usuarios
router.get('/usuarios', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarUsuariosController);
router.post('/registrar', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), registrarController);
router.put('/usuarios/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), editarUsuarioController);
router.delete('/usuarios/:id', autenticar, permitirRoles('ADMIN'), eliminarUsuarioController);

// Regiones y gerentes (para selects)
router.get('/regiones', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarRegionesController);
router.get('/gerentes-zona/:regionId?', autenticar, listarGerentesZonaPorRegionController);

export default router;