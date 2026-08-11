import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { displayReputacion } from '../../utils/reputacion';
import { Edit, Trash2, Eye, AlertCircle, ClipboardList } from 'lucide-react';

interface Zona {
  id: number;
  nombre: string;
  region: string;
  reputacion?: string;
}

interface Region {
  id: number;
  nombre: string;
}

function Zonas() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [nombre, setNombre] = useState('');
  const [regionId, setRegionId] = useState('');
  const [vincularOption, setVincularOption] = useState<'none'|'crear'|'vincular'>('none');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuarioEmail, setUsuarioEmail] = useState('');
  const [usuarioPassword, setUsuarioPassword] = useState('');
  const [usuarioExistenteId, setUsuarioExistenteId] = useState('');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentGerente, setCurrentGerente] = useState<Zona | null>(null);
  const [reputacion, setReputacion] = useState('OBSERVADA');
  const [comentario, setComentario] = useState('');
  const [showViewReportsModal, setShowViewReportsModal] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [reputacionInit, setReputacionInit] = useState('ACTIVA');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGerente, setEditGerente] = useState<Zona | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [editCedula, setEditCedula] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editReputacion, setEditReputacion] = useState('ACTIVA');

  const fetchZonas = async () => {
    try {
      const res = await api.get('/zonas');
      setZonas(res.data);
    } catch (err) {
      console.error('Error al cargar zonas', err);
      showToast('Error al cargar zonas', 'error');
    }
  };

  const fetchRegiones = async () => {
    try {
      const res = await api.get('/regiones');
      setRegiones(res.data);
    } catch (err) {
      console.error('Error al cargar regiones', err);
      showToast('Error al cargar regiones', 'error');
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/auth/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error('Error al cargar usuarios', err);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchZonas(), fetchRegiones(), fetchUsuarios()]);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !regionId) {
      showToast('Nombre y región son requeridos', 'warning');
      return;
    }
    try {
      // regionId is numeric id; find region name
      const regionObj = regiones.find(r => String(r.id) === String(regionId));
      const regionNombre = regionObj ? regionObj.nombre : regionId;

      const payload: any = { nombre: nombre.trim(), region: regionNombre, cedula: cedula || null, email: email || null, telefono: telefono || null, descripcion: descripcion || null, reputacion: reputacionInit };
      if (vincularOption === 'crear') {
        payload.crearUsuario = true;
        payload.usuarioEmail = usuarioEmail;
        payload.usuarioPassword = usuarioPassword;
        payload.usuarioRegionId = regionObj ? regionObj.id : null;
      } else if (vincularOption === 'vincular') {
        payload.usuarioExistenteId = usuarioExistenteId ? parseInt(usuarioExistenteId, 10) : null;
      }

      await api.post('/zonas', payload);
      setNombre('');
      setCedula('');
      setEmail('');
      setTelefono('');
      setDescripcion('');
      setRegionId('');
      await fetchZonas();
      showToast('Zona creada correctamente', 'success');
    } catch (err: any) {
      console.error('Error al crear zona', err);
      showToast('Error al crear zona: ' + (err.response?.data?.error || 'Desconocido'), 'error');
    }
  };

  const abrirModalReporte = (g: Zona) => {
    setCurrentGerente(g);
    setReputacion('OBSERVADA');
    setComentario('');
    setShowReportModal(true);
  };

  const verReportes = async (g: Zona) => {
    setCurrentGerente(g);
    try {
      const res = await api.get(`/zonas/${g.id}/reportes`);
      setReports(res.data || []);
      setShowViewReportsModal(true);
    } catch (err) {
      console.error('Error al cargar reportes', err);
      showToast('Error al cargar reportes', 'error');
    }
  };

  const handleReportar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGerente) return;
    try {
      await api.post(`/zonas/${currentGerente.id}/reportar`, { reputacion, comentario });
      setShowReportModal(false);
      setCurrentGerente(null);
      setComentario('');
      showToast('Reporte guardado', 'success');
    } catch (err: any) {
      console.error('Error al reportar gerente', err);
      showToast('Error al reportar gerente: ' + (err.response?.data?.error || 'Desconocido'), 'error');
    }
  };

  return (
    <LayoutGerenteRegional title="Reporte Gerentes">
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3">Crear nueva Cuenta Gerente</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Cédula</label>
              <input value={cedula} onChange={(e) => setCedula(e.target.value)} className="w-full rounded-lg border p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Teléfono</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full rounded-lg border p-2" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Región</label>
              <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className="w-full rounded-lg border p-2">
                <option value="">Seleccionar región</option>
                {regiones.map(r => (
                  <option key={r.id} value={r.nombre}>{r.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Reputación inicial</label>
              <select value={reputacionInit} onChange={(e) => setReputacionInit(e.target.value)} className="w-full rounded-lg border p-2">
                <option value="ACTIVA">ACTIVA</option>
                <option value="OBSERVADA">OBSERVADA</option>
                <option value="RESTRINGIDA">RESTRINGIDA</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm text-slate-700 mb-1">Vincular cuenta</label>
              <div className="flex gap-3 items-center">
                <label className="flex items-center gap-2"><input type="radio" checked={vincularOption==='none'} onChange={() => setVincularOption('none')} /> No vincular</label>
                <label className="flex items-center gap-2"><input type="radio" checked={vincularOption==='crear'} onChange={() => setVincularOption('crear')} /> Crear cuenta</label>
                <label className="flex items-center gap-2"><input type="radio" checked={vincularOption==='vincular'} onChange={() => setVincularOption('vincular')} /> Vincular existente</label>
              </div>
            </div>
            {vincularOption === 'crear' && (
              <>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Email (usuario)</label>
                  <input value={usuarioEmail} onChange={(e) => setUsuarioEmail(e.target.value)} className="w-full rounded-lg border p-2" />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Password (usuario)</label>
                  <input value={usuarioPassword} onChange={(e) => setUsuarioPassword(e.target.value)} type="password" className="w-full rounded-lg border p-2" />
                </div>
              </>
            )}
            {vincularOption === 'vincular' && (
              <div>
                <label className="block text-sm text-slate-700 mb-1">Seleccionar usuario</label>
                <select value={usuarioExistenteId} onChange={(e) => setUsuarioExistenteId(e.target.value)} className="w-full rounded-lg border p-2">
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-700 mb-1">Descripción (opcional)</label>
              <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-lg border p-2" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button className={`${reputacionInit === 'MALA' || reputacionInit === 'RESTRINGIDA' ? 'bg-rose-600' : 'bg-emerald-600'} text-white px-4 py-2 rounded-lg`}>Crear Gerente Zona</button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <h3 className="text-lg font-semibold mb-3">Cuentas Gerentes existentes</h3>
          {loading ? (
            <div className="text-sm text-slate-500">Cargando zonas...</div>
          ) : zonas.length === 0 ? (
            <div className="text-sm text-slate-500">No hay zonas registradas.</div>
          ) : (
            <ul className="space-y-2">
              {zonas.map(z => (
                <li key={z.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div>
                    <div className="font-medium">{z.nombre}</div>
                    <div className="text-sm text-slate-500">Región: {z.region}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditGerente(z); setEditNombre(z.nombre); setEditRegion(z.region); setEditCedula((z as any).cedula || ''); setEditEmail((z as any).email || ''); setEditTelefono((z as any).telefono || ''); setEditDescripcion((z as any).descripcion || ''); setEditReputacion(displayReputacion((z.reputacion as string) || 'ACTIVA')); setShowEditModal(true); }} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 transition" title="Editar gerente">
                    <Edit className="w-4 h-4" />
                  </button>
                    <button onClick={async () => {
                      if (!confirm('Confirmar eliminar este gerente?')) return;
                      try {
                        await api.delete(`/zonas/${z.id}`);
                        showToast('Gerente eliminado', 'success');
                        await fetchZonas();
                      } catch (err: any) {
                        console.error('Error al eliminar gerente', err);
                        showToast('Error al eliminar: ' + (err.response?.data?.error || 'Desconocido'), 'error');
                      }
                    }} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition" title="Eliminar gerente">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {(z.reputacion === 'RESTRINGIDA' || z.reputacion === 'MALA') ? (
                      <button onClick={() => verReportes(z)} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition" title="Ver reportes">
                        <ClipboardList className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={() => abrirModalReporte(z)} className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 transition" title="Reportar gerente">
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Modal de reporte simple */}
        {showReportModal && currentGerente && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-md">
              <h4 className="text-lg font-semibold mb-2">Reportar reputación: {currentGerente.nombre}</h4>
              <form onSubmit={handleReportar} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Reputación</label>
                  <select value={reputacion} onChange={(e) => setReputacion(e.target.value)} className="w-full border rounded p-2">
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="OBSERVADA">OBSERVADA</option>
                    <option value="RESTRINGIDA">RESTRINGIDA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Comentario (opcional)</label>
                  <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} className="w-full border rounded p-2" rows={4} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowReportModal(false)} className="px-3 py-2 rounded border">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-rose-600 text-white">Enviar reporte</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para ver historial de reportes */}
        {showViewReportsModal && currentGerente && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-2xl">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold">Reportes: {currentGerente.nombre}</h4>
                <button onClick={() => { setShowViewReportsModal(false); setCurrentGerente(null); setReports([]); }} className="text-sm text-slate-500">Cerrar</button>
              </div>
              <div className="mt-3 space-y-3">
                {reports.length === 0 ? (
                  <div className="text-sm text-slate-500">No hay reportes para este gerente.</div>
                ) : (
                  <ul className="space-y-2">
                    {reports.map(r => (
                      <li key={r.id} className="p-3 border rounded">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{r.reputacion}</div>
                          <div className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleString()}</div>
                        </div>
                        {r.comentario && <div className="mt-2 text-sm">{r.comentario}</div>}
                        {r.creadoPorNombre && <div className="mt-1 text-xs text-slate-500">Reportado por: {r.creadoPorNombre}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal editar gerente */}
        {showEditModal && editGerente && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-4 w-full max-w-lg">
              <h4 className="text-lg font-semibold mb-2">Editar gerente: {editGerente.nombre}</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const payload: any = { nombre: editNombre, region: editRegion, cedula: editCedula || null, email: editEmail || null, telefono: editTelefono || null, descripcion: editDescripcion || null, reputacion: editReputacion };
                  await api.put(`/zonas/${editGerente.id}`, payload);
                  setShowEditModal(false);
                  setEditGerente(null);
                  showToast('Gerente actualizado', 'success');
                  await fetchZonas();
                } catch (err: any) {
                  console.error('Error al editar gerente', err);
                  showToast('Error al editar gerente: ' + (err.response?.data?.error || 'Desconocido'), 'error');
                }
              }} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Nombre</label>
                  <input value={editNombre} onChange={e => setEditNombre(e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Región</label>
                  <input value={editRegion} onChange={e => setEditRegion(e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm mb-1">Cédula</label>
                    <input value={editCedula} onChange={e => setEditCedula(e.target.value)} className="w-full border rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full border rounded p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Teléfono</label>
                  <input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Descripción</label>
                  <input value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} className="w-full border rounded p-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Reputación</label>
                  <select value={editReputacion} onChange={e => setEditReputacion(e.target.value)} className="w-full border rounded p-2">
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="OBSERVADA">OBSERVADA</option>
                    <option value="RESTRINGIDA">RESTRINGIDA</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowEditModal(false); setEditGerente(null); }} className="px-3 py-2 rounded border">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </LayoutGerenteRegional>
  );
}

export default Zonas;
