import { Router } from 'express';
import { enviarContactoController } from '../controllers/contactoController';

const router = Router();

router.post('/enviar', enviarContactoController);

export default router;
