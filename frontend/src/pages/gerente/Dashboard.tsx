import LayoutGerente from '../../components/LayoutGerente';
import Dashboard from '../../components/Dashboard';

function GerenteDashboard() {
  return (
    <LayoutGerente title="Dashboard Gerente">
      <Dashboard
        rol="GERENTE"
        title="Dashboard Gerente"
        canEdit={true}
        canDelete={false}
      />
    </LayoutGerente>
  );
}

export default GerenteDashboard;