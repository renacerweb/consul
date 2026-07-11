import LayoutAdmin from '../../components/LayoutAdmin';
import VendedorasList from '../../components/admin/VendedorasList';

function AdminVendedorasActivas() {
  return (
    <LayoutAdmin title="Vendedoras Activas">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
        mode="buenas"
        title="Gestión de vendedoras activas"
      />
    </LayoutAdmin>
  );
}

export default AdminVendedorasActivas;
