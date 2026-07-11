import LayoutGerente from '../../components/LayoutGerente';
import VendedorasList from '../../components/admin/VendedorasList';

function GerenteVendedorasActivas() {
  return (
    <LayoutGerente title="Vendedoras Activas">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
        mode="buenas"
        title="Vendedoras activas"
      />
    </LayoutGerente>
  );
}

export default GerenteVendedorasActivas;
