/**
 * SERVICIO DE API (AXIOS)
 * 
 * Configuración central de todas las llamadas al backend
 * - BaseURL: apunta al backend en producción o local
 * - Interceptor: agrega automáticamente el token JWT a cada petición
 * - Exporta funciones de autenticación
 */

import axios from 'axios';

// URL del backend (producción o desarrollo local)
const API_URL = import.meta.env.DEV
  ? '/api'  // En desarrollo usa el proxy de Vite
  : 'https://sistema-renacer-api.onrender.com/api';  // En producción usa la URL completa

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * INTERCEPTOR DE PETICIONES
 * Agrega automáticamente el token JWT a los headers de cada petición
 * Si el usuario está logueado, localStorage contiene el token
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Funciones de autenticación exportadas
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export default api;