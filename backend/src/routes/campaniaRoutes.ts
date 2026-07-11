import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import {
  listarCampaniasController,
  crearCampaniaController,
  actualizarCampaniaController,
  eliminarCampaniaController,
  listarHistorialCampaniasController,
  listarCampaniasDeVendedoraController,
  asignarCampaniasAVendedoraController,
  listarParticipantesPorCampaniaController,
  listarParticipacionesPorGerenteController,
} from '../controllers/campaniaController';

const router = Router();

router.get('/', autenticar, listarCampaniasController);
router.get('/historial', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), listarHistorialCampaniasController);
router.post('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), crearCampaniaController);
router.put('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), actualizarCampaniaController);
router.delete('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), eliminarCampaniaController);
router.get('/:id/campanias', autenticar, listarCampaniasDeVendedoraController);
router.put('/:id/campanias', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), asignarCampaniasAVendedoraController);
router.get('/:id/participantes', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), listarParticipantesPorCampaniaController);
router.get('/participaciones/por-gerente', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), listarParticipacionesPorGerenteController);

export default router;
