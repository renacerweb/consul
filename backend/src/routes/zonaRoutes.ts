import { Router } from 'express';
import { listarZonasController, crearZonaController, reportarGerenteZonaController, listarReportesGerenteController, editarZonaController, eliminarZonaController } from '../controllers/zonaController';
import { autenticar, permitirRoles } from '../middleware/auth';

const router = Router();

router.get('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarZonasController);
router.post('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), crearZonaController);
router.put('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), editarZonaController);
router.delete('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), eliminarZonaController);
router.post('/:id/reportar', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), reportarGerenteZonaController);
router.get('/:id/reportes', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarReportesGerenteController);

export default router;
