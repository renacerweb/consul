import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/LoadingSpinner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { isGerenteZonaCampanasEnabled, isGerenteColeccionesEnabled } from './utils/featureFlags';


// Lazy loading de páginas
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Contacto = lazy(() => import('./pages/Contacto'));
const RegistroVendedora = lazy(() => import('./pages/RegistroVendedora'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsuarios = lazy(() => import('./pages/admin/Usuarios'));
const AdminVendedoras = lazy(() => import('./pages/admin/Vendedoras'));
const AdminVendedorasBuenas = lazy(() => import('./pages/admin/VendedorasActivas'));
const AdminVendedorasMalas = lazy(() => import('./pages/admin/VendedorasMalas'));
const AdminMensajes = lazy(() => import('./pages/admin/Mensajes'));
const AdminCarrusel = lazy(() => import('./pages/admin/Carrusel'));
const AdminSeguridad = lazy(() => import('./pages/admin/Seguridad'));

// Gerente Regional
const GerenteRegionalDashboard = lazy(() => import('./pages/gerente-regional/Dashboard'));
const GerenteRegionalUsuarios = lazy(() => import('./pages/gerente-regional/Usuarios'));
const GerenteRegionalVendedoras = lazy(() => import('./pages/gerente-regional/Vendedoras'));
const GerenteRegionalVendedorasBuenas = lazy(() => import('./pages/gerente-regional/VendedorasActivas'));
const GerenteRegionalVendedorasMalas = lazy(() => import('./pages/gerente-regional/VendedorasMalas'));
const GerenteRegionalMensajes = lazy(() => import('./pages/gerente-regional/Mensajes'));
const GerenteRegionalCampanas = lazy(() => import('./pages/gerente-regional/Campanas'));
const GerenteRegionalCampanasHistorial = lazy(() => import('./pages/gerente-regional/CampanasHistorial'));
const GerenteRegionalColecciones = lazy(() => import('./pages/gerente-regional/Colecciones'));
const GerenteRegionalZonas = lazy(() => import('./pages/gerente-regional/Zonas'));

// Gerente Zona
const GerenteDashboard = lazy(() => import('./pages/gerente/Dashboard'));
const GerenteMensajes = lazy(() => import('./pages/gerente/Mensajes'));
const GerenteVendedoras = lazy(() => import('./pages/gerente/Vendedoras'));
const GerenteVendedorasBuenas = lazy(() => import('./pages/gerente/VendedorasActivas'));
const GerenteVendedorasMalas = lazy(() => import('./pages/gerente/VendedorasMalas'));
const GerenteCampanas = lazy(() => import('./pages/gerente/Campanas'));

// Gerente Regional reportar gerentes
const GerenteRegionalGerentesMalas = lazy(() => import('./pages/gerente-regional/GerentesMalas'));

// Auxiliar
const AuxiliarDashboard = lazy(() => import('./pages/auxiliar/Dashboard'));
const AuxiliarVendedoras = lazy(() => import('./pages/auxiliar/Vendedoras'));

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Suspense fallback={<LoadingSpinner message="Cargando aplicación..." overlay />}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/registro-vendedora" element={<RegistroVendedora />} />
              
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
              <Route path="/admin/vendedoras-buenas" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVendedorasBuenas />
                </ProtectedRoute>
              } />
              <Route path="/admin/vendedoras-malas" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVendedorasMalas />
                </ProtectedRoute>
              } />
              <Route path="/admin/mensajes" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminMensajes />
                </ProtectedRoute>
              } />
              <Route path="/admin/carrusel" element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminCarrusel />
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
              <Route path="/gerente-regional/vendedoras-buenas" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalVendedorasBuenas />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/vendedoras-malas" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalVendedorasMalas />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/gerentes-malas" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalGerentesMalas />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/zonas" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalZonas />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/mensajes" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  <GerenteRegionalMensajes />
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/campanas" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  {isGerenteZonaCampanasEnabled() ? <GerenteRegionalCampanas /> : <Navigate to="/gerente-regional" replace />}
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/campanas-historial" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  {isGerenteZonaCampanasEnabled() ? <GerenteRegionalCampanasHistorial /> : <Navigate to="/gerente-regional" replace />}
                </ProtectedRoute>
              } />
              <Route path="/gerente-regional/colecciones" element={
                <ProtectedRoute allowedRoles={['GERENTE_REGIONAL']}>
                  {isGerenteColeccionesEnabled() ? <GerenteRegionalColecciones /> : <Navigate to="/gerente-regional" replace />}
                </ProtectedRoute>
              } />
              
              {/* Rutas GERENTE_ZONA */}
              <Route path="/gerente" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteDashboard />
                </ProtectedRoute>
              } />
              <Route path="/gerente/vendedoras" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteVendedoras />
                </ProtectedRoute>
              } />
              <Route path="/gerente/vendedoras-buenas" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteVendedorasBuenas />
                </ProtectedRoute>
              } />
              <Route path="/gerente/vendedoras-malas" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteVendedorasMalas />
                </ProtectedRoute>
              } />
              <Route path="/gerente/mensajes" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  <GerenteMensajes />
                </ProtectedRoute>
              } />
              <Route path="/gerente/campanas" element={
                <ProtectedRoute allowedRoles={['GERENTE_ZONA']}>
                  {isGerenteZonaCampanasEnabled() ? <GerenteCampanas /> : <Navigate to="/gerente" replace />}
                </ProtectedRoute>
              } />
              
              {/* Rutas AUXILIAR */}
              <Route path="/auxiliar" element={
                <ProtectedRoute allowedRoles={['AUXILIAR']}>
                  <AuxiliarDashboard />
                </ProtectedRoute>
                
              } />

              <Route path="/auxiliar/vendedoras" element={
                <ProtectedRoute allowedRoles={['AUXILIAR']}>
                  <AuxiliarVendedoras />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;