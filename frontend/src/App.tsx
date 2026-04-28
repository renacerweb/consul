import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

/**
 * COMPONENTES CON LAZY LOADING
 * Los componentes se cargan solo cuando son necesarios,
 * mejorando el tiempo de carga inicial de la aplicación
 */
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));
const AdminVendedoras = lazy(() => import('./pages/admin/Vendedoras'));
const AuxiliarDashboard = lazy(() => import('./pages/auxiliar/Dashboard'));
const GerenteDashboard = lazy(() => import('./pages/gerente/Dashboard'));
const AdminMensajes = lazy(() => import('./pages/admin/Mensajes'));
const GerenteMensajes = lazy(() => import('./pages/gerente/Mensajes'));
const AdminSeguridad = lazy(() => import('./pages/admin/Seguridad'));

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 * 
 * Implementa lazy loading para todas las rutas, mejorando la performance
 * y reduciendo el bundle inicial. Incluye Suspense para mostrar loading
 * mientras se cargan los componentes.
 * 
 * AHORA CON PROTECCIÓN DE RUTAS:
 * - Las rutas de admin solo accesibles para usuarios con rol ADMIN
 * - Las rutas de gerente solo accesibles para usuarios con rol GERENTE_ZONA
 * - Las rutas de auxiliar solo accesibles para usuarios con rol AUXILIAR
 * - Usuarios no autenticados son redirigidos a /login
 */
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner message="Cargando aplicación..." overlay />}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              {/* Rutas protegidas - SOLO ADMIN */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/usuarios" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsuarios />
                </ProtectedRoute>
              } />
              <Route path="/admin/vendedoras" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVendedoras />
                </ProtectedRoute>
              } />
              <Route path="/admin/mensajes" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminMensajes />
                </ProtectedRoute>
              } />
              <Route path="/admin/seguridad" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminSeguridad />
                </ProtectedRoute>
              } />
              
              {/* Rutas protegidas - SOLO GERENTE_ZONA */}
              <Route path="/gerente" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteDashboard />
                </ProtectedRoute>
              } />
              <Route path="/gerente/mensajes" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteMensajes />
                </ProtectedRoute>
              } />
              
              {/* Rutas protegidas - SOLO AUXILIAR */}
              <Route path="/auxiliar" element={
                <ProtectedRoute allowedRoles={['AUXILIAR']}>
                  <AuxiliarDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
