import { useEffect, useState } from 'react';
import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import api from '../../services/api';

interface HistorialCampania {
  id: number;
  vendedoraId: number;
  vendedoraNombre: string;
  cedula: string;
  gerenteZonaId?: number;
  gerenteZonaNombre?: string;
  campaniaId: number;
  campaniaNombre?: string;
  campaniaDescripcion?: string;
  accion: string;
  createdAt: string;
}

function GerenteRegionalCampanasHistorial() {
  const [historial, setHistorial] = useState<HistorialCampania[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await api.get<HistorialCampania[]>('/campania/historial');
        setHistorial(response.data);
      } catch (err: any) {
        console.error('Error cargando historial de campañas:', err);
        setError(err.response?.data?.error || 'No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    cargarHistorial();
  }, []);

  return (
    <LayoutGerenteRegional title="Historial de Campañas">
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Consulta todas las participaciones y finalizaciones de campañas en tu región.
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Movimientos de campañas</h2>
              <p className="text-sm text-slate-500">Total: {historial.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : historial.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No hay registros de historial de campañas para tu región.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Campaña</th>
                    <th className="px-4 py-3 text-left font-semibold">Vendedora</th>
                    <th className="px-4 py-3 text-left font-semibold">Cédula</th>
                    <th className="px-4 py-3 text-left font-semibold">Gerente de zona</th>
                    <th className="px-4 py-3 text-left font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historial.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{item.campaniaNombre || `Campaña #${item.campaniaId}`}</div>
                        {item.campaniaDescripcion ? <div className="text-xs text-slate-500">{item.campaniaDescripcion}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">{item.vendedoraNombre}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{item.cedula}</td>
                      <td className="px-4 py-3 text-slate-800">{item.gerenteZonaNombre || 'Sin gerente de zona'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.accion === 'FINALIZADA' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.accion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalCampanasHistorial;
