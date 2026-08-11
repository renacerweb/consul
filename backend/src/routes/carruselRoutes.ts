import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { Router } from 'express';
import { getCarruselController, saveCarruselController, uploadCarruselImageController } from '../controllers/carruselController';
import { autenticar, permitirRoles } from '../middleware/auth';

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads', 'carrusel');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.test(ext));
  }
});

router.get('/', getCarruselController);
router.post('/upload', autenticar, permitirRoles('ADMIN'), upload.single('image'), uploadCarruselImageController);
router.put('/', autenticar, permitirRoles('ADMIN'), saveCarruselController);

export default router;
