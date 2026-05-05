import Layout from './Layout';
import { LAYOUT_CONFIGS } from '../constants/layout';

interface LayoutGerenteRegionalProps {
  children: React.ReactNode;
  title: string;
}

function LayoutGerenteRegional({ children, title }: LayoutGerenteRegionalProps) {
  const config = LAYOUT_CONFIGS.GERENTE_REGIONAL;
  return (
    <Layout
      title={title}
      menuItems={config.menuItems}
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