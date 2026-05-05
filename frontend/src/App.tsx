import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Lazy loading de páginas
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));
const AdminVendedoras = lazy(() => import('./pages/admin/Vendedoras'));
const AdminMensajes = lazy(() => import('./pages/admin/Mensajes'));
const AdminSeguridad = lazy(() => import('./pages/admin/Seguridad'));

// Gerente Regional
const GerenteRegionalDashboard = lazy(() => import('./pages/gerente-regional/Dashboard'));
const GerenteRegionalUsuarios = lazy(() => import('./pages/gerente-regional/Usuarios'));
const GerenteRegionalVendedoras = lazy(() => import('./pages/gerente-regional/Vendedoras'));

// Gerente Zona
const GerenteDashboard = lazy(() => import('./pages/gerente/Dashboard'));
const GerenteMensajes = lazy(() => import('./pages/gerente/Mensajes'));

// Auxiliar
const AuxiliarDashboard = lazy(() => import('./pages/auxiliar/Dashboard'));

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
              
              {/* Rutas ADMIN */}
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
              
              {/* Rutas GERENTE_REGIONAL */}
              <Route path="/gerente-regional" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalDashboard />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/usuarios" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalUsuarios />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/vendedoras" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalVendedoras />
                </ProtectedRoute>
              } />
              {/* Rutas GERENTE_ZONA */}
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
              
              {/* Rutas AUXILIAR */}
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