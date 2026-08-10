import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SidebarExportModal from './SidebarExportModal';

interface MenuItemProps {
  to: string;
  label: string;
  icon: ReactNode;
  iconColor?: string;
  section?: string;
}

interface LayoutProps {
  children: ReactNode;
  title: string;
  menuItems: MenuItemProps[];
  sidebarBg: string;
  sidebarBorder: string;
  sidebarHover: string;
  userBg: string;
  panelTitle: string;
  showMobileMenu?: boolean;
}

const Layout = ({ children, title, menuItems, sidebarBg, sidebarBorder, sidebarHover, panelTitle }: LayoutProps) => {
  const { logout, usuario } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getRoleLabel = (rol?: string) => {
    switch (rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'GERENTE_REGIONAL':
        return 'Gerente Regional';
      case 'GERENTE_ZONA':
        return 'Gerente de Zona';
      case 'AUXILIAR':
        return 'Auxiliar';
      default:
        return 'Invitado';
    }
  };

  const roleLabel = getRoleLabel(usuario?.rol);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Sistema Interno</h1>
          <p className="text-sm text-slate-600">Rol: {roleLabel}</p>
        </div>
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
          aria-label="Abrir menú"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      <div className="md:flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transition-transform duration-200 md:relative md:w-64 md:shadow-none ${sidebarBg} ${mobileOpen ? 'block translate-x-0' : 'hidden -translate-x-full'} md:block md:translate-x-0`}
        >
          <div className={`h-full flex flex-col text-white ${sidebarBg}`}>
            <div className={`p-5 border-b ${sidebarBorder}`}>
              <h1 className="text-xl font-bold text-white">Sistema Interno</h1>
              <div className="mt-3 flex flex-col gap-1 text-xs text-slate-300">
                <span>Rol: <span className="text-white font-medium">{roleLabel}</span></span>
                {usuario && (
                  <span className="truncate">{usuario.email}</span>
                )}
              </div>
            </div>
            <div className="p-4 border-b border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1.5">
                {menuItems.map((item, index) => {
                  const previous = menuItems[index - 1];
                  const showDivider = item.section && previous?.section !== item.section;
                  return (
                    <li key={item.to}>
                      {showDivider && <div className="border-t border-white/10 my-2" />}
                      {item.to.startsWith('action:') ? (
                        <button
                          onClick={() => {
                            setMobileOpen(false);
                            window.dispatchEvent(new CustomEvent('app:sidebar-action', { detail: item.to }));
                          }}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:${sidebarHover} text-gray-300 hover:text-white`}
                        >
                          <span className={`text-xl ${item.iconColor || 'text-slate-100'}`}>{item.icon}</span>
                          <span className="font-medium text-sm text-slate-100">{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:${sidebarHover} text-slate-200 hover:text-white`}
                        >
                          <span className={`text-lg ${item.iconColor || 'text-slate-100'}`}>{item.icon}</span>
                          <span className="font-medium text-sm text-slate-100">{item.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Modal global para exportar vendedoras desde el sidebar */}
        <SidebarExportModal />

        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            aria-label="Cerrar menú"
          />
        )}

        <main className="flex-1 min-h-screen">
          <div className="min-h-screen p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
