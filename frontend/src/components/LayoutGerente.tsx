import { useMemo } from 'react';
import Layout from './Layout';
import { LAYOUT_CONFIGS } from '../constants/layout';
import { isGerenteZonaCampanasEnabled } from '../utils/featureFlags';

interface LayoutGerenteProps {
  children: React.ReactNode;
  title: string;
}

function LayoutGerente({ children, title }: LayoutGerenteProps) {
  const config = LAYOUT_CONFIGS.GERENTE;
  const gerenteZonaCampanasEnabled = isGerenteZonaCampanasEnabled();
  const menuItems = useMemo(
    () => config.menuItems.filter((item) => item.to !== '/gerente/campanas' || gerenteZonaCampanasEnabled),
    [config.menuItems, gerenteZonaCampanasEnabled]
  );

  return (
    <Layout
      title={title}
      menuItems={menuItems}
      sidebarBg={config.sidebarBg}
      sidebarBorder={config.sidebarBorder}
      sidebarHover={config.sidebarHover}
      userBg={config.userBg}
      panelTitle={config.panelTitle}
      showMobileMenu={config.showMobileMenu}
    >
      {children}
    </Layout>
  );
}

export default LayoutGerente;