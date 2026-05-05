import axios from 'axios';
import { Vendedora, CreateVendedoraRequest, Region } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =====================================================
// SERVICIOS DE VENDEDORAS
// =====================================================

export const vendedoraService = {
  // Listar todas las vendedoras (con filtros)
  listar: (params?: { regionId?: number; gerenteZonaId?: number }) =>
    api.get<Vendedora[]>('/vendedora', { params }),
  
  // Buscar por cédula (público)
  buscar: (cedula: string) => 
    api.get<Vendedora>(`/vendedora/buscar/${cedula}`),
  
  // Crear nueva vendedora
  crear: (data: CreateVendedoraRequest) => 
    api.post('/vendedora', data),
  
  // Actualizar reputación
  actualizar: (id: number, reputacion: string) => 
    api.put(`/vendedora/${id}`, { reputacion }),
  
  // Eliminar vendedora
  eliminar: (id: number) => 
    api.delete(`/vendedora/${id}`),
};

// =====================================================
// SERVICIOS DE REGIONES
// =====================================================
export const regionService = {
  listar: () => 
    api.get<Region[]>('/regiones'),
};

export default api;