import { useMemo } from 'react';
import Layout from './Layout';
import { LAYOUT_CONFIGS } from '../constants/layout';
import { isGerenteZonaCampanasEnabled, isGerenteColeccionesEnabled } from '../utils/featureFlags';

interface LayoutGerenteRegionalProps {
  children: React.ReactNode;
  title: string;
}

function LayoutGerenteRegional({ children, title }: LayoutGerenteRegionalProps) {
  const config = LAYOUT_CONFIGS.GERENTE_REGIONAL;
  const gerenteZonaCampanasEnabled = isGerenteZonaCampanasEnabled();
  const gerenteColeccionesEnabled = isGerenteColeccionesEnabled();

  const menuItems = useMemo(
    () => config.menuItems.filter((item) => {
      if (item.to === '/gerente-regional/campanas' || item.to === '/gerente-regional/campanas-historial') {
        return gerenteZonaCampanasEnabled;
      }
      if (item.to === '/gerente-regional/colecciones') {
        return gerenteColeccionesEnabled;
      }
      return true;
    }),
    [config.menuItems, gerenteZonaCampanasEnabled, gerenteColeccionesEnabled]
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

export default LayoutGerenteRegional;