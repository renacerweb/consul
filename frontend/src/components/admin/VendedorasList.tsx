import { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import DataTable from '../DataTable';
import Modal from '../Modal';
import { useToast } from '../../contexts/ToastContext';
import { Search, Plus, Edit, Trash2, Eye, Phone, MapPin, Clock, User, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ACTIVA, displayReputacion, normalizeReputacionToDb, REPUTACIONES_ACTIVAS, REPUTACIONES_ACTIVAS_FILTER, REPUTACIONES_GERENTE_ZONA, REPUTACIONES_GERENTE_ZONA_FILTER, REPUTACIONES_GENERALES } from '../../utils/reputacion';

interface Vendedora {
  id: number;
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  descripcion?: string;
  reputacion: string;
  region_nombre: string;
  creada_por_nombre: string;
  gerente_zona_nombre: string;
  createdAt: string;
  historial?: HistorialItem[];
  campaniaHistorial?: CampaniaHistorialItem[];
  regionId?: number;
}

interface HistorialItem {
  gerenteZonaNombre: string;
  reputacion: string;
  fechaReporte: string;
}

interface CampaniaHistorialItem {
  id: number;
  campaniaId: number;
  campaniaNombre: string;
  campaniaDescripcion?: string;
  accion: string;
  fecha: string;
}

interface Region {
  id: number;
  nombre: string;
}

interface GerenteZona {
  id: number;
  nombre: string;
  region: string;
}

interface VendedorasListProps {
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
  mode?: 'all' | 'buenas' | 'malas';
  title?: string;
}

function VendedorasList({ canEdit = true, canDelete = true, canCreate = true, mode = 'all', title }: VendedorasListProps) {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [filteredVendedoras, setFilteredVendedoras] = useState<Vendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedVendedora, setSelectedVendedora] = useState<Vendedora | null>(null);
  const [editVendedora, setEditVendedora] = useState<Vendedora | null>(null);
  const [reportVendedora, setReportVendedora] = useState<Vendedora | null>(null);
  const [reportTarget, setReportTarget] = useState<'OBSERVADA' | 'RESTRINGIDA'>('OBSERVADA');
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [gerentesZona, setGerentesZona] = useState<GerenteZona[]>([]);
  const [filtroRegion, setFiltroRegion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    reputacion: ACTIVA,
    telefono: '',
    direccion: '',
    descripcion: '',
    regionId: '',
    gerenteZonaId: '',
  });
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    cedula: '',
    reputacion: '',
    telefono: '',
    direccion: '',
    regionId: '',
  });

  const { showToast } = useToast();

  const reputacionesOptions = useMemo(() => {
    if (mode === 'buenas') return [ACTIVA];
    if (mode === 'malas') return ['OBSERVADA', 'RESTRINGIDA'];
    if (usuario?.rol === 'GERENTE_ZONA') return REPUTACIONES_GERENTE_ZONA;
    return REPUTACIONES_GENERALES;
  }, [usuario, mode]);

  const getDefaultReputacion = useCallback((currentValue?: string) => {
    if (mode === 'buenas') {
      return ACTIVA;
    }
    if (mode === 'malas') {
      return ['MALA', 'OBSERVADA', 'RESTRINGIDA'].includes((currentValue || '').toUpperCase()) ? currentValue : 'OBSERVADA';
    }
    return currentValue || ACTIVA;
  }, [mode]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      reputacion: getDefaultReputacion(prev.reputacion)
    }));
    setEditFormData(prev => ({
      ...prev,
      reputacion: getDefaultReputacion(prev.reputacion)
    }));
  }, [mode, getDefaultReputacion]);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('usuario') || '{}');
    setUsuario(user);
  }, []);

  // Escuchar acciones del sidebar (e.g. exportar vendedoras)
  useEffect(() => {
    const handler = (ev: any) => {
      if (ev?.detail === 'action:export_vendedoras') {
        exportFilteredCSV();
      }
    };
    window.addEventListener('app:sidebar-action', handler as any);
    return () => window.removeEventListener('app:sidebar-action', handler as any);
  }, [filteredVendedoras]);

  const fetchVendedoras = useCallback(async () => {
    try {
      const response = await api.get('/vendedora');
      setVendedoras(response.data);
      setFilteredVendedoras(response.data);
    } catch (error) {
      console.error('Error al cargar vendedoras:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVendedoraDetalle = useCallback(async (id: number) => {
    try {
      const response = await api.get(`/vendedora/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al cargar detalle de vendedora:', error);
      return null;
    }
  }, []);

  const fetchRegiones = useCallback(async () => {
    try {
      const response = await api.get('/regiones');
      setRegiones(response.data);
    } catch (error) {
      console.error('Error al cargar regiones:', error);
    }
  }, []);

  const fetchGerentesZona = useCallback(async (regionId?: string) => {
    try {
      const url = regionId ? `/gerentes-zona?regionId=${regionId}` : '/gerentes-zona';
      const response = await api.get(url);
      setGerentesZona(response.data);
    } catch (error) {
      console.error('Error al cargar gerentes zona:', error);
    }
  }, []);

  useEffect(() => {
    fetchVendedoras();
    fetchRegiones();
    fetchGerentesZona();
  }, [fetchVendedoras, fetchRegiones, fetchGerentesZona]);

  useEffect(() => {
    let filtered = [...vendedoras];
    if (mode === 'buenas') {
      filtered = filtered.filter(v => REPUTACIONES_ACTIVAS_FILTER.includes((v.reputacion || '').toUpperCase()));
    }
    if (mode === 'malas') {
      filtered = filtered.filter(v => ['MALA', 'OBSERVADA', 'RESTRINGIDA'].includes((v.reputacion || '').toUpperCase()));
    }
    if (busqueda) {
      filtered = filtered.filter(v =>
        v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.cedula.includes(busqueda)
      );
    }
    if (filtroRegion) {
      filtered = filtered.filter(v => v.region_nombre === filtroRegion);
    }
    setFilteredVendedoras(filtered);
  }, [vendedoras, busqueda, filtroRegion, mode]);

  const handleVerDetalle = async (vendedora: Vendedora) => {
    try {
      const response = await api.get(`/vendedora/buscar/${vendedora.cedula}`);
      setSelectedVendedora(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setSelectedVendedora(vendedora);
      setShowDetailsModal(true);
    }
  };

  const handleEditar = (vendedora: Vendedora) => {
    setEditVendedora(vendedora);
    const reputacionInicial = usuario?.rol === 'GERENTE_ZONA' && !REPUTACIONES_GERENTE_ZONA_FILTER.includes((vendedora.reputacion || '').toUpperCase())
      ? 'OBSERVADA'
      : displayReputacion(vendedora.reputacion);
    setEditFormData({
      nombre: vendedora.nombre,
      cedula: vendedora.cedula,
      reputacion: reputacionInicial,
      telefono: vendedora.telefono || '',
      direccion: vendedora.direccion || '',
      regionId: vendedora.regionId?.toString() || '',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVendedora) return;
    
    try {
      await api.put(`/vendedora/${editVendedora.id}`, {
        reputacion: normalizeReputacionToDb(editFormData.reputacion),
      });
      setShowEditModal(false);
      fetchVendedoras();
      showToast('✅ Vendedora actualizada correctamente', 'success');
    } catch (error: any) {
      console.error('Error:', error);
      showToast('❌ Error al actualizar vendedora: ' + (error.response?.data?.error || 'Error desconocido'), 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        nombre: formData.nombre,
        cedula: formData.cedula,
        reputacion: formData.reputacion,
        telefono: formData.telefono,
        direccion: formData.direccion,
        descripcion: formData.descripcion,
      };
      
      if (usuario?.rol !== 'GERENTE_ZONA') {
        payload.regionId = parseInt(formData.regionId);
      }
      
      if ((usuario?.rol === 'ADMIN' || usuario?.rol === 'GERENTE_REGIONAL') && formData.gerenteZonaId) {
        payload.gerenteZonaId = parseInt(formData.gerenteZonaId);
      }
      
      payload.reputacion = normalizeReputacionToDb(payload.reputacion);
      await api.post('/vendedora', payload);
      setShowModal(false);
      setFormData({ nombre: '', cedula: '', reputacion: ACTIVA, telefono: '', direccion: '', descripcion: '', regionId: '', gerenteZonaId: '' });
      fetchVendedoras();
      showToast('✅ Vendedora registrada exitosamente', 'success');
    } catch (error: any) {
      console.error('Error:', error);
      showToast('❌ Error al registrar vendedora: ' + (error.response?.data?.error || 'Error desconocido'), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta vendedora?')) {
      try {
        await api.delete(`/vendedora/${id}`);
        fetchVendedoras();
        showToast('✅ Vendedora eliminada', 'success');
      } catch (error: any) {
        console.error('Error:', error);
        showToast('❌ Error al eliminar vendedora: ' + (error.response?.data?.error || 'Error desconocido'), 'error');
      }
    }
  };

  const getReputacionBadge = (reputacion: string) => {
    const value = displayReputacion(reputacion);
    const colors: Record<string, string> = {
      EXCELENTE: 'bg-green-100 text-green-800',
      ACTIVA: 'bg-blue-100 text-blue-800',
      BUENA: 'bg-blue-100 text-blue-800',
      POSITIVA: 'bg-emerald-100 text-emerald-800',
      REGULAR: 'bg-yellow-100 text-yellow-800',
      OBSERVADA: 'bg-amber-100 text-amber-800',
      MALA: 'bg-red-100 text-red-800',
      RESTRINGIDA: 'bg-rose-100 text-rose-800',
    };
    return colors[value] || 'bg-gray-100 text-gray-800';
  };

  const exportFilteredCSV = () => {
    if (!filteredVendedoras || filteredVendedoras.length === 0) return;
    const headers = ['Nombre', 'Cédula', 'Teléfono', 'Dirección', 'Reputación', 'Región'];
    const rows = filteredVendedoras.map(v => [v.nombre, v.cedula, v.telefono || '', v.direccion || '', v.reputacion, v.region_nombre || '']);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendedoras_${mode}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printNamesAndCedulas = () => {
    if (!filteredVendedoras || filteredVendedoras.length === 0) {
      showToast('No hay vendedoras para imprimir', 'warning');
      return;
    }

    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFontSize(14);
      doc.text(`Vendedoras Activas - ${new Date().toLocaleDateString()}`, 40, 40);
      doc.setFontSize(11);

      const startY = 70;
      const rowHeight = 18;
      // Header
      doc.text('Nombre', 40, startY);
      doc.text('Cédula', 420, startY);

      let y = startY + rowHeight;
      filteredVendedoras.forEach((v, idx) => {
        if (y > (doc.internal.pageSize.getHeight() - 40)) {
          doc.addPage();
          y = 40;
        }
        doc.text(String(v.nombre), 40, y);
        doc.text(String(v.cedula), 420, y);
        y += rowHeight;
      });

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Error generando PDF', e);
      showToast('❌ Error al generar PDF', 'error');
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cedula', label: 'Cédula', className: 'font-mono' },
    {
      key: 'reputacion',
      label: 'Reputación',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReputacionBadge(value)}`}>
          {displayReputacion(value)}
        </span>
      )
    },
    { key: 'region_nombre', label: 'Región' },
    { key: 'gerente_zona_nombre', label: 'Gerente Zona' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Vendedora) => {
        const canEditRow = canEdit && !(usuario?.rol === 'GERENTE_ZONA' && mode === 'buenas');
        const canDeleteRow = canDelete && !(usuario?.rol === 'GERENTE_ZONA' && mode === 'buenas');

        return (
          <div className="flex gap-2">
            <button 
              onClick={() => handleVerDetalle(row)} 
              className="text-blue-600 hover:text-blue-800"
              title="Ver detalles"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canEditRow && (
              <button 
                onClick={() => handleEditar(row)} 
                className="text-indigo-600 hover:text-indigo-800"
                title="Editar reputación"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canDeleteRow && (
              <button onClick={() => handleDelete(row.id)} className="text-rose-600 hover:text-rose-800" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {mode === 'buenas' && (
              <button
                onClick={() => { setReportVendedora(row); setReportTarget('OBSERVADA'); setShowReportModal(true); }}
                className="text-amber-600 hover:text-amber-800"
                title="Reportar vendedora"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {usuario?.rol === 'GERENTE_ZONA' && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Atención Gerente de Zona:</strong> puedes registrar vendedoras con reputación <strong>ACTIVA</strong>, <strong>OBSERVADA</strong> o <strong>RESTRINGIDA</strong> según el caso.
        </div>
      )}
      {title && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
      )}
      {/* Filtros y búsqueda */}
      <div className="mb-6 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] items-end">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] w-full">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-slate-700 mb-1">Región</label>
            <select
              value={filtroRegion}
              onChange={(e) => setFiltroRegion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="">Todas</option>
              {regiones.map(r => (
                <option key={r.id} value={r.nombre}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {canCreate && (
          <div className="flex gap-2">
            {mode === 'buenas' && (
              <button onClick={printNamesAndCedulas} className="px-3 py-2 bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 text-sm">Imprimir Nombres y Cédulas</button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className={`px-4 py-2 text-white rounded-lg font-medium flex items-center gap-2 ${mode === 'malas' ? 'bg-red-600 hover:bg-red-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}
            >
              <Plus className="w-4 h-4" />
              {mode === 'buenas' ? 'Registrar Vendedora Activa' : mode === 'malas' ? 'Registrar Vendedora Mala' : 'Registrar Vendedora'}
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={filteredVendedoras}
        loading={loading}
        emptyMessage={mode === 'buenas' ? 'No hay vendedoras activas registradas' : mode === 'malas' ? 'No hay vendedoras malas registradas' : 'No hay vendedoras registradas'}
      />

      {/* Modal para crear vendedora */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Vendedora" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula *</label>
            <input
              type="text"
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reputación</label>
            <select
              value={formData.reputacion}
              onChange={(e) => setFormData({ ...formData, reputacion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              {reputacionesOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {usuario?.rol === 'GERENTE_ZONA' && mode !== 'buenas' && (
              <p className="mt-2 text-sm text-amber-700">Puedes elegir <strong>ACTIVA</strong>, <strong>OBSERVADA</strong> o <strong>RESTRINGIDA</strong>.</p>
            )}
            {mode === 'buenas' && (
              <p className="mt-2 text-sm text-emerald-700">Esta vista solo permite registrar vendedoras con reputación <strong>ACTIVA</strong>.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <textarea
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              rows={3}
              placeholder="Breve descripción o comentarios sobre la vendedora"
            />
          </div>
          
          {usuario?.rol !== 'GERENTE_ZONA' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Región *</label>
              <select
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: e.target.value, gerenteZonaId: '' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                required
              >
                <option value="">Seleccionar región</option>
                {regiones.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>
          )}
          
          {usuario?.rol === 'GERENTE_ZONA' && (
            <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
              ℹ️ La vendedora será registrada en tu región y asignada automáticamente a tu cuenta.
            </div>
          )}
          
          {(usuario?.rol === 'ADMIN' || usuario?.rol === 'GERENTE_REGIONAL') && formData.regionId && gerentesZona.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a Gerente Zona (opcional)</label>
              <select
                value={formData.gerenteZonaId}
                onChange={(e) => setFormData({ ...formData, gerenteZonaId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Sin asignar</option>
                {gerentesZona.map(g => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              Registrar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para reportar vendedora buena */}
      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Reportar Vendedora" size="sm">
        {reportVendedora ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.put(`/vendedora/${reportVendedora.id}`, { reputacion: reportTarget });
              setShowReportModal(false);
              setReportVendedora(null);
              fetchVendedoras();
              showToast('✅ Vendedora reportada como ' + reportTarget, 'success');
            } catch (err: any) {
              console.error('Error al reportar vendedora:', err);
              showToast('❌ Error al reportar: ' + (err.response?.data?.error || err.message || 'Error desconocido'), 'error');
            }
          }}>
            <p className="mb-3">Reportar a <strong>{reportVendedora.nombre}</strong> cambiará su reputación a:</p>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="reputacion" value="OBSERVADA" checked={reportTarget === 'OBSERVADA'} onChange={() => setReportTarget('OBSERVADA')} />
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">OBSERVADA</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="reputacion" value="RESTRINGIDA" checked={reportTarget === 'RESTRINGIDA'} onChange={() => setReportTarget('RESTRINGIDA')} />
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">RESTRINGIDA</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowReportModal(false)} className="px-3 py-1 border rounded">Cancelar</button>
              <button type="submit" className="px-3 py-1 bg-amber-600 text-white rounded">Reportar</button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Modal para editar reputación de vendedora */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Reputación de Vendedora" size="md">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={editFormData.nombre}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
            <input
              type="text"
              value={editFormData.cedula}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reputación *</label>
            <select
              value={editFormData.reputacion}
              onChange={(e) => setEditFormData({ ...editFormData, reputacion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            >
              {reputacionesOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {usuario?.rol === 'GERENTE_ZONA' && mode !== 'buenas' && (
              <p className="mt-2 text-sm text-amber-700">Puedes elegir <strong>ACTIVA</strong>, <strong>OBSERVADA</strong> o <strong>RESTRINGIDA</strong>.</p>
            )}
            {mode === 'buenas' && (
              <p className="mt-2 text-sm text-emerald-700">Esta vista solo permite registrar vendedoras con reputación <strong>ACTIVA</strong>.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para ver detalles de vendedora */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Detalles de Vendedora" size="lg">
        {selectedVendedora && (
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-2">
                <User className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">{selectedVendedora.nombre}</h3>
              <p className="text-sm text-indigo-600">📍 {selectedVendedora.region_nombre || 'Sin región'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 font-medium text-slate-600">Cédula:</span>
                <span className="font-mono text-slate-800">{selectedVendedora.cedula}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="w-24 font-medium text-slate-600">Teléfono:</span>
                <span className="text-slate-800">{selectedVendedora.telefono || 'No registrado'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                <span className="w-24 font-medium text-slate-600">Dirección:</span>
                <span className="text-slate-800 flex-1">{selectedVendedora.direccion || 'No registrada'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="w-24 font-medium text-slate-600">Descripción:</span>
                <span className="text-slate-800 flex-1">{selectedVendedora.descripcion || 'No disponible'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 font-medium text-slate-600">Creada por:</span>
                <span className="text-slate-800">{selectedVendedora.creada_por_nombre || 'Desconocido'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 font-medium text-slate-600">Gerente Zona:</span>
                <span className="text-slate-800">{selectedVendedora.gerente_zona_nombre || 'No asignado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24 font-medium text-slate-600">Reputación actual:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getReputacionBadge(selectedVendedora.reputacion)}`}>
                  {displayReputacion(selectedVendedora.reputacion)}
                </span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <h4 className="font-semibold text-slate-700">
                  Historial de reportes ({selectedVendedora.historial?.length || 0})
                </h4>
              </div>
              
              {selectedVendedora.historial && selectedVendedora.historial.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedVendedora.historial.map((h, idx) => (
                    <div key={idx} className="pl-3 border-l-2 border-indigo-200 py-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-medium text-slate-700 text-sm">
                          Reportado por: <span className="text-indigo-600">{h.gerenteZonaNombre || 'Gerente'}</span>
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getReputacionBadge(h.reputacion)}`}>
                          {displayReputacion(h.reputacion)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(h.fechaReporte).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Sin historial de reportes</p>
              )}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-slate-500" />
                <h4 className="font-semibold text-slate-700">
                  Campañas en las que participó ({selectedVendedora.campaniaHistorial?.length || 0})
                </h4>
              </div>
              {selectedVendedora.campaniaHistorial && selectedVendedora.campaniaHistorial.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedVendedora.campaniaHistorial.map((item) => (
                    <div key={item.id} className="pl-3 border-l-2 border-slate-200 py-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium text-slate-700">{item.campaniaNombre || `Campaña #${item.campaniaId}`}</p>
                          {item.campaniaDescripcion ? (
                            <p className="text-sm text-slate-500">{item.campaniaDescripcion}</p>
                          ) : null}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(item.fecha).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        Acción: <span className="font-medium">{item.accion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No hay registros de campaña para esta vendedora.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default VendedorasList;