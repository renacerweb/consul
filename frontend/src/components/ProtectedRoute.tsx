import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'ADMIN' | 'GERENTE_REGIONAL' | 'GERENTE_ZONA' | 'AUXILIAR'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, usuario, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verificando autenticación..." overlay />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && usuario && !allowedRoles.includes(usuario.rol as any)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};