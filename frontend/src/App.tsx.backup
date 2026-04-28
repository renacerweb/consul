import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';

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
 */
function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner message="Cargando aplicación..." overlay />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/vendedoras" element={<AdminVendedoras />} />
          <Route path="/auxiliar" element={<AuxiliarDashboard />} />
          <Route path="/gerente" element={<GerenteDashboard />} />
          <Route path="/admin/mensajes" element={<AdminMensajes />} />
          <Route path="/gerente/mensajes" element={<GerenteMensajes />} />
          <Route path="/admin/seguridad" element={<AdminSeguridad />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;