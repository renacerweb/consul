import LayoutAdmin from '../../components/LayoutAdmin';
import VendedorasList from '../../components/admin/VendedorasList';

function AdminVendedorasMalas() {
  return (
    <LayoutAdmin title="Vendedoras Malas">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
        mode="malas"
        title="Gestión de vendedoras malas"
      />
    </LayoutAdmin>
  );
}

export default AdminVendedorasMalas;
