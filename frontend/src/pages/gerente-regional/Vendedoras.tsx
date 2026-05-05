import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import VendedorasList from '../../components/admin/VendedorasList';

function GerenteRegionalVendedoras() {
  return (
    <LayoutGerenteRegional title="Gestión de Vendedoras">
      <VendedorasList
        canEdit={true}
        canDelete={false}
        canCreate={true}
      />
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalVendedoras;