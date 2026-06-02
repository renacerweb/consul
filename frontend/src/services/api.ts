import axios from 'axios';
import { Vendedora, CreateVendedoraRequest, Region } from '../types';

const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const API_URL = typeof rawApiUrl === 'string'
  ? rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '') + '/api'
  : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const vendedoraService = {
  listar: (params?: { regionId?: number; gerenteZonaId?: number }) =>
    api.get<Vendedora[]>('/vendedora', { params }),
  
  buscar: (cedula: string) => 
    api.get<Vendedora>(`/vendedora/buscar/${cedula}`),
  
  crear: (data: CreateVendedoraRequest) => 
    api.post('/vendedora', data),
  
  actualizar: (id: number, reputacion: string) => 
    api.put(`/vendedora/${id}`, { reputacion }),
  
  eliminar: (id: number) => 
    api.delete(`/vendedora/${id}`),

  // Nuevo: reporte con reputaciones múltiples
  obtenerReporte: (reputaciones?: string[]) => {
    const params = reputaciones && reputaciones.length ? { reputaciones: reputaciones.join(',') } : {};
    return api.get<Vendedora[]>('/vendedora/reporte', { params });
  },
};

export const regionService = {
  listar: () => 
    api.get<Region[]>('/regiones'),
};

export default api;