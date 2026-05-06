import LayoutAuxiliar from '../../components/LayoutAuxiliar';
import VendedorasList from '../../components/admin/VendedorasList';

function AuxiliarVendedoras() {
  return (
    <LayoutAuxiliar title="Vendedoras">
      <VendedorasList
        canEdit={true}
        canDelete={false}
        canCreate={true}
      />
    </LayoutAuxiliar>
  );
}

export default AuxiliarVendedoras;