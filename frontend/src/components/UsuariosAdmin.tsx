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
  regionIds?: number[];
  activo: boolean;
  createdAt: string;
}

interface Region {
  id: number;
  nombre: string;
}

function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    rol: 'GERENTE_REGIONAL',
    regionIds: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    nombre: '',
    rol: '',
    password: '',
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

  const fetchRegionesPorUsuario = async (usuarioId: number) => {
    try {
      const response = await api.get(`/auth/usuarios/${usuarioId}/regiones`);
      return response.data.map((r: any) => r.id.toString());
    } catch (err) {
      console.error('Error al cargar regiones del usuario:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchUsuarios();
    fetchRegiones();
  }, []);

  // Manejador para checkboxes de regiones en creación
  const handleRegionChange = (regionId: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, regionIds: [...formData.regionIds, regionId] });
    } else {
      setFormData({ ...formData, regionIds: formData.regionIds.filter(id => id !== regionId) });
    }
  };

  // Manejador para checkboxes de regiones en edición
  const handleEditRegionChange = (regionId: string, checked: boolean) => {
    if (checked) {
      setEditFormData({ ...editFormData, regionIds: [...editFormData.regionIds, regionId] });
    } else {
      setEditFormData({ ...editFormData, regionIds: editFormData.regionIds.filter(id => id !== regionId) });
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
        regionIds: formData.rol === 'GERENTE_REGIONAL' ? regionIdsNumber : [],
      });
      
      setShowModal(false);
      setFormData({ email: '', nombre: '', password: '', rol: 'GERENTE_REGIONAL', regionIds: [] });
      fetchUsuarios();
      alert('✅ Usuario creado exitosamente');
    } catch (error: any) {
      alert('❌ Error al crear usuario: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsuario) return;
    try {
      const updateData: any = {
        email: editFormData.email,
        nombre: editFormData.nombre,
        rol: editFormData.rol,
      };
      
      // Solo incluir contraseña si se proporcionó
      if (editFormData.password && editFormData.password.trim() !== '') {
        updateData.password = editFormData.password;
      }
      
      // Solo incluir regionIds si es GERENTE_REGIONAL
      if (editFormData.rol === 'GERENTE_REGIONAL') {
        updateData.regionIds = editFormData.regionIds.map(id => parseInt(id, 10));
      }
      
      await api.put(`/auth/usuarios/${editUsuario.id}`, updateData);
      setShowEditModal(false);
      fetchUsuarios();
      alert('✅ Usuario actualizado correctamente');
    } catch (error: any) {
      alert('❌ Error al actualizar usuario: ' + (error.response?.data?.error || 'Error desconocido'));
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este usuario?')) {
      try {
        await api.delete(`/auth/usuarios/${id}`);
        fetchUsuarios();
        alert('✅ Usuario eliminado');
      } catch (error) {
        alert('❌ Error al eliminar usuario');
      }
    }
  };

  const openEditModal = async (usuario: Usuario) => {
    setEditUsuario(usuario);
    let regionIds: string[] = [];
    
    if (usuario.rol === 'GERENTE_REGIONAL') {
      regionIds = await fetchRegionesPorUsuario(usuario.id);
    }
    
    setEditFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      password: '',
      regionIds: regionIds,
    });
    setShowEditModal(true);
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    {
      key: 'rol',
      label: 'Rol',
      render: (value: string) => {
        const roles: Record<string, string> = {
          ADMIN: '👑 Administrador',
          GERENTE_REGIONAL: '🌎 Gerente Regional',
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
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Usuario) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            ✏️ Editar
          </button>
          {row.rol !== 'ADMIN' && (
            <button
              onClick={() => handleDelete(row.id)}
              className="text-rose-600 hover:text-rose-800"
            >
              🗑️ Eliminar
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
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Crear Usuario
        </button>
      </div>

      <DataTable
        columns={columns}
        data={usuarios}
        loading={loading}
        emptyMessage="No hay usuarios registrados"
      />

      {/* Modal para crear usuario */}
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
              <option value="GERENTE_REGIONAL">Gerente Regional</option>
              <option value="GERENTE_ZONA">Gerente de Zona</option>
              <option value="AUXILIAR">Auxiliar</option>
            </select>
          </div>

          {/* Checkboxes para regiones (solo para GERENTE_REGIONAL) */}
          {formData.rol === 'GERENTE_REGIONAL' && (
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
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
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
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              Crear
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para editar usuario */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Usuario" size="md">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={editFormData.nombre}
              onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña <span className="text-xs text-slate-400">(dejar en blanco para no cambiar)</span>
            </label>
            <input
              type="password"
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select
              value={editFormData.rol}
              onChange={(e) => setEditFormData({ ...editFormData, rol: e.target.value, regionIds: [] })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            >
              <option value="GERENTE_REGIONAL">Gerente Regional</option>
              <option value="GERENTE_ZONA">Gerente de Zona</option>
              <option value="AUXILIAR">Auxiliar</option>
            </select>
          </div>

          {/* Checkboxes para regiones en edición (solo para GERENTE_REGIONAL) */}
          {editFormData.rol === 'GERENTE_REGIONAL' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Regiones asignadas
              </label>
              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                {regiones.map(region => (
                  <label key={region.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                    <input
                      type="checkbox"
                      value={region.id}
                      checked={editFormData.regionIds.includes(region.id.toString())}
                      onChange={(e) => handleEditRegionChange(e.target.value, e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">{region.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
    </div>
  );
}

export default UsuariosAdmin;