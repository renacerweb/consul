import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.resolve(process.cwd(), 'data', 'carrusel.json');

const defaultSlides = [
  { title: 'Equipo profesional', subtitle: 'Imágenes reales del equipo trabajando junto a vendedoras confiables.', image: '/uploads/carrusel/default-1.jpg', alt: 'Equipo profesional colaborando' },
  { title: 'Experiencia y confianza', subtitle: 'Soluciones visuales que reflejan profesionalismo y respaldo.', image: '/uploads/carrusel/default-2.jpg', alt: 'Mujeres profesionales revisando reportes' },
  { title: 'Ventas y prendas', subtitle: 'Mujeres en ventas con enfoque en moda y control de inventario.', image: '/uploads/carrusel/default-3.jpg', alt: 'Mujeres trabajando con ropa y ventas' },
];

function readFileSafe() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error leyendo carrusel:', e);
  }
  return defaultSlides;
}

function writeFileSafe(data: any) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error guardando carrusel:', e);
    return false;
  }
}

export function getCarruselController(req: Request, res: Response) {
  const slides = readFileSafe();
  res.json(slides);
}

export function saveCarruselController(req: Request, res: Response) {
  const usuario = (req as any).usuario;
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  if (usuario.rol !== 'ADMIN') return res.status(403).json({ error: 'Sin permisos' });

  const slides = req.body;
  if (!Array.isArray(slides)) return res.status(400).json({ error: 'Payload inválido' });

  const ok = writeFileSafe(slides);
  if (!ok) return res.status(500).json({ error: 'No fue posible guardar' });

  return res.json({ ok: true });
}

export function uploadCarruselImageController(req: Request, res: Response) {
  const usuario = (req as any).usuario;
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });
  if (usuario.rol !== 'ADMIN') return res.status(403).json({ error: 'Sin permisos' });

  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió archivo' });
  }

  const url = `/uploads/carrusel/${req.file.filename}`;
  res.json({ url });
}
