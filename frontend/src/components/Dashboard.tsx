import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from './Modal';
import { Users, UserPlus, TrendingUp, ShoppingBag, Search, Eye, Edit, Trash2, MoreHorizontal, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface DashboardProps {
  rol: string;
  title: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canCreate?: boolean;
}

interface Vendedora {
  id: number;
  nombre: string;
  cedula: string;
  reputacion: string;
  gerenteZonaId?: number | null;
  gerenteZona: string | null;
  zona: string | null;
  createdAt: string;
}

interface Gerente {
  id: number;
  nombre: string;
  email: string;
  region: string;
}

function Dashboard({ canEdit = false, canDelete = false, canCreate = false }: DashboardProps) {
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
    gerenteZonaId: '',
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
          api.get('/auth/usuarios'),
        ]);
        
        const gerentesList = usuariosRes.data.filter((u: any) => u.rol === 'GERENTE_ZONA');
        
        // Crear mapa de gerentes por ID
        const gerentesPorId: Record<number, any> = {};
        usuariosRes.data.forEach((u: any) => {
          if (u.rol === 'GERENTE_ZONA') {
            gerentesPorId[u.id] = u;
          }
        });
        
        // Enriquecer vendedoras con gerente y zona (región)
        const vendedorasConZona = vendedorasRes.data.map((v: any) => {
          const gerente = v.gerenteZonaId ? gerentesPorId[v.gerenteZonaId] : null;
          return {
            ...v,
            gerenteZona: gerente?.nombre || null,
            zona: gerente?.region || null,
            gerenteZonaId: v.gerenteZonaId || null,
          };
        });
        
        setVendedoras(vendedorasConZona);
        setFilteredVendedoras(vendedorasConZona);
        setStats({
          totalVendedoras: vendedorasRes.data.length,
          totalGerentes: gerentesList.length,
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
        gerenteZonaId = user.gerenteZonaId;
      } else if (user.rol === 'ADMIN' && formData.gerenteZonaId) {
        gerenteZonaId = parseInt(formData.gerenteZonaId);
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
        gerenteZonaId: '',
      });
      
      // Recargar datos
      const [vendedorasRes, usuariosRes] = await Promise.all([
        api.get('/vendedora'),
        api.get('/auth/usuarios'),
      ]);
      
      const gerentesPorId: Record<number, any> = {};
      usuariosRes.data.forEach((u: any) => {
        if (u.rol === 'GERENTE_ZONA') {
          gerentesPorId[u.id] = u;
        }
      });
      
      const vendedorasConZona = vendedorasRes.data.map((v: any) => {
        const gerente = v.gerenteZonaId ? gerentesPorId[v.gerenteZonaId] : null;
        return {
          ...v,
          gerenteZona: gerente?.nombre || null,
          zona: gerente?.region || null,
          gerenteZonaId: v.gerenteZonaId || null,
        };
      });
      
      setVendedoras(vendedorasConZona);
      setFilteredVendedoras(vendedorasConZona);
      alert('✅ Vendedora registrada exitosamente');
    } catch (error: any) {
      alert('❌ Error al registrar vendedora: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const getColorReputacion = (reputacion: string) => {
    switch (reputacion) {
      case 'POSITIVA': return 'bg-emerald-100 text-emerald-700';
      case 'OBSERVADA': return 'bg-amber-100 text-amber-700';
      case 'RESTRINGIDA': return 'bg-rose-100 text-rose-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getTextoReputacion = (reputacion: string) => {
    switch (reputacion) {
      case 'POSITIVA': return 'Positiva';
      case 'OBSERVADA': return 'Observada';
      case 'RESTRINGIDA': return 'Restringida';
      default: return 'Nueva';
    }
  };

  const getReputacionIcon = (reputacion: string) => {
    switch (reputacion) {
      case 'POSITIVA': return <CheckCircle className="w-4 h-4" />;
      case 'OBSERVADA': return <AlertCircle className="w-4 h-4" />;
      case 'RESTRINGIDA': return <Shield className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getColorZona = (zona: string | null) => {
    switch (zona) {
      case 'Portuguesa': return 'bg-green-100 text-green-700';
      case 'Cojedes': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-500';
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="group bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Vendedoras</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalVendedoras}</p>
              <p className="text-xs text-emerald-600 mt-2">+{stats.reportesRecientes} esta semana</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Gerentes de Zona</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalGerentes}</p>
              <p className="text-xs text-slate-500 mt-2">Activos</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Consultas este mes</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.consultasMes}</p>
              <p className="text-xs text-slate-500 mt-2">+12% vs mes anterior</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="group bg-gradient-to-br from-white to-indigo-50/30 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Registradas</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalVendedoras}</p>
              <p className="text-xs text-slate-500 mt-2">En total</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 mb-8 border border-white/50">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Buscar vendedora</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Nombre o cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              Registrar Vendedora
            </button>
          )}
        </div>
        
        {busqueda && filteredVendedoras.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-2">Resultados encontrados: {filteredVendedoras.length}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredVendedoras.map((v) => (
                <div key={v.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-800">{v.nombre}</p>
                    <p className="text-sm text-slate-500">Cédula: {v.cedula}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 ${getColorReputacion(v.reputacion)}`}>
                      {getReputacionIcon(v.reputacion)}
                      {getTextoReputacion(v.reputacion)}
                    </span>
                    <button className="p-1.5 rounded-lg hover:bg-white transition">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vendedoras Table - Solo Lectura */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-white/50">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-semibold text-slate-800">Listado de Vendedoras</h3>
          <p className="text-sm text-slate-500 mt-0.5">Gestión y seguimiento de vendedoras registradas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reputación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gerente que Registró</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zona</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredVendedoras.slice(0, 10).map((v) => (
                <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors duration-150">
                  <td className="px-6 py-4 font-medium text-slate-800">{v.nombre}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">{v.cedula}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getColorReputacion(v.reputacion)}`}>
                      {getReputacionIcon(v.reputacion)}
                      {getTextoReputacion(v.reputacion)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {v.gerenteZona || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getColorZona(v.zona)}`}>
                      {v.zona || 'Sin asignar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button className="p-1.5 rounded-lg hover:bg-indigo-100 transition">
                          <Edit className="w-4 h-4 text-indigo-600" />
                        </button>
                      )}
                      {canDelete && (
                        <button className="p-1.5 rounded-lg hover:bg-rose-100 transition">
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 transition">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVendedoras.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-12 h-12 text-slate-300" />
                      <p>No hay vendedoras registradas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para registrar vendedora */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Vendedora" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cédula *</label>
            <input
              type="text"
              value={formData.cedula}
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              type="tel"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Reputación</label>
            <select
              value={formData.reputacion}
              onChange={(e) => setFormData({ ...formData, reputacion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="POSITIVA">✅ Positiva</option>
              <option value="OBSERVADA">⚠️ Observada</option>
              <option value="RESTRINGIDA">🔴 Restringida</option>
              <option value="NUEVA">🔵 Nueva</option>
            </select>
          </div>

          {/* Selector de gerente - solo visible para ADMIN */}
          {usuario?.rol === 'ADMIN' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a Gerente (opcional)</label>
              <select
                value={formData.gerenteZonaId}
                onChange={(e) => setFormData({ ...formData, gerenteZonaId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              >
                <option value="">Sin asignar</option>
                {gerentes.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre} - {g.region}</option>
                ))}
              </select>
            </div>
          )}

          {/* Mensaje informativo para GERENTE */}
          {usuario?.rol === 'GERENTE_ZONA' && (
            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
              ℹ️ La vendedora será asignada automáticamente a tu zona
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