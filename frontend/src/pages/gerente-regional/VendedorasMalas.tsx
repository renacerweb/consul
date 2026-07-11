import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import VendedorasList from '../../components/admin/VendedorasList';

function GerenteRegionalVendedorasMalas() {
  return (
    <LayoutGerenteRegional title="Vendedoras Malas">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
        mode="malas"
        title="Vendedoras malas"
      />
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalVendedorasMalas;
