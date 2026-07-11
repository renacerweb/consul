import { useEffect, useState } from 'react';
import api from '../services/api';
import { displayReputacion } from '../utils/reputacion';

interface Region { id: number; nombre: string }

const REP_ACTIVAS = ['EXCELENTE', 'ACTIVA', 'POSITIVA', 'REGULAR'];
const REP_MALAS = ['MALA', 'OBSERVADA', 'RESTRINGIDA'];

export default function SidebarExportModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'buenas' | 'malas' | 'todas'>('buenas');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<number | 'all'>('all');

  useEffect(() => {
    const handler = (ev: any) => {
      if (ev?.detail === 'action:export_vendedoras') {
        setMode('buenas');
        setOpen(true);
      }
    };
    window.addEventListener('app:sidebar-action', handler as any);
    // cargar regiones para el selector
    (async () => {
      try {
        const r = await api.get('/regiones');
        setRegions(r.data || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => window.removeEventListener('app:sidebar-action', handler as any);
  }, []);

  const doExport = async () => {
    setLoading(true);
    setError('');
    try {
    const res = await api.get('/vendedora');
    const vendedoras = res.data as any[];
    let filtered = vendedoras;
    if (mode === 'buenas') filtered = vendedoras.filter(v => REP_ACTIVAS.includes(displayReputacion(v.reputacion)));
    if (mode === 'malas') filtered = vendedoras.filter(v => REP_MALAS.includes((v.reputacion || '').toUpperCase()));
    if (selectedRegionId !== 'all') filtered = filtered.filter(v => Number(v.regionId) === Number(selectedRegionId));

      if (!filtered || filtered.length === 0) {
        setError('No se encontraron vendedoras para la selección');
        setLoading(false);
        return;
      }

      const headers = ['Nombre', 'Cédula', 'Teléfono', 'Dirección', 'Reputación', 'Región'];
      const rows = filtered.map(v => [v.nombre, v.cedula, v.telefono || '', v.direccion || '', displayReputacion(v.reputacion), v.region_nombre || '']);
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0,10);
      const regionName = selectedRegionId === 'all' ? 'todas' : (regions.find(r => r.id === Number(selectedRegionId))?.nombre || String(selectedRegionId));
      const safeRegion = String(regionName).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
      a.download = `vendedoras_${mode}_${safeRegion}_${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setOpen(false);
    } catch (err: any) {
      console.error('Error exportando:', err);
      setError(err.response?.data?.error || err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">Exportar vendedoras</h3>
        <p className="text-sm text-slate-600 mb-4">Selecciona qué conjunto quieres exportar para respaldo.</p>

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'buenas'} onChange={() => setMode('buenas')} />
            <span>Activas (EXCELENTE, ACTIVA, POSITIVA, REGULAR)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'malas'} onChange={() => setMode('malas')} />
            <span>Malas (MALA, OBSERVADA, RESTRINGIDA)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" checked={mode === 'todas'} onChange={() => setMode('todas')} />
            <span>Todas</span>
          </label>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">Filtrar por región (opcional)</label>
          <select value={selectedRegionId as any} onChange={(e) => setSelectedRegionId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full px-3 py-2 border rounded">
            <option value="all">Todas</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
          <button onClick={doExport} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">
            {loading ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
