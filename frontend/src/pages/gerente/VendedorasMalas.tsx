import LayoutGerente from '../../components/LayoutGerente';
import VendedorasList from '../../components/admin/VendedorasList';

function GerenteVendedorasMalas() {
  return (
    <LayoutGerente title="Vendedoras Malas">
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
        mode="malas"
        title="Vendedoras malas"
      />
    </LayoutGerente>
  );
}

export default GerenteVendedorasMalas;
