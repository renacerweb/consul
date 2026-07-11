import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import VendedorasList from '../../components/admin/VendedorasList';

function GerenteRegionalVendedorasActivas() {
  return (
    <LayoutGerenteRegional title="Vendedoras Activas">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
        mode="buenas"
        title="Vendedoras activas"
      />
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalVendedorasActivas;
