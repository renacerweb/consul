import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'GERENTE_REGIONAL' | 'GERENTE_ZONA' | 'AUXILIAR';
  gerenteZonaId?: number;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsuario = localStorage.getItem('usuario');
    
    if (token && storedUsuario) {
      setUsuario(JSON.parse(storedUsuario));
      api.get('/auth/me').catch(() => logout());
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, usuario } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setUsuario(usuario);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rememberedEmail');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      loading,
      login,
      logout,
      isAuthenticated: !!usuario
    }}>
      {children}
    </AuthContext.Provider>
  );
};
