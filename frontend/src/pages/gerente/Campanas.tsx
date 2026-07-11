import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LayoutGerente from '../../components/LayoutGerente';
import Modal from '../../components/Modal';
import api from '../../services/api';

interface CampaniaAsignada {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  regionId?: number;
  asignada: boolean;
}

interface VendedoraResumen {
  id: number;
  nombre: string;
  cedula: string;
  reputacion: string;
}

function GerenteCampanas() {
  const [vendedoras, setVendedoras] = useState<VendedoraResumen[]>([]);
  const [campanias, setCampanias] = useState<CampaniaAsignada[]>([]);
  const [selectedVendedoraId, setSelectedVendedoraId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [participaciones, setParticipaciones] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'campanias' | 'historial'>('campanias');
  const [showHistorialGlobalModal, setShowHistorialGlobalModal] = useState(false);
  const [historialGlobal, setHistorialGlobal] = useState<any[]>([]);
  const [participantesPorCampania, setParticipantesPorCampania] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [vendedorasRes, campaniasRes] = await Promise.all([
          api.get<VendedoraResumen[]>('/vendedora'),
          api.get<CampaniaAsignada[]>('/campania', { params: { activo: true } }),
        ]);

        setVendedoras(vendedorasRes.data);
        setCampanias(campaniasRes.data.map((campania) => ({ ...campania, asignada: false })));

        if (vendedorasRes.data.length > 0) {
          setSelectedVendedoraId(vendedorasRes.data[0].id);
        }
      } catch (error) {
        console.error('Error al cargar datos de campañas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const { usuario } = useAuth();

  const cargarParticipaciones = async () => {
    try {
      const res = await api.get('/campania/participaciones/por-gerente');
      setParticipaciones(res.data || []);
    } catch (err) {
      console.error('Error cargando participaciones:', err);
      setParticipaciones([]);
    }
  };

  const cargarHistorialGlobal = async () => {
    try {
      const res = await api.get('/campania/historial');
      setHistorialGlobal(res.data || []);
      setShowHistorialGlobalModal(true);
    } catch (err) {
      console.error('Error cargando historial global:', err);
      setHistorialGlobal([]);
    }
  };

  const cargarParticipantesDeCampania = async (campaniaId: number) => {
    try {
      const res = await api.get(`/campania/${campaniaId}/participantes`);
      setParticipantesPorCampania((prev) => ({ ...prev, [campaniaId]: res.data || [] }));
    } catch (err) {
      console.error('Error cargando participantes de campaña:', err);
      setParticipantesPorCampania((prev) => ({ ...prev, [campaniaId]: [] }));
    }
  };

  const selectedVendedora = useMemo(
    () => vendedoras.find((v) => v.id === selectedVendedoraId) || null,
    [selectedVendedoraId, vendedoras]
  );

  const filteredVendedoras = useMemo(() => {
    const keyword = busqueda.trim().toLowerCase();
    if (!keyword) return vendedoras;
    return vendedoras.filter((v) =>
      v.nombre.toLowerCase().includes(keyword) ||
      v.cedula.toLowerCase().includes(keyword)
    );
  }, [busqueda, vendedoras]);

  const assignedCount = useMemo(
    () => campanias.filter((c) => c.asignada).length,
    [campanias]
  );

  useEffect(() => {
    if (!selectedVendedoraId) return;

    const cargarCampaniasVendedora = async () => {
      try {
        const response = await api.get<CampaniaAsignada[]>(`/vendedora/${selectedVendedoraId}/campanias`);
        setCampanias(response.data);
        setMessage('');
      } catch (error) {
        console.error('Error al cargar campañas de vendedora:', error);
        setCampanias([]);
      }
    };

    cargarCampaniasVendedora();
  }, [selectedVendedoraId]);

  const handleSelectVendedora = (vendedoraId: number) => {
    setSelectedVendedoraId(vendedoraId);
    setMessage('');
  };

  const toggleCampania = (campaniaId: number) => {
    setCampanias((prev) => prev.map((campania) =>
      campania.id === campaniaId
        ? { ...campania, asignada: !campania.asignada }
        : campania
    ));
  };

  const handleGuardar = async () => {
    if (!selectedVendedoraId) return;

    setSaving(true);
    try {
      await api.put(`/vendedora/${selectedVendedoraId}/campanias`, {
        campaniaIds: campanias.filter((c) => c.asignada).map((c) => c.id),
      });
      setMessage('Campañas guardadas correctamente.');
    } catch (error: any) {
      console.error('Error al guardar campañas:', error);
      setMessage(error.response?.data?.error || 'Error al guardar las campañas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LayoutGerente title="Campañas">
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Gerente de Zona:</strong> selecciona una vendedora y asigna las campañas activas que debe llevar.
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-56">
            <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Mis vendedoras</h2>
                  <p className="text-sm text-slate-500">Busca por nombre o cédula para encontrar la vendedora rápido.</p>
                </div>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar vendedora..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-2">
                {filteredVendedoras.length === 0 ? (
                  <p className="text-sm text-slate-500">No se encontraron vendedoras con ese nombre o cédula.</p>
                ) : (
                  filteredVendedoras.map((vendedora) => (
                    <button
                      key={vendedora.id}
                      type="button"
                      onClick={() => handleSelectVendedora(vendedora.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedVendedoraId === vendedora.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="font-medium text-slate-800">{vendedora.nombre}</div>
                      <div className="text-sm text-slate-500">{vendedora.cedula}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              {selectedVendedora ? (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Campañas para {selectedVendedora.nombre}</h2>
                    <p className="text-sm text-slate-500">Marca las campañas activas que esta vendedora debe llevar en la próxima colección.</p>
                    <div className="mt-2">
                      <button type="button" className="text-sm text-amber-600" onClick={async () => {
                        setActiveTab('historial');
                        setShowHistorialModal(true);
                        try {
                          const res = await api.get('/campania/historial', { params: { vendedoraId: selectedVendedora.id } });
                          setHistorial(res.data || []);
                        } catch (err) {
                          console.error('Error cargando historial de vendedora:', err);
                          setHistorial([]);
                        }
                      }}>Ver historial de participación</button>
                      <button type="button" className="ml-3 text-sm text-amber-600" onClick={cargarHistorialGlobal}>
                        Ver historial de campañas (todas mis vendedoras)
                      </button>
                      {usuario?.rol === 'GERENTE_ZONA' && (
                        <button type="button" className="ml-3 text-sm text-amber-600" onClick={() => cargarParticipaciones()}>
                          Ver participaciones de mis vendedoras
                        </button>
                      )}
                    </div>
                  </div>

                  {campanias.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      No hay campañas activas disponibles para tu región.
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                        <strong>{assignedCount}</strong> campaña(s) asignada(s) a esta vendedora.
                      </div>
                      <div className="space-y-2">
                        {campanias.map((campania) => (
                          <label
                            key={campania.id}
                            className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${campania.asignada ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-amber-300'}`}
                          >
                            <input
                              type="checkbox"
                              checked={campania.asignada}
                              onChange={() => toggleCampania(campania.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-medium text-slate-800">{campania.nombre}</div>
                                {campania.asignada ? (
                                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                                    Asignada
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    Disponible
                                  </span>
                                )}
                              </div>
                              {campania.descripcion ? <div className="text-sm text-slate-500 mt-1">{campania.descripcion}</div> : null}
                            </div>
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={handleGuardar}
                      disabled={saving}
                      className="rounded-lg bg-amber-600 px-4 py-2 text-white disabled:opacity-70"
                    >
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    {usuario?.rol === 'GERENTE_ZONA' && participaciones.length > 0 && (
                      <div className="mt-3 sm:mt-0">
                        <h3 className="font-medium text-slate-800">Participaciones (tus vendedoras)</h3>
                        <div className="mt-2 max-h-44 overflow-y-auto border rounded bg-slate-50 p-2 text-sm">
                          <table className="w-full">
                            <thead>
                              <tr>
                                <th className="text-left px-2">Nombre</th>
                                <th className="text-left px-2">Cedula</th>
                                <th className="text-left px-2">Participaciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {participaciones.map((p) => (
                                <tr key={p.id} className="border-t">
                                  <td className="px-2 py-1">{p.nombre}</td>
                                  <td className="px-2 py-1">{p.cedula}</td>
                                  <td className="px-2 py-1">{p.participaciones}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {message && <p className="text-sm text-slate-600">{message}</p>}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Selecciona una vendedora para ver sus campañas.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Modal isOpen={showHistorialModal} onClose={() => setShowHistorialModal(false)} title={selectedVendedora ? `Historial - ${selectedVendedora.nombre}` : 'Historial'} size="lg">
        {selectedVendedora && (
          <div>
            {historial.length === 0 ? (
              <p className="text-sm text-slate-500">No hay registros de participación para esta vendedora.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {historial.map((h) => (
                  <div key={h.id} className="p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">{h.campaniaNombre}</div>
                        <div className="text-sm text-slate-500">{h.campaniaDescripcion}</div>
                      </div>
                      <div className="text-sm text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">Acción: <span className="font-medium">{h.accion}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showHistorialGlobalModal} onClose={() => setShowHistorialGlobalModal(false)} title="Historial de campañas (mis vendedoras)" size="lg">
        <div>
          {historialGlobal.length === 0 ? (
            <p className="text-sm text-slate-500">No hay registros de campañas para tus vendedoras.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.values(historialGlobal.reduce((acc: any, row: any) => {
                const id = row.campaniaId;
                if (!acc[id]) acc[id] = { id, nombre: row.campaniaNombre, descripcion: row.campaniaDescripcion, registros: 0 };
                acc[id].registros += 1;
                return acc;
              }, {})).map((c: any) => (
                <div key={c.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{c.nombre}</div>
                      <div className="text-sm text-slate-500">{c.descripcion}</div>
                      <div className="text-xs text-slate-500 mt-1">Registros: {c.registros}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button className="text-sm text-amber-600" onClick={async () => await cargarParticipantesDeCampania(c.id)}>Ver participantes</button>
                      <div className="w-56 text-sm">
                        {participantesPorCampania[c.id] ? (
                          participantesPorCampania[c.id].length === 0 ? <div className="text-sm text-slate-500">No hay participantes</div> : (
                            <ul className="text-sm text-slate-700">
                              {participantesPorCampania[c.id].map((p: any) => (
                                <li key={p.id} className="py-1">{p.nombre} — {p.cedula}</li>
                              ))}
                            </ul>
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </LayoutGerente>
  );
}

export default GerenteCampanas;
