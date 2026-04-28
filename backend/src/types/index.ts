// backend/src/types/index.ts

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  password: string;
  rol: 'ADMIN' | 'GERENTE_REGIONAL' | 'GERENTE_ZONA' | 'AUXILIAR';
  regionId: number | null;
  creadoPorId: number | null;
  activo: boolean;
  createdAt: Date;
}

export interface Vendedora {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  direccion: string | null;
  reputacion: string;
  regionId: number | null;
  creadaPorId: number | null;
  gerenteZonaId: number | null;
  createdAt: Date;
}

export interface Region {
  id: number;
  nombre: string;
  createdAt: Date;
}

export interface HistorialVendedora {
  id: number;
  vendedoraId: number;
  gerenteZonaId: number | null;
  reputacion: string;
  fechaReporte: Date;
  createdAt: Date;
}

export interface Mensaje {
  id: number;
  titulo: string;
  contenido: string;
  remitenteId: number;
  destinatarioId: number | null;
  paraTodosGerentes: boolean;
  leido: boolean;
  createdAt: Date;
}

export interface AuditoriaConsulta {
  id: number;
  cedulaConsultada: string;
  usuarioId: number | null;
  ip: string;
  userAgent: string | null;
  exitosa: boolean;
  fecha: Date;
}

export interface IPBloqueada {
  id: number;
  ip: string;
  motivo: string | null;
  fechaBloqueo: Date;
  fechaExpiracion: Date | null;
  intentosRegistrados: number;
}

export interface IntentoFallido {
  id: number;
  ip: string;
  tipo: string;
  detalle: string | null;
  fecha: Date;
}