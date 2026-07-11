import { useEffect, useMemo, useState } from 'react';
import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import api from '../../services/api';

interface GerenteZona {
  id: number;
  nombre: string;
  email: string;
  region?: string;
}

interface ColeccionItem {
  gerenteZonaId: number;
  gerenteZonaNombre: string;
  gerenteZonaEmail: string;
  cantidad: number;
}

function GerenteRegionalColecciones() {
  const [gerentes, setGerentes] = useState<GerenteZona[]>([]);
  const [campanias, setCampanias] = useState<any[]>([]);
  const [selectedCampaniaId, setSelectedCampaniaId] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Todas');
  const [colecciones, setColecciones] = useState<ColeccionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [gerentesRes, campaniasRes] = await Promise.all([
          api.get<GerenteZona[]>('/auth/gerentes-zona'),
          api.get('/campania'),
        ]);

        setGerentes(gerentesRes.data || []);
        setCampanias(campaniasRes.data || []);

        if (campaniasRes.data.length > 0) {
          setSelectedCampaniaId(campaniasRes.data[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const cargarColecciones = async (campaniaId: number) => {
    try {
      const res = await api.get<ColeccionItem[]>(`/coleccion/${campaniaId}`);
      setColecciones(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al cargar colecciones');
      setColecciones([]);
    }
  };

  const handleCampaniaChange = async (campaniaId: number) => {
    setSelectedCampaniaId(campaniaId);
    await cargarColecciones(campaniaId);
  };

  const handleGuardar = async () => {
    if (selectedCampaniaId === null) return;

    try {
      await api.post('/coleccion', {
        campaniaId: selectedCampaniaId,
        valores: colecciones.map((item) => ({
          gerenteZonaId: item.gerenteZonaId,
          cantidad: item.cantidad,
        })),
      });
      setError('Guardado correctamente');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar colecciones');
    }
  };

  const updateCantidad = (gerenteZonaId: number, cantidad: number) => {
    setColecciones((prev) => prev.map((item) => item.gerenteZonaId === gerenteZonaId ? { ...item, cantidad } : item));
  };

  useEffect(() => {
    if (selectedCampaniaId !== null) {
      cargarColecciones(selectedCampaniaId);
    }
  }, [selectedCampaniaId]);

  useEffect(() => {
    if (!selectedCampaniaId || gerentes.length === 0) return;

    setColecciones((prev) => {
      const existentes = prev.reduce((acc: Record<number, ColeccionItem>, item) => {
        acc[item.gerenteZonaId] = item;
        return acc;
      }, {} as Record<number, ColeccionItem>);

      return gerentes.map((gerente) => ({
        gerenteZonaId: gerente.id,
        gerenteZonaNombre: gerente.nombre,
        gerenteZonaEmail: gerente.email,
        cantidad: existentes[gerente.id]?.cantidad ?? 0,
      }));
    });
  }, [gerentes, selectedCampaniaId]);

  const regionesDisponibles = useMemo(() => {
    const regiones = Array.from(new Set(gerentes.map((g) => g.region || 'Sin región')));
    return ['Todas', ...regiones];
  }, [gerentes]);

  const coleccionesFiltradas = useMemo(() => {
    if (selectedRegion === 'Todas') return colecciones;
    return colecciones.filter((item) => {
      const gerente = gerentes.find((g) => g.id === item.gerenteZonaId);
      return gerente?.region === selectedRegion;
    });
  }, [colecciones, gerentes, selectedRegion]);

  const totalColecciones = useMemo(
    () => coleccionesFiltradas.reduce((sum, item) => sum + item.cantidad, 0),
    [coleccionesFiltradas]
  );

  return (
    <LayoutGerenteRegional title="Colecciones">
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Compara campañas y carga manualmente la cantidad de colecciones por cada gerente de zona.
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2">Selecciona campaña</label>
              <select
                value={selectedCampaniaId ?? ''}
                onChange={(e) => handleCampaniaChange(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
              >
                {campanias.map((campania) => (
                  <option key={campania.id} value={campania.id}>
                    {campania.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Gerentes de Zona</h2>
                  <p className="text-sm text-slate-500">Carga aquí la cantidad de colecciones por gerente para la campaña seleccionada.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Filtrar región</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      {regionesDisponibles.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleGuardar}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-700">Gerente de Zona</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Email</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Región</th>
                      <th className="px-4 py-3 font-medium text-slate-700">Colecciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {coleccionesFiltradas.map((item) => (
                      <tr key={item.gerenteZonaId}>
                        <td className="px-4 py-3 text-slate-800">{item.gerenteZonaNombre}</td>
                        <td className="px-4 py-3 text-slate-500">{item.gerenteZonaEmail}</td>
                        <td className="px-4 py-3 text-slate-500">{gerentes.find((g) => g.id === item.gerenteZonaId)?.region || 'Sin región'}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            value={item.cantidad}
                            onChange={(e) => updateCantidad(item.gerenteZonaId, Number(e.target.value))}
                            className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-slate-800" colSpan={3}>Total colecciones</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{totalColecciones}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalColecciones;
