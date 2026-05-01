import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { Users, TrendingUp, ShoppingBag, Search, Edit, Trash2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  rol: string;
  title: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

interface Vendedora {
  id: number;
  nombre: string;
  cedula: string;
  reputacion: string;
  creadaPorId?: number | null;
  creadaPor: string | null;
  zona: string | null;
  createdAt: string;
}

interface Gerente {
  id: number;
  nombre: string;
  email: string;
  region: string;
}

function Dashboard({ canEdit = false, canDelete = false }: DashboardProps) {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filteredVendedoras, setFilteredVendedoras] = useState<Vendedora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [gerentes, setGerentes] = useState<Gerente[]>([]);
  const [usuario, setUsuario] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    reputacion: 'OBSERVADA',
    telefono: '',
    direccion: '',
    creadaPorId: '',
  });
  const [stats, setStats] = useState({
    totalVendedoras: 0,
    totalGerentes: 0,
    consultasMes: 0,
    reportesRecientes: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    setUsuario(user);
  }, []);

  useEffect(() => {
    const fetchGerentes = async () => {
      try {
        const response = await api.get('/auth/usuarios?rol=GERENTE_ZONA');
        setGerentes(response.data);
      } catch (error) {
        console.error('Error al cargar gerentes:', error);
      }
    };
    fetchGerentes();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendedorasRes, usuariosRes] = await Promise.all([
          api.get('/vendedora'),
          api.get('/auth/usuarios?rol=GERENTE_ZONA'),
        ]);
        
        const gerentesPorId: Record<number, any> = {};
        usuariosRes.data.forEach((u: any) => {
          gerentesPorId[u.id] = u;
        });
        
        const vendedorasConZona = vendedorasRes.data.map((v: any) => {
          const gerente = v.creadaPorId ? gerentesPorId[v.creadaPorId] : null;
          return {
            ...v,
            creadaPor: gerente?.nombre || null,
            zona: gerente?.region || null,
            creadaPorId: v.creadaPorId || null,
          };
        });
        
        setVendedoras(vendedorasConZona);
        setFilteredVendedoras(vendedorasConZona);
        setStats({
          totalVendedoras: vendedorasRes.data.length,
          totalGerentes: usuariosRes.data.length,
          consultasMes: 1250,
          reportesRecientes: vendedorasRes.data.filter((v: any) => {
            const fecha = new Date(v.createdAt);
            const hoy = new Date();
            const diffTime = Math.abs(hoy.getTime() - fecha.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 7;
          }).length,
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setFilteredVendedoras(vendedoras);
    } else {
      const filtered = vendedoras.filter(v =>
        v.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.cedula.includes(busqueda)
      );
      setFilteredVendedoras(filtered);
    }
  }, [busqueda, vendedoras]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('usuario') || '{}');
      
      let gerenteZonaId = null;
      
      if (user.rol === 'GERENTE_ZONA') {
        gerenteZonaId = user.id;
      } else if (user.rol === 'ADMIN' && formData.creadaPorId) {
        gerenteZonaId = parseInt(formData.creadaPorId);
      }

      await api.post('/vendedora', {
        nombre: formData.nombre,
        cedula: formData.cedula,
        reputacion: formData.reputacion,
        telefono: formData.telefono,
        direccion: formData.direccion,
        gerenteZonaId: gerenteZonaId,
      });
      
      setShowModal(false);
      setFormData({ 
        nombre: '', 
        cedula: '', 
        reputacion: 'OBSERVADA', 
        telefono: '', 
        direccion: '',
        creadaPorId: '',
      });
      
      const [vendedorasRes, usuariosRes] = await Promise.all([
        api.get('/vendedora'),
        api.get('/auth/usuarios?rol=GERENTE_ZONA'),
      ]);
      
      const gerentesPorId: Record<number, any> = {};
      usuariosRes.data.forEach((u: any) => {
        gerentesPorId[u.id] = u;
      });
      
      const vendedorasConZona = vendedorasRes.data.map((v: any) => {
        const gerente = v.creadaPorId ? gerentesPorId[v.creadaPorId] : null;
        return {
          ...v,
          creadaPor: gerente?.nombre || null,
          zona: gerente?.region || null,
          creadaPorId: v.creadaPorId || null,
        };
      });
      
      setVendedoras(vendedorasConZona);
      setFilteredVendedoras(vendedorasConZona);
      alert('✅ Vendedora registrada exitosamente');
    } catch (error: any) {
      console.error('Error completo:', error);
      alert('❌ Error al registrar vendedora: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta vendedora?')) {
      try {
        await api.delete(`/vendedora/${id}`);
        const vendedorasRes = await api.get('/vendedora');
        const usuariosRes = await api.get('/auth/usuarios?rol=GERENTE_ZONA');
        
        const gerentesPorId: Record<number, any> = {};
        usuariosRes.data.forEach((u: any) => {
          gerentesPorId[u.id] = u;
        });
        
        const vendedorasConZona = vendedorasRes.data.map((v: any) => {
          const gerente = v.creadaPorId ? gerentesPorId[v.creadaPorId] : null;
          return {
            ...v,
            creadaPor: gerente?.nombre || null,
            zona: gerente?.region || null,
            creadaPorId: v.creadaPorId || null,
          };
        });
        
        setVendedoras(vendedorasConZona);
        setFilteredVendedoras(vendedorasConZona);
        alert('✅ Vendedora eliminada');
      } catch (error) {
        alert('❌ Error al eliminar vendedora');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm">Total Vendedoras</p>
              <p className="text-3xl font-bold mt-1">{stats.totalVendedoras}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-indigo-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Gerentes de Zona</p>
              <p className="text-3xl font-bold mt-1">{stats.totalGerentes}</p>
            </div>
            <Users className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-sm">Consultas este mes</p>
              <p className="text-3xl font-bold mt-1">{stats.consultasMes}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-rose-100 text-sm">Reportes recientes</p>
              <p className="text-3xl font-bold mt-1">{stats.reportesRecientes}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-rose-200" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reputación</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gerente que registró</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zona</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredVendedoras.map((v) => (
              <tr key={v.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{v.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{v.cedula}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    v.reputacion === 'POSITIVA' ? 'bg-green-100 text-green-800' :
                    v.reputacion === 'OBSERVADA' ? 'bg-yellow-100 text-yellow-800' :
                    v.reputacion === 'RESTRINGIDA' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {v.reputacion}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.creadaPor || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{v.zona || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {canEdit && (
                      <button className="text-indigo-600 hover:text-indigo-800">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Vendedora" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
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
              <option value="POSITIVA">🟢 Positiva</option>
              <option value="OBSERVADA">🟡 Observada</option>
              <option value="RESTRINGIDA">🔴 Restringida</option>
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
          {usuario?.rol === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a Gerente (opcional)</label>
              <select
                value={formData.creadaPorId}
                onChange={(e) => setFormData({ ...formData, creadaPorId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Sin asignar</option>
                {gerentes.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition"
            >
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Dashboard;