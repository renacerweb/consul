import LayoutAuxiliar from '../../components/LayoutAuxiliar';
import Dashboard from '../../components/Dashboard';

function AuxiliarDashboard() {
  return (
    <LayoutAuxiliar title="Dashboard Auxiliar">
      <Dashboard
        rol="AUXILIAR"
        title="Dashboard Auxiliar"
        canEdit={false}
        canDelete={false}
      />
    </LayoutAuxiliar>
  );
}

export default AuxiliarDashboard;