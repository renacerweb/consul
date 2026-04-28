import { Router } from 'express';
import { autenticar, permitirRoles } from '../middleware/auth';
import pool from '../db';

const router = Router();

// GET - Listar IPs bloqueadas
router.get('/ips-bloqueadas', autenticar, permitirRoles('ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM "IPBloqueada" ORDER BY "fechaBloqueo" DESC`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Listar auditoría
router.get('/auditoria', autenticar, permitirRoles('ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM "AuditoriaConsulta" ORDER BY fecha DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Desbloquear IP (código que faltaba)
router.delete('/ips-bloqueadas/:id', autenticar, permitirRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM "IPBloqueada" WHERE id = $1`, [id]);
    res.json({ mensaje: 'IP desbloqueada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
