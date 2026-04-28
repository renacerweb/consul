import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title: string;
  menuItems: { to: string; label: string; icon: string }[];
  sidebarBg: string;
  sidebarBorder: string;
  sidebarHover: string;
  userBg: string;
  panelTitle: string;
  showMobileMenu?: boolean;
}

const Layout = ({ children, title, menuItems, sidebarBg, sidebarBorder, sidebarHover, panelTitle }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`w-64 ${sidebarBg} text-white flex flex-col shadow-xl`}>
        <div className={`p-5 border-b ${sidebarBorder}`}>
          <h1 className={`text-xl font-bold ${panelTitle === 'Sistema interno' ? 'text-white' : panelTitle}`}>Sistema Interno</h1>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-300">
            <span>Rol: <span className="text-white font-medium">{title}</span></span>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.to}>
                <a href={item.to} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 hover:${sidebarHover} text-gray-300 hover:text-white`}>
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10">
          <a href="/login" className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <span>🚪</span>
            <span className="text-sm">Cerrar Sesión</span>
          </a>
        </div>
      </div>
      <main className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;