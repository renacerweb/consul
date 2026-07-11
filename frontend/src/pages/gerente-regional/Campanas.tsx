import { useEffect, useState, useMemo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Region } from '../../types';

interface Campania {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  regionId?: number;
  regionIds?: number[];
  region_nombre?: string;
  cantidadPrendas?: number;
  tipoColeccion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
}

function GerenteRegionalCampanas() {
  const [campanias, setCampanias] = useState<Campania[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [cantidadPrendas, setCantidadPrendas] = useState('');
  const [tipoColeccion, setTipoColeccion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [regionIds, setRegionIds] = useState<number[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [participaciones, setParticipaciones] = useState<any[]>([]);
  const [editCampaniaId, setEditCampaniaId] = useState<number | null>(null);
  const [showCampaniaModal, setShowCampaniaModal] = useState(false);
  const [selectedCampania, setSelectedCampania] = useState<Campania | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'detalles' | 'historial'>('detalles');
  const participantesUnicos = Array.from(new Set(historial.map((h) => h.vendedoraId))).length;
  const registrosHistorial = historial.length;
  const gruposParticipantes = useMemo<Record<string, any[]>>(() => {
    const map: Record<string, any[]> = {};
    participantes.forEach((p: any) => {
      const key = p.gerenteZonaNombre || 'Sin gerente de zona';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [participantes]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [campaniasRes, regionesRes] = await Promise.all([
          api.get<Campania[]>('/campania', { params: { activo: undefined } }),
          api.get<Region[]>('/regiones'),
        ]);
        setCampanias(campaniasRes.data);
        setRegiones(regionesRes.data);
        if (regionesRes.data.length > 0) {
          setRegionIds([regionesRes.data[0].id]);
        }
      } catch (err: any) {
        console.error(err);
        setError('No se pudieron cargar las campañas o regiones');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const { usuario } = useAuth();

  const cargarParticipaciones = async () => {
    try {
      const res = await api.get('/campania/participaciones/por-gerente');
      setParticipaciones(res.data || []);
    } catch (err: any) {
      console.error('Error cargando participaciones:', err);
      setParticipaciones([]);
    }
  };

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setActivo(true);
    setCantidadPrendas('');
    setTipoColeccion('');
    setFechaInicio('');
    setFechaFin('');
    setObservaciones('');
    setRegionIds(regiones.length > 0 ? [regiones[0].id] : []);
    setEditCampaniaId(null);
    setError('');
  };

  const cargarCampanias = async () => {
    try {
      const response = await api.get<Campania[]>('/campania', { params: { activo: undefined } });
      setCampanias(response.data);
    } catch (err: any) {
      console.error(err);
      setError('No se pudieron cargar las campañas');
    }
  };

  const handleCrear = async () => {
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (regionIds.length === 0) {
      setError('Debes seleccionar al menos una región');
      return;
    }

    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        activo,
        cantidadPrendas: cantidadPrendas ? Number(cantidadPrendas) : null,
        tipoColeccion: tipoColeccion.trim(),
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        observaciones: observaciones.trim(),
        regionIds,
      };

      if (editCampaniaId !== null) {
        await api.put(`/campania/${editCampaniaId}`, payload);
      } else {
        await api.post('/campania', payload);
      }

      await cargarCampanias();
      resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar campaña');
    }
  };

  const handleEditar = (campania: Campania) => {
    setEditCampaniaId(campania.id);
    setNombre(campania.nombre);
    setDescripcion(campania.descripcion || '');
    setActivo(campania.activo);
    setCantidadPrendas(campania.cantidadPrendas?.toString() || '');
    setTipoColeccion(campania.tipoColeccion || '');
    setFechaInicio(campania.fechaInicio || '');
    setFechaFin(campania.fechaFin || '');
    setObservaciones(campania.observaciones || '');
    setRegionIds(campania.regionIds ?? (campania.regionId ? [campania.regionId] : []));
    setError('');
  };

  const handleEliminar = async (campaniaId: number) => {
    const confirmar = window.confirm('¿Deseas eliminar esta campaña?');
    if (!confirmar) return;

    try {
      await api.delete(`/campania/${campaniaId}`);
      setCampanias((prev) => prev.filter((campania) => campania.id !== campaniaId));
      if (editCampaniaId === campaniaId) {
        resetForm();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo eliminar la campaña');
    }
  };

  const toggleActivo = async (campania: Campania) => {
    try {
      await api.put(`/campania/${campania.id}`, { activo: !campania.activo });
      setCampanias((prev) => prev.map((c) => c.id === campania.id ? { ...c, activo: !c.activo } : c));
      if (editCampaniaId === campania.id) {
        setActivo((prev) => !prev);
      }
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el estado de la campaña');
    }
  };

  const handleFinalizar = async () => {
    if (editCampaniaId === null) return;

    const confirmar = window.confirm('¿Deseas finalizar esta campaña?');
    if (!confirmar) return;

    try {
      const hoy = new Date().toISOString().slice(0, 10);
      await api.put(`/campania/${editCampaniaId}`, {
        activo: false,
        fechaFin: hoy,
      });
      setCampanias((prev) => prev.map((campania) => campania.id === editCampaniaId ? { ...campania, activo: false, fechaFin: hoy } : campania));
      setActivo(false);
      setFechaFin(hoy);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo finalizar la campaña');
    }
  };

  return (
    <LayoutGerenteRegional title="Gestión de Campañas">
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Administra campañas regionales y activa o desactiva campañas existentes.
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Campañas registradas</h2>
              {usuario?.rol === 'GERENTE_ZONA' && (
                <div className="flex items-center gap-2">
                  <button onClick={async () => { await cargarCampanias(); }} className="px-3 py-1 rounded bg-slate-100 text-sm">Campañas</button>
                  <button onClick={async () => { await cargarParticipaciones(); }} className="px-3 py-1 rounded bg-amber-600 text-white text-sm">Participaciones</button>
                </div>
              )}
            </div>
            {cargando ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : campanias.length === 0 ? (
              <p className="text-sm text-slate-500">No hay campañas registradas.</p>
            ) : (
              <div className="space-y-3">
                {campanias.map((campania) => (
                  <div key={campania.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-800">{campania.nombre}</h3>
                        <p className="text-sm text-slate-500">{campania.descripcion || 'Sin descripción'}</p>
                        <button type="button" className="text-sm text-amber-600 mt-2" onClick={async () => {
                          setSelectedCampania(campania);
                          setActiveTab('detalles');
                          setShowCampaniaModal(true);
                          try {
                            const [histRes, partRes] = await Promise.all([
                              api.get('/campania/historial', { params: { campaniaId: campania.id } }),
                              api.get(`/campania/${campania.id}/participantes`),
                            ]);
                            setHistorial(histRes.data || []);
                            setParticipantes(partRes.data || []);
                          } catch (err) {
                            console.error('Error cargando historial o participantes de campaña:', err);
                            setHistorial([]);
                            setParticipantes([]);
                          }
                        }}>Ver historial y participantes</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActivo(campania)}
                          className={`rounded-full px-3 py-1 text-sm font-semibold ${campania.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                        >
                          {campania.activo ? 'Activa' : 'Inactiva'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditar(campania)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
                          aria-label="Editar campaña"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(campania.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-600 transition hover:bg-rose-50"
                          aria-label="Eliminar campaña"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Crear nueva campaña</h2>
            {usuario?.rol === 'GERENTE_ZONA' && participaciones.length > 0 && (
              <div className="mb-3">
                <h3 className="font-semibold text-slate-800">Participaciones de tus vendedoras</h3>
                <div className="mt-2 max-h-56 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Nombre</th>
                        <th className="px-2 py-1 text-left">Cédula</th>
                        <th className="px-2 py-1 text-left">Participaciones</th>
                        <th className="px-2 py-1 text-left">Última participación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participaciones.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-2 py-1">{p.nombre}</td>
                          <td className="px-2 py-1">{p.cedula}</td>
                          <td className="px-2 py-1">{p.participaciones}</td>
                          <td className="px-2 py-1">{p.ultima_participacion ? new Date(p.ultima_participacion).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad de prendas</label>
                  <input
                    type="number"
                    min="0"
                    value={cantidadPrendas}
                    onChange={(e) => setCantidadPrendas(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de colección</label>
                  <input
                    type="text"
                    value={tipoColeccion}
                    onChange={(e) => setTipoColeccion(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="Ej. Verano, Invierno"
                  />
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">Regiones</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {regiones.map((region) => (
                    <label key={region.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50">
                      <input
                        type="checkbox"
                        checked={regionIds.includes(region.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRegionIds((prev) => Array.from(new Set([...prev, region.id])));
                          } else {
                            setRegionIds((prev) => prev.filter((id) => id !== region.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span>{region.nombre}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">Marca las regiones donde aplica esta campaña.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleFinalizar}
                    disabled={editCampaniaId === null || !activo}
                    className="w-full rounded-lg bg-rose-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-rose-200"
                  >
                    Finalizar campaña
                  </button>
                  {fechaFin && (
                    <p className="mt-2 text-sm text-slate-500">Finalizada el {new Date(fechaFin).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  rows={3}
                  placeholder="Detalles extra, metas o comentarios"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="activo"
                  type="checkbox"
                  checked={activo}
                  onChange={() => setActivo((prev) => !prev)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="activo" className="text-sm text-slate-700">Campaña activa</label>
              </div>
              <button
                type="button"
                onClick={handleCrear}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white"
              >
                {editCampaniaId !== null ? 'Actualizar campaña' : 'Crear campaña'}
              </button>
              {editCampaniaId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={showCampaniaModal} onClose={() => setShowCampaniaModal(false)} title={selectedCampania ? selectedCampania.nombre : 'Campaña'} size="lg">
        {selectedCampania && (
          <div>
            <div className="flex gap-2 mb-4">
              <button className={`px-3 py-1 rounded ${activeTab === 'detalles' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`} onClick={() => setActiveTab('detalles')}>Detalles</button>
              <button className={`px-3 py-1 rounded ${activeTab === 'historial' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`} onClick={() => setActiveTab('historial')}>Historial</button>
            </div>

            {activeTab === 'detalles' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-700"><strong>Descripción:</strong> {selectedCampania.descripcion || 'Sin descripción'}</p>
                <p className="text-sm text-slate-700"><strong>Región(es):</strong> {selectedCampania.region_nombre || 'N/A'}</p>
                <p className="text-sm text-slate-700"><strong>Tipo colección:</strong> {selectedCampania.tipoColeccion || 'N/A'}</p>
                <p className="text-sm text-slate-700"><strong>Fecha inicio:</strong> {selectedCampania.fechaInicio || 'N/A'}</p>
                <p className="text-sm text-slate-700"><strong>Fecha fin:</strong> {selectedCampania.fechaFin || 'N/A'}</p>
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <h4 className="font-semibold text-slate-800">Participantes por Gerente de Zona</h4>
                  {Object.keys(gruposParticipantes).length === 0 ? (
                    <p className="text-sm text-slate-500">No hay participantes asignados a esta campaña.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(gruposParticipantes).map(([gerente, list]) => (
                        <div key={gerente} className="p-3 border rounded">
                          <div className="font-medium text-slate-800">{gerente}</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {list.map((p: any) => (
                              <li key={p.id} className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{p.nombre}</div>
                                  <div className="text-xs text-slate-500">Cédula: {p.cedula}</div>
                                </div>
                                <div className="text-xs text-slate-500">Región: {p.regionId || 'N/A'}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {historial.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay registros de participación para esta campaña.</p>
                  ) : (
                    <>
                      <div className="mb-3 text-sm text-slate-600">Participaron <strong>{participantesUnicos}</strong> vendedoras — <strong>{registrosHistorial}</strong> registros</div>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {historial.map((h) => (
                          <div key={h.id} className="p-3 border rounded">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-800">{h.vendedoraNombre}</div>
                                <div className="text-sm text-slate-500">Cédula: {h.cedula}</div>
                              </div>
                              <div className="text-sm text-slate-500">{new Date(h.createdAt).toLocaleDateString()}</div>
                            </div>
                            <div className="mt-2 text-xs text-slate-600">Acción: <span className="font-medium">{h.accion}</span></div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalCampanas;
