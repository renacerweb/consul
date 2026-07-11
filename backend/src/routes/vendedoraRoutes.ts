import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import {
  listarVendedorasController,
  buscarVendedoraController,
  crearVendedoraController,
  actualizarVendedoraController,
  eliminarVendedoraController,
  obtenerReportePorReputaciones,   // nueva
} from '../controllers/vendedoraController';
import {
  listarCampaniasDeVendedoraController,
  asignarCampaniasAVendedoraController,
} from '../controllers/campaniaController';

const router = Router();

// Ruta pública
router.get('/buscar/:cedula', buscarVendedoraController);

// Rutas protegidas
router.get('/', autenticar, listarVendedorasController);
router.post('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA', 'AUXILIAR'), crearVendedoraController);
router.put('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA', 'AUXILIAR'), actualizarVendedoraController);
router.delete('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), eliminarVendedoraController);
router.get('/:id/campanias', autenticar, listarCampaniasDeVendedoraController);
router.put('/:id/campanias', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), asignarCampaniasAVendedoraController);

// Nueva ruta para reporte con filtros (solo GERENTE_REGIONAL y AUXILIAR)
router.get(
  '/reporte',
  autenticar,
  permitirRoles('GERENTE_REGIONAL', 'AUXILIAR'),
  obtenerReportePorReputaciones
);

export default router;