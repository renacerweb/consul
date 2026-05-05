import { useEffect, useState, useCallback } from 'react';
import { vendedoraService, regionService } from '../../services/api';
import DataTable from '../DataTable';
import Modal from '../Modal';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Vendedora, Region, CreateVendedoraRequest } from '../../types';

interface VendedorasListProps {
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

function VendedorasList({ canEdit = true, canDelete = true, canCreate = true }: VendedorasListProps) {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [filteredVendedoras, setFilteredVendedoras] = useState<Vendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [filtroRegion, setFiltroRegion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState<CreateVendedoraRequest>({
    nombre: '',
    cedula: '',
    reputacion: 'BUENA',
    telefono: '',
    direccion: '',
    regionId: 0,
    gerenteZonaId: undefined,
  });

  const fetchVendedoras = useCallback(async () => {
    try {
      const params: { regionId?: number } = {};
      if (filtroRegion) {
        const region = regiones.find(r => r.nombre === filtroRegion);
        if (region) params.regionId = region.id;
      }
      const response = await vendedoraService.listar(params);
      setVendedoras(response.data);
      setFilteredVendedoras(response.data);
    } catch (error) {
      console.error('Error al cargar vendedoras:', error);
    } finally {
      setLoading(false);
    }
  }, [filtroRegion, regiones]);

  const fetchRegiones = useCallback(async () => {
    try {
      const response = await regionService.listar();
      setRegiones(response.data);
    } catch (error) {
      console.error('Error al cargar regiones:', error);
    }
  }, []);

  useEffect(() => {
    fetchRegiones();
  }, [fetchRegiones]);

  useEffect(() => {
    fetchVendedoras();
  }, [fetchVendedoras]);

  useEffect(() => {
    let filtered = [...vendedoras];
    if (busqueda) {
      filtered = filtered.filter(v =>
        v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.cedula.includes(busqueda)
      );
    }
    setFilteredVendedoras(filtered);
  }, [vendedoras, busqueda]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vendedoraService.crear(formData);
      setShowModal(false);
      setFormData({ nombre: '', cedula: '', reputacion: 'BUENA', telefono: '', direccion: '', regionId: 0, gerenteZonaId: undefined });
      fetchVendedoras();
      alert('✅ Vendedora registrada exitosamente');
    } catch (error: any) {
      alert('❌ Error al registrar vendedora: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta vendedora?')) {
      try {
        await vendedoraService.eliminar(id);
        fetchVendedoras();
        alert('✅ Vendedora eliminada');
      } catch (error) {
        alert('❌ Error al eliminar vendedora');
      }
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'cedula', label: 'Cédula', className: 'font-mono' },
    {
      key: 'reputacion',
      label: 'Reputación',
      render: (value: string) => {
        const colors: Record<string, string> = {
          EXCELENTE: 'bg-green-100 text-green-800',
          BUENA: 'bg-blue-100 text-blue-800',
          REGULAR: 'bg-yellow-100 text-yellow-800',
          MALA: 'bg-red-100 text-red-800',
          POSITIVA: 'bg-emerald-100 text-emerald-800',
          OBSERVADA: 'bg-amber-100 text-amber-800',
          RESTRINGIDA: 'bg-rose-100 text-rose-800',
        };
        const color = colors[value] || 'bg-gray-100 text-gray-800';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{value}</span>;
      }
    },
    { key: 'region_nombre', label: 'Región' },
    { key: 'gerente_zona_nombre', label: 'Gerente Zona' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Vendedora) => (
        <div className="flex gap-2">
          {canEdit && (
            <button className="text-indigo-600 hover:text-indigo-800">
              <Edit className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button onClick={() => handleDelete(row.id)} className="text-rose-600 hover:text-rose-800">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
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
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
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

        <div className="w-48">
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

        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Vendedora
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredVendedoras}
        loading={loading}
        emptyMessage="No hay vendedoras registradas"
      />

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
              <option value="EXCELENTE">Excelente</option>
              <option value="BUENA">Buena</option>
              <option value="REGULAR">Regular</option>
              <option value="MALA">Mala</option>
              <option value="POSITIVA">Positiva</option>
              <option value="OBSERVADA">Observada</option>
              <option value="RESTRINGIDA">Restringida</option>
            </select>
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Región *</label>
            <select
              value={formData.regionId}
              onChange={(e) => setFormData({ ...formData, regionId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            >
              <option value={0}>Seleccionar región</option>
              {regiones.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
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
    </div>
  );
}

export default VendedorasList;