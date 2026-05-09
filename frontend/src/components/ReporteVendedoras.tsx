import { useState, useEffect } from 'react';
import { vendedoraService } from '../services/api';
import { Vendedora } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const OPCIONES_REPUTACION = [
  'BUENA',
  'REGULAR',
  'DUDOSA',
  'MALA',
  'RESTRINGIDA',
  'OBSERVADA'
];

export const ReporteVendedoras = ({ isOpen, onClose }: Props) => {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reputacionesSeleccionadas, setReputacionesSeleccionadas] = useState<string[]>(['MALA', 'DUDOSA']);

  useEffect(() => {
    if (isOpen) {
      cargarReporte();
    }
  }, [isOpen, reputacionesSeleccionadas]);

  const cargarReporte = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await vendedoraService.obtenerReporte(reputacionesSeleccionadas);
      setVendedoras(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (reputacion: string) => {
    setReputacionesSeleccionadas(prev =>
      prev.includes(reputacion) ? prev.filter(r => r !== reputacion) : [...prev, reputacion]
    );
  };

  const handleImprimir = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-transparent">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto print:shadow-none print:max-h-none">
        <div className="sticky top-0 bg-white border-b p-4 print:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">📋 Reporte de Vendedoras por Reputación</h2>
            <div className="space-x-2">
              <button onClick={handleImprimir} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                🖨️ Imprimir
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">
                Cerrar
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center border-t pt-3">
            <span className="font-semibold">Filtrar por reputación:</span>
            {OPCIONES_REPUTACION.map(rep => (
              <label key={rep} className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={reputacionesSeleccionadas.includes(rep)}
                  onChange={() => handleCheckboxChange(rep)}
                  className="form-checkbox"
                />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                  ${rep === 'BUENA' ? 'bg-green-100 text-green-800' : ''}
                  ${rep === 'REGULAR' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${rep === 'DUDOSA' ? 'bg-orange-100 text-orange-800' : ''}
                  ${rep === 'MALA' ? 'bg-red-100 text-red-800' : ''}
                  ${rep === 'RESTRINGIDA' ? 'bg-gray-800 text-white' : ''}
                  ${rep === 'OBSERVADA' ? 'bg-purple-100 text-purple-800' : ''}
                `}>
                  {rep}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-4">
          {loading && <p className="text-center">Cargando...</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">Nombre</th>
                    <th className="border p-2 text-left">Cédula</th>
                    <th className="border p-2 text-left">Teléfono</th>
                    <th className="border p-2 text-left">Dirección</th>
                    <th className="border p-2 text-left">Reputación</th>
                    <th className="border p-2 text-left">Región</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedoras.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-4">No hay vendedoras con las reputaciones seleccionadas.</td></tr>
                  ) : (
                    vendedoras.map((v) => (
                      <tr key={v.id}>
                        <td className="border p-2">{v.nombre}</td>
                        <td className="border p-2">{v.cedula}</td>
                        <td className="border p-2">{v.telefono || '-'}</td>
                        <td className="border p-2">{v.direccion || '-'}</td>
                        <td className="border p-2 font-semibold">{v.reputacion}</td>
                        <td className="border p-2">{(v as any).region || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};