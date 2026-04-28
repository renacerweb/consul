import Layout from './Layout';
import { LAYOUT_CONFIGS } from '../constants/layout';

interface LayoutGerenteProps {
  children: React.ReactNode;
  title: string;
}

function LayoutGerente({ children, title }: LayoutGerenteProps) {
  const config = LAYOUT_CONFIGS.GERENTE;
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

export default LayoutGerente;