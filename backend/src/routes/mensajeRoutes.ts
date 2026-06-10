import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import {
  enviarMensajeController,
  recibirMensajesController,
  marcarComoLeidoController,
  listarGerentesController,
} from '../controllers/mensajeController';

const router = Router();

// Todas las rutas requieren autenticación
router.post('/enviar', autenticar, permitirRoles('ADMIN', 'AUXILIAR', 'GERENTE_REGIONAL'), enviarMensajeController);
router.get('/recibidos', autenticar, recibirMensajesController);
router.put('/:id/leer', autenticar, marcarComoLeidoController);
router.get('/gerentes', autenticar, permitirRoles('ADMIN', 'AUXILIAR', 'GERENTE_REGIONAL'), listarGerentesController);

export default router;