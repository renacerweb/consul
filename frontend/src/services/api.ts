/**
 * SERVICIO DE API (AXIOS)
 * Configuración central de todas las llamadas al backend
 */

import axios from 'axios';

// URL del backend en Railway (PRODUCCIÓN)
// Si estás en desarrollo local, usa el proxy de Vite (localhost:3000)
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://sistema-renacer-production.up.railway.app/api'
  : '/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('rememberedEmail');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Funciones de autenticación
export const auth = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rememberedEmail');
  },
};

export default api;