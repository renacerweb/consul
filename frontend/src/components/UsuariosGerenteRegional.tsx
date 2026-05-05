import { useEffect, useState } from 'react';
import api from '../services/api';
import DataTable from './DataTable';
import Modal from './Modal';
import { UserPlus } from 'lucide-react';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  regiones?: string;
  activo: boolean;
  createdAt: string;
}

interface Region {
  id: number;
  nombre: string;
}

function UsuariosGerenteRegional() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    rol: 'GERENTE_ZONA',
    regionIds: [] as string[],
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/usuarios');
      setUsuarios(response.data);
      setError('');
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegiones = async () => {
    try {
      const response = await api.get('/regiones');
      setRegiones(response.data);
    } catch (err) {
      console.error('Error al cargar regiones:', err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRegiones();
  }, []);

  const handleRegionChange = (regionId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, regionIds: [...formData.regionIds, regionId] });
    } else {
      setFormData({ ...formData, regionIds: formData.regionIds.filter(id => id !== regionId) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const regionIdsNumber = formData.regionIds.map(id => parseInt(id, 10));
      
      await api.post('/auth/registrar', {
        email: formData.email,
        nombre: formData.nombre,
        password: formData.password,
        rol: formData.rol,
        regionIds: regionIdsNumber,
      });
      
      setShowModal(false);
      setFormData({ email: '', nombre: '', password: '', rol: 'GERENTE_ZONA', regionIds: [] });
      fetchUsuarios();
      alert('✅ Usuario creado exitosamente');
    } catch (error: any) {
      alert('❌ Error al crear usuario: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    {
      key: 'rol',
      label: 'Rol',
      render: (value: string) => {
        const roles: Record<string, string> = {
          GERENTE_ZONA: '📍 Gerente de Zona',
          AUXILIAR: '🛠️ Auxiliar',
        };
        return roles[value] || value;
      }
    },
    {
      key: 'regiones',
      label: 'Regiones',
      render: (value: string) => value || '-'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Usuarios Registrados</h2>
          <p className="text-sm text-slate-500">Total: {usuarios.length} usuarios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Crear Usuario
        </button>
      </div>

      <DataTable
        columns={columns}
        data={usuarios.filter(u => u.rol !== 'ADMIN' && u.rol !== 'GERENTE_REGIONAL')}
        loading={loading}
        emptyMessage="No hay usuarios registrados"
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Crear Usuario" size="md">
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value, regionIds: [] })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="GERENTE_ZONA">Gerente de Zona</option>
              <option value="AUXILIAR">Auxiliar</option>
            </select>
          </div>

          {/* Selector de regiones (solo para GERENTE_ZONA) */}
          {formData.rol === 'GERENTE_ZONA' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Regiones (puede seleccionar una o más)
              </label>
              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                {regiones.map(region => (
                  <label key={region.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                    <input
                      type="checkbox"
                      value={region.id}
                      checked={formData.regionIds.includes(region.id.toString())}
                      onChange={(e) => handleRegionChange(e.target.value, e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-slate-700">{region.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
              Crear
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UsuariosGerenteRegional;