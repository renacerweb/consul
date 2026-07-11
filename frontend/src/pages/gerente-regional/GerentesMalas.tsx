import { useEffect, useState } from 'react';
import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import DataTable from '../../components/DataTable';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  regiones?: string;
  activo: boolean;
}

function GerentesMalas() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/usuarios');
      const gerentesZona = response.data.filter((user: Usuario) => user.rol === 'GERENTE_ZONA');
      setUsuarios(gerentesZona);
      setError('');
    } catch (err: any) {
      console.error('Error al cargar gerentes de zona:', err);
      setError('No se pudieron cargar los gerentes de zona.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleToggleActivo = async (usuario: Usuario) => {
    const action = usuario.activo ? 'pausar' : 'reactivar';
    const confirmMessage = usuario.activo
      ? `¿Confirmas pausar el acceso de ${usuario.nombre}? No se eliminarán sus vendedoras.`
      : `¿Confirmas reactivar el acceso de ${usuario.nombre}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setSavingId(usuario.id);
      await api.put(`/auth/usuarios/${usuario.id}/activo`, { activo: !usuario.activo });
      showToast(`✅ Usuario ${usuario.activo ? 'pausado' : 'reactivado'} correctamente`, 'success');
      fetchUsuarios();
    } catch (err: any) {
      console.error('Error al actualizar estado del usuario:', err);
      showToast('❌ Error al actualizar el estado del usuario', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    {
      key: 'regiones',
      label: 'Regiones',
      render: (value: string) => value || '-',
    },
    {
      key: 'activo',
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${value ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {value ? 'Activo' : 'Pausado'}
        </span>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, row: Usuario) => (
        <button
          onClick={() => handleToggleActivo(row)}
          disabled={savingId === row.id}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition ${row.activo ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
        >
          {savingId === row.id ? 'Procesando...' : row.activo ? 'Pausar cuenta' : 'Reactivar cuenta'}
        </button>
      ),
    },
  ];

  return (
    <LayoutGerenteRegional title="Reportar Gerentes de Zona">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Reportar malas gerentes</h1>
          <p className="text-sm text-slate-600">
            Aquí puedes pausar el acceso de gerentes de zona que están fallando en su gestión. Sus vendedoras permanecerán en el sistema; solo se bloquea el acceso del usuario.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <DataTable
            columns={columns}
            data={usuarios}
            loading={loading}
            emptyMessage="No hay gerentes de zona registrados aún"
          />
        </div>
      </div>
    </LayoutGerenteRegional>
  );
}

export default GerentesMalas;
