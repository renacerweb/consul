/**
 * SERVICIO DE API (AXIOS)
 * Configuración central de todas las llamadas al backend
 * Backend alojado en Render
 */

import axios from 'axios';

// URL del backend en Render (fija, sin import.meta.env)
const API_URL = 'https://sistema-renacer-api.onrender.com/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

/**
 * INTERCEPTOR DE PETICIONES (REQUEST)
 * Agrega automáticamente el token JWT a los headers
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * INTERCEPTOR DE RESPUESTAS (RESPONSE)
 * Maneja errores 401 (token expirado)
 */
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