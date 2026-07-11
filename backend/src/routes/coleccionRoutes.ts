import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import {
  listarGerentesZonaParaColeccionesController,
  listarColeccionesPorCampaniaController,
  listarColeccionesComparacionController,
  guardarColeccionesController,
} from '../controllers/coleccionController';

const router = Router();

router.get('/gerentes-zona', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarGerentesZonaParaColeccionesController);
router.get('/comparacion', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarColeccionesComparacionController);
router.get('/:campaniaId', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), listarColeccionesPorCampaniaController);
router.post('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), guardarColeccionesController);

export default router;
