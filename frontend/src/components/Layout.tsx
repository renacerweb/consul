/**
 * COMPONENTE LAYOUT GENÉRICO
 * 
 * Estructura base para paneles protegidos (Admin, Auxiliar, Gerente)
 * - Sidebar configurable con menú dinámico
 * - Header con logout
 * - Diseño responsive
 * - Accesibilidad mejorada
 */

import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback, useMemo } from 'react';
import { Menu, X, LogOut, Home } from 'lucide-react';

interface MenuItem {
  to: string;
  label: string;
  icon: string;
}

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  menuItems: MenuItem[];
  sidebarBg: string;
  sidebarBorder: string;
  sidebarHover: string;
  userBg: string;
  panelTitle: string;
  showMobileMenu?: boolean;
}

function Layout({
  children,
  title,
  menuItems,
  sidebarBg,
  sidebarBorder,
  sidebarHover,
  userBg,
  panelTitle,
  showMobileMenu = true
}: LayoutProps) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Memoizar usuario para evitar re-parsing
  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || '{}');
    } catch (error) {
      console.error('Error parsing usuario from localStorage:', error);
      return {};
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }, [navigate]);

  const toggleMenu = useCallback(() => setMenuAbierto(prev => !prev), []);
  const closeMenu = useCallback(() => setMenuAbierto(false), []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && menuAbierto) closeMenu();
  }, [menuAbierto, closeMenu]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" onKeyDown={handleKeyDown}>
      {/* Sidebar Desktop */}
      <div className={`hidden md:block fixed left-0 top-0 h-full w-64 ${sidebarBg} shadow-2xl backdrop-blur-sm`}>
        <div className={`p-6 border-b ${sidebarBorder}`}>
          <div className="flex justify-center">
            <img
              src="/logo.png"
              alt="Logo Renacer"
              className="h-16 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-white/80 text-center text-sm mt-2">{panelTitle}</p>
        </div>

        <div className={`p-4 border-b ${sidebarBorder} ${userBg}`}>
          <p className="text-sm text-white/90">👤 {usuario.nombre || 'Usuario'}</p>
          <p className="text-xs text-white/60">Rol: {usuario.rol || 'Desconocido'}</p>
        </div>

        <nav className="mt-4 px-3 space-y-1" role="navigation" aria-label="Menú principal">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 block py-2 px-6 text-white/80 hover:text-white hover:${sidebarHover} rounded-xl transition-all duration-200`}
              aria-label={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full text-left block py-2 px-6 text-white/80 hover:text-red-400 hover:${sidebarHover} rounded-xl transition-all duration-200 mt-4`}
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>

      {/* Sidebar Móvil */}
      {showMobileMenu && menuAbierto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          onClick={closeMenu}
          role="dialog"
          aria-modal="true"
          aria-label="Menú móvil"
        >
          <div className={`${sidebarBg} w-64 h-full p-4 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex justify-between items-center mb-4 pb-4 border-b ${sidebarBorder}`}>
              <img
                src="/logo.png"
                alt="Logo Renacer"
                className="h-12 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <button
                onClick={closeMenu}
                className="text-white/80 hover:text-white text-2xl"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`mb-4 pb-4 border-b ${sidebarBorder}`}>
              <p className="text-sm text-white/90">👤 {usuario.nombre || 'Usuario'}</p>
              <p className="text-xs text-white/60">Rol: {usuario.rol || 'Desconocido'}</p>
            </div>
            <nav onClick={closeMenu} className="space-y-1" role="navigation" aria-label="Menú móvil">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 block py-2 px-4 text-white/80 hover:text-white hover:${sidebarHover} rounded-xl transition-all duration-200`}
                  aria-label={item.label}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-3 w-full text-left block py-2 px-4 text-white/80 hover:text-red-400 hover:${sidebarHover} rounded-xl transition-all duration-200 mt-4`}
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="md:ml-64">
        <header className="bg-white/80 backdrop-blur-md shadow-sm px-4 md:px-6 py-3 md:py-4 flex justify-between items-center border-b border-white/20 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {showMobileMenu && (
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-lg bg-white/80 shadow-md text-renacer-600"
                aria-label="Abrir menú móvil"
                aria-expanded={menuAbierto}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 group" aria-label="Ir al inicio">
              <img
                src="/logo.png"
                alt="Logo Renacer"
                className="h-8 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:opacity-80 transition">
                Inicio
              </span>
            </Link>
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-800">{title}</h2>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;