// backend/src/controllers/vendedoraController.ts
import { Request, Response } from 'express';
import { 
  listarVendedorasConRelaciones, 
  obtenerVendedoraConHistorial, 
  crearVendedora, 
  actualizarReputacionVendedora, 
  eliminarVendedora 
} from '../services/vendedoraService';
import { registrarAuditoriaConsulta } from '../services/auditService';

// =====================================================
// LISTAR VENDEDORAS (con filtros opcionales)
// =====================================================
export async function listarVendedorasController(req: Request, res: Response) {
  try {
    const { regionId, gerenteZonaId, creadaPorId } = req.query;
    const usuario = (req as any).usuario;

    // Si es GERENTE_ZONA, solo ver sus vendedoras
    let filtros: any = {};
    
    if (usuario.rol === 'GERENTE_ZONA') {
      filtros.creadaPorId = usuario.id;
    } else {
      if (regionId) filtros.regionId = parseInt(regionId as string);
      if (gerenteZonaId) filtros.gerenteZonaId = parseInt(gerenteZonaId as string);
      if (creadaPorId) filtros.creadaPorId = parseInt(creadaPorId as string);
    }

    const vendedoras = await listarVendedorasConRelaciones(filtros);
    res.json(vendedoras);
  } catch (error: any) {
    console.error('Error al listar vendedoras:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// BUSCAR VENDEDORA POR CÉDULA (público + auditoría)
// =====================================================
export async function buscarVendedoraController(req: Request, res: Response) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { cedula } = req.params;
  const usuario = (req as any).usuario;

  try {
    const vendedora = await obtenerVendedoraConHistorial(cedula);
    const exitosa = !!vendedora;

    // Registrar auditoría
    await registrarAuditoriaConsulta(
      cedula,
      usuario?.id || null,
      ip,
      req.headers['user-agent'] as string | undefined,
      exitosa
    );

    if (!exitosa) {
      return res.status(404).json({ mensaje: 'Vendedora no encontrada' });
    }

    res.json(vendedora);
  } catch (error: any) {
    await registrarAuditoriaConsulta(cedula, usuario?.id || null, ip, req.headers['user-agent'] as string | undefined, false);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// CREAR VENDEDORA
// =====================================================
export async function crearVendedoraController(req: Request, res: Response) {
  try {
    const { nombre, cedula, reputacion, telefono, direccion, regionId, gerenteZonaId } = req.body;
    const usuario = (req as any).usuario;

    // Validar que tenga región
    let finalRegionId = regionId;
    if (!finalRegionId && usuario.regionId) {
      finalRegionId = usuario.regionId;
    }

    if (!finalRegionId) {
      return res.status(400).json({ error: 'Debes seleccionar una región' });
    }

    const vendedora = await crearVendedora({
      nombre,
      cedula,
      reputacion: reputacion || 'BUENA',
      telefono,
      direccion,
      regionId: finalRegionId,
      creadaPorId: usuario.id,
      gerenteZonaId: gerenteZonaId || null
    });

    res.status(201).json({ mensaje: 'Vendedora registrada correctamente', vendedora });
  } catch (error: any) {
    console.error('Error al crear vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// ACTUALIZAR REPUTACIÓN DE VENDEDORA
// =====================================================
export async function actualizarVendedoraController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reputacion } = req.body;
    const usuario = (req as any).usuario;

    if (!reputacion) {
      return res.status(400).json({ error: 'La reputación es requerida' });
    }

    await actualizarReputacionVendedora(parseInt(id), reputacion, usuario.id);

    res.json({ mensaje: 'Reputación actualizada correctamente' });
  } catch (error: any) {
    console.error('Error al actualizar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}

// =====================================================
// ELIMINAR VENDEDORA
// =====================================================
export async function eliminarVendedoraController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const usuario = (req as any).usuario;

    // Solo ADMIN puede eliminar
    if (usuario.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar vendedoras' });
    }

    const vendedora = await eliminarVendedora(parseInt(id));
    if (!vendedora) {
      return res.status(404).json({ error: 'Vendedora no encontrada' });
    }

    res.json({ mensaje: 'Vendedora eliminada correctamente', vendedora });
  } catch (error: any) {
    console.error('Error al eliminar vendedora:', error);
    res.status(500).json({ error: error.message });
  }
}