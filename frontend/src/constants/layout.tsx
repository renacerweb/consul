import { ReactNode } from 'react';
import {
  Home,
  List,
  CheckCircle,
  Download,
  AlertTriangle,
  Users,
  MessageCircle,
  Image,
  Shield,
  Layers,
  Bell,
  Database,
} from 'lucide-react';

// Constantes para layouts y menús
export interface MenuItem {
  to: string;
  label: string;
  icon: ReactNode;
  iconColor?: string;
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
      { to: '/admin', label: 'Inicio', icon: <Home />, iconColor: 'text-cyan-200', section: 'general' },
      { to: '/admin/vendedoras', label: 'Todas', icon: <List />, iconColor: 'text-slate-100', section: 'vendedoras' },
      { to: '/admin/vendedoras-buenas', label: 'Registro Buenas', icon: <CheckCircle />, iconColor: 'text-emerald-200', section: 'vendedoras' },
      { to: '/admin/vendedoras-malas', label: 'Registro Malas', icon: <AlertTriangle />, iconColor: 'text-orange-200', section: 'vendedoras' },
      { to: 'action:export_vendedoras', label: 'Exportar', icon: <Download />, iconColor: 'text-amber-200', section: 'operaciones' },
      { to: '/admin/usuarios', label: 'Usuarios', icon: <Users />, iconColor: 'text-violet-200', section: 'operaciones' },
      { to: '/admin/mensajes', label: 'Mensajes', icon: <MessageCircle />, iconColor: 'text-sky-200', section: 'operaciones' },
      { to: '/admin/carrusel', label: 'Carrusel', icon: <Image />, iconColor: 'text-fuchsia-200', section: 'operaciones' },
      { to: '/admin/seguridad', label: 'Seguridad', icon: <Shield />, iconColor: 'text-rose-200', section: 'seguridad' },
    ],
    sidebarBg: 'bg-indigo-700',
    sidebarBorder: 'border-indigo-600',
    sidebarHover: 'bg-indigo-600',
    userBg: 'bg-indigo-700',
    panelTitle: 'Panel Administrador',
    showMobileMenu: true,
  },
  GERENTE_REGIONAL: {
    menuItems: [
      { to: '/gerente-regional', label: 'Inicio', icon: <Home />, iconColor: 'text-cyan-200', section: 'general' },
      { to: '/gerente-regional/usuarios', label: 'Usuarios', icon: <Users />, iconColor: 'text-violet-200', section: 'gestión' },
      { to: '/gerente-regional/zonas', label: 'Reporte Gerentes', icon: <Layers />, iconColor: 'text-emerald-200', section: 'gestión' },
      { to: '/gerente-regional/gerentes-malas', label: 'Cuentas Gerentes', icon: <AlertTriangle />, iconColor: 'text-orange-200', section: 'gestión' },
      { to: '/gerente-regional/vendedoras', label: 'Todas', icon: <List />, iconColor: 'text-slate-100', section: 'vendedoras' },
      { to: '/gerente-regional/vendedoras-buenas', label: 'Registro Buenas', icon: <CheckCircle />, iconColor: 'text-emerald-200', section: 'vendedoras' },
      { to: '/gerente-regional/vendedoras-malas', label: 'Registro Malas', icon: <AlertTriangle />, iconColor: 'text-orange-200', section: 'vendedoras' },
      { to: 'action:export_vendedoras', label: 'Exportar', icon: <Download />, iconColor: 'text-amber-200', section: 'operaciones' },
      { to: '/gerente-regional/campanas', label: 'Campañas', icon: <Bell />, iconColor: 'text-fuchsia-200', section: 'campañas' },
      { to: '/gerente-regional/campanas-historial', label: 'Historial Campañas', icon: <Database />, iconColor: 'text-sky-200', section: 'campañas' },
      { to: '/gerente-regional/colecciones', label: 'Colecciones', icon: <Layers />, iconColor: 'text-amber-200', section: 'campañas' },
      { to: '/gerente-regional/mensajes', label: 'Mensajes', icon: <MessageCircle />, iconColor: 'text-sky-200', section: 'campañas' },
    ],
    sidebarBg: 'bg-slate-700',
    sidebarBorder: 'border-slate-600',
    sidebarHover: 'bg-slate-600',
    userBg: 'bg-slate-700',
    panelTitle: 'Panel Gerente Regional',
    showMobileMenu: true,
  },
  GERENTE: {
    menuItems: [
      { to: '/gerente', label: 'Inicio', icon: <Home />, iconColor: 'text-cyan-200', section: 'general' },
      { to: '/gerente/vendedoras-buenas', label: 'Registro Buenas', icon: <CheckCircle />, iconColor: 'text-emerald-200', section: 'vendedoras' },
      { to: '/gerente/vendedoras-malas', label: 'Registro Malas', icon: <AlertTriangle />, iconColor: 'text-orange-200', section: 'vendedoras' },
      { to: '/gerente/campanas', label: 'Campañas', icon: <Bell />, iconColor: 'text-fuchsia-200', section: 'campañas' },
      { to: '/gerente/mensajes', label: 'Mensajes', icon: <MessageCircle />, iconColor: 'text-sky-200', section: 'campañas' },
    ],
    sidebarBg: 'bg-slate-700',
    sidebarBorder: 'border-slate-600',
    sidebarHover: 'bg-slate-600',
    userBg: 'bg-slate-700',
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