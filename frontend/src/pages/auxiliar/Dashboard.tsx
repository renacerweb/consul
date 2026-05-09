import { useState } from 'react';
import LayoutAuxiliar from '../../components/LayoutAuxiliar';
import Dashboard from '../../components/Dashboard';
import { ReporteVendedoras } from '../../components/ReporteVendedoras';

function AuxiliarDashboard() {
  const [showReporte, setShowReporte] = useState(false);

  return (
    <LayoutAuxiliar title="Dashboard Auxiliar">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard Auxiliar</h1>
        <button
          onClick={() => setShowReporte(true)}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          📊 Reporte de Vendedoras
        </button>
      </div>
      <Dashboard
        rol="AUXILIAR"
        title="Dashboard Auxiliar"
        canEdit={false}
        canDelete={false}
      />
      <ReporteVendedoras
        isOpen={showReporte}
        onClose={() => setShowReporte(false)}
      />
    </LayoutAuxiliar>
  );
}

export default AuxiliarDashboard;