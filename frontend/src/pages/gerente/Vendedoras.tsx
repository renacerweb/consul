import LayoutGerente from '../../components/LayoutGerente';
import VendedorasList from '../../components/admin/VendedorasList';

function GerenteVendedoras() {
  return (
    <LayoutGerente title="Mis Vendedoras">
      <VendedorasList
        canEdit={true}
        canDelete={false}
        canCreate={true}
      />
    </LayoutGerente>
  );
}

export default GerenteVendedoras;