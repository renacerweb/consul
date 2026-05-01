// api/routes/vendedoraRoutes.ts
import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import {
  listarVendedorasController,
  buscarVendedoraController,
  crearVendedoraController,
  actualizarVendedoraController,
  eliminarVendedoraController,
} from '../controllers/vendedoraController';

const router = Router();

// Ruta pública (sin autenticación)
router.get('/buscar/:cedula', buscarVendedoraController);

// Rutas protegidas
router.get('/', autenticar, listarVendedorasController);
router.post('/', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), crearVendedoraController);
router.put('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL', 'GERENTE_ZONA'), actualizarVendedoraController);
router.delete('/:id', autenticar, permitirRoles('ADMIN', 'GERENTE_REGIONAL'), eliminarVendedoraController);

export default router;