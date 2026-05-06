import axios from 'axios';
import { Vendedora, CreateVendedoraRequest, Region } from '../types';

// Usar variable de entorno con tipado seguro
const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Resto del código igual...
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
};

export const regionService = {
  listar: () => 
    api.get<Region[]>('/regiones'),
};

export default api;