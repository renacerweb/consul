import LayoutAdmin from '../../components/LayoutAdmin';
import VendedorasList from '../../components/admin/VendedorasList';

function AdminVendedoras() {
  return (
    <LayoutAdmin title="Gestión de Vendedoras">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
      />
    </LayoutAdmin>
  );
}

export default AdminVendedoras;