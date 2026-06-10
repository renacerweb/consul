// backend/src/types/index.ts

// =====================================================
// ENTIDADES BASE
// =====================================================

export interface Region {
  id: number;
  nombre: string;
  createdAt: Date;
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  password: string;
  rol: 'ADMIN' | 'GERENTE_REGIONAL' | 'GERENTE_ZONA' | 'AUXILIAR';
  regionId: number | null;
  region?: Region;
  creadoPorId: number | null;
  creadoPor?: Usuario;
  activo: boolean;
  createdAt: Date;
}

export interface Vendedora {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string | null;
  direccion: string | null;
  descripcion?: string | null;
  reputacion: string;
  regionId: number | null;
  region?: Region;
  creadaPorId: number | null;
  creadaPor?: Usuario;
  gerenteZonaId: number | null;
  gerenteZona?: Usuario;
  createdAt: Date;
  historial?: HistorialVendedora[];
}

export interface HistorialVendedora {
  id: number;
  vendedoraId: number;
  vendedora?: Vendedora;
  gerenteZonaId: number | null;
  gerenteZona?: Usuario;
  reputacion: string;
  fechaReporte: Date;
  createdAt: Date;
}

export interface Mensaje {
  id: number;
  titulo: string;
  contenido: string;
  remitenteId: number;
  remitente?: Usuario;
  destinatarioId: number | null;
  destinatario?: Usuario;
  paraTodosGerentes: boolean;
  leido: boolean;
  createdAt: Date;
}

// =====================================================
// ENTIDADES DE AUDITORÍA Y SEGURIDAD
// =====================================================

export interface AuditoriaConsulta {
  id: number;
  cedulaConsultada: string;
  usuarioId: number | null;
  usuario?: Usuario;
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

// =====================================================
// TIPOS PARA PETICIONES Y RESPUESTAS
// =====================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    regionId?: number;
  };
}

export interface CreateVendedoraRequest {
  nombre: string;
  cedula: string;
  telefono?: string;
  direccion?: string;
  descripcion?: string;
  reputacion?: string;
  regionId: number;
  gerenteZonaId?: number;
}

export interface CreateUsuarioRequest {
  email: string;
  nombre: string;
  password: string;
  rol: string;
  regionId?: number;
  creadoPorId?: number;
}