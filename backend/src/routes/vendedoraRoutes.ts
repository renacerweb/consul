import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import {
  listarVendedorasController,
  buscarVendedoraController,
  crearVendedoraController,
  actualizarVendedoraController,
  eliminarVendedoraController,
  obtenerReporteMalasReputaciones,   // nueva función
} from '../controllers/vendedoraController';

const router = Router();

// Ruta pública (sin autenticación)
router.get('/buscar/:cedula', buscarVendedoraController);

// Rutas protegidas
router.get('/', autenticar, listarVendedorasController);
router.post('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA', 'AUXILIAR'), crearVendedoraController);
router.put('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA', 'AUXILIAR'), actualizarVendedoraController);
router.delete('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), eliminarVendedoraController);

// Nueva ruta para reporte de malas reputaciones (solo GR y AUXILIAR)
router.get(
  '/reporte/malas',
  autenticar,
  permitirRoles('GERENTE_REGIONAL', 'AUXILIAR'),
  obtenerReporteMalasReputaciones
);

export default router;