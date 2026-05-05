// Constantes para layouts y menús
export interface MenuItem {
  to: string;
  label: string;
  icon: string;
}

export interface LayoutConfig {
  menuItems: MenuItem[];
  sidebarBg: string;
  sidebarBorder: string;
  sidebarHover: string;
  userBg: string;
  panelTitle: string;
  showMobileMenu: boolean;
}

export const LAYOUT_CONFIGS: Record<string, LayoutConfig> = {
  ADMIN: {
    menuItems: [
      { to: '/admin', label: 'Inicio', icon: '📊' },
      { to: '/admin/vendedoras', label: 'Vendedoras', icon: '👩' },
      { to: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
      { to: '/admin/mensajes', label: 'Mensajes', icon: '📬' },
      { to: '/admin/seguridad', label: 'Seguridad', icon: '🛡️' },
    ],
    sidebarBg: 'bg-indigo-800',
    sidebarBorder: 'border-indigo-700',
    sidebarHover: 'bg-indigo-700',
    userBg: 'bg-indigo-900',
    panelTitle: 'Panel Administrador',
    showMobileMenu: true,
  },
  GERENTE_REGIONAL: {
    menuItems: [
      { to: '/gerente-regional', label: 'Inicio', icon: '📊' },
      { to: '/gerente-regional/usuarios', label: 'Usuarios', icon: '👥' },
      { to: '/gerente-regional/vendedoras', label: 'Vendedoras', icon: '👩' },
      { to: '/gerente-regional/mensajes', label: 'Mensajes', icon: '📬' },
    ],
    sidebarBg: 'bg-emerald-700',
    sidebarBorder: 'border-emerald-600',
    sidebarHover: 'bg-emerald-800',
    userBg: 'bg-emerald-800',
    panelTitle: 'Panel Gerente Regional',
    showMobileMenu: true,
  },
  GERENTE: {
    menuItems: [
      { to: '/gerente', label: 'Inicio', icon: '📊' },
      { to: '/gerente/vendedoras', label: 'Mis Vendedoras', icon: '👩' },
      { to: '/gerente/mensajes', label: 'Mensajes', icon: '📬' },
    ],
    sidebarBg: 'bg-amber-700',
    sidebarBorder: 'border-amber-600',
    sidebarHover: 'bg-amber-800',
    userBg: 'bg-amber-800',
    panelTitle: 'Panel Gerente de Zona',
    showMobileMenu: true,
  },
  AUXILIAR: {
    menuItems: [
      { to: '/auxiliar', label: 'Inicio', icon: '📊' },
      { to: '/auxiliar/vendedoras', label: 'Vendedoras', icon: '👩' },
      { to: '/auxiliar/mensajes', label: 'Mensajes', icon: '📬' },
    ],
    sidebarBg: 'bg-sky-700',
    sidebarBorder: 'border-sky-600',
    sidebarHover: 'bg-sky-800',
    userBg: 'bg-sky-800',
    panelTitle: 'Panel Auxiliar',
    showMobileMenu: true,
  },
};