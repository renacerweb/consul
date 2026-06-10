// frontend/src/types/index.ts

export interface Region {
  id: number;
  nombre: string;
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  regionId?: number;
  region?: Region;
  activo: boolean;
}

export interface Vendedora {
  id: number;
  nombre: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
  descripcion?: string;
  reputacion: string;
  regionId?: number;
  region?: Region;
  region_nombre?: string;
  creadaPorId?: number;
  creadaPor?: Usuario;
  creada_por_nombre?: string;
  gerenteZonaId?: number;
  gerenteZona?: Usuario;
  gerente_zona_nombre?: string;
  createdAt: string;
  historial?: HistorialVendedora[];
}

export interface HistorialVendedora {
  id: number;
  reputacion: string;
  gerenteZonaNombre?: string;
  gerente_zona_nombre?: string;
  fechaReporte: string;
}

export interface CreateVendedoraRequest {
  nombre: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
  reputacion?: string;
  regionId: number;
  gerenteZonaId?: number;
}