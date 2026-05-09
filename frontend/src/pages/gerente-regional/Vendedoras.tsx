import { useState } from 'react';
import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import VendedorasList from '../../components/admin/VendedorasList';
import { ReporteMalasReputaciones } from '../../components/ReporteMalasReputaciones';

function GerenteRegionalVendedoras() {
  const [showReporte, setShowReporte] = useState(false);

  return (
    <LayoutGerenteRegional title="Gestión de Vendedoras">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestión de Vendedoras</h1>
        <button
          onClick={() => setShowReporte(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          📊 Reporte de Malas Reputaciones
        </button>
      </div>
      <VendedorasList
        canEdit={true}
        canDelete={true}
        canCreate={true}
      />
      <ReporteMalasReputaciones
        isOpen={showReporte}
        onClose={() => setShowReporte(false)}
      />
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalVendedoras;