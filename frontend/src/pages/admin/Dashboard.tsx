import LayoutAdmin from '../../components/LayoutAdmin';
import DashboardStats from '../../components/admin/DashboardStats';

function AdminDashboard() {
  return (
    <LayoutAdmin title="Dashboard Administrador">
      <DashboardStats />
    </LayoutAdmin>
  );
}

export default AdminDashboard;