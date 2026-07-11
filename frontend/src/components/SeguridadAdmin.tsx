import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import DataTable from './DataTable';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { MESSAGES } from '../constants/common';
import { isGerenteZonaCampanasEnabled, setGerenteZonaCampanasEnabled, isGerenteColeccionesEnabled, setGerenteColeccionesEnabled } from '../utils/featureFlags';

interface IPBloqueada {
  id: number;
  ip: string;
  motivo: string;
  fechaBloqueo: string;
  fechaExpiracion: string;
  intentosRegistrados: number;
}

interface Auditoria {
  id: number;
  cedulaConsultada: string;
  usuarioId: number;
  ip: string;
  fecha: string;
  exitosa: boolean;
}

function SeguridadAdmin() {
  const { error, wrapAsync } = useErrorHandler();
  const [ipsBloqueadas, setIpsBloqueadas] = useState<IPBloqueada[]>([]);
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'bloqueadas' | 'auditoria' | 'funciones'>('bloqueadas');
  const [campanasGerenteZonaEnabled, setCampanasGerenteZonaEnabled] = useState(isGerenteZonaCampanasEnabled());
  const [coleccionesGerenteEnabled, setColeccionesGerenteEnabled] = useState(isGerenteColeccionesEnabled());

  const fetchIpsBloqueadas = useCallback(async () => {
    await wrapAsync(async () => {
      const response = await api.get('/seguridad/ips-bloqueadas');
      setIpsBloqueadas(response.data);
      setLoading(false);
    }, MESSAGES.ERROR_LOAD);
  }, [wrapAsync]);

  const fetchAuditoria = useCallback(async () => {
    await wrapAsync(async () => {
      const response = await api.get('/seguridad/auditoria');
      setAuditoria(response.data);
      setLoading(false);
    }, MESSAGES.ERROR_LOAD);
  }, [wrapAsync]);

  useEffect(() => {
    Promise.all([fetchIpsBloqueadas(), fetchAuditoria()]).finally(() => setLoading(false));
  }, [fetchIpsBloqueadas, fetchAuditoria]);

  const handleDesbloquearIP = useCallback(async (id: number) => {
    if (!window.confirm('¿Está seguro de desbloquear esta IP?')) return;
    await wrapAsync(async () => {
      await api.delete(`/seguridad/ips-bloqueadas/${id}`);
      fetchIpsBloqueadas();
    }, MESSAGES.ERROR_SAVE);
  }, [wrapAsync, fetchIpsBloqueadas]);

  const handleToggleCampanasGerenteZona = useCallback((enabled: boolean) => {
    setGerenteZonaCampanasEnabled(enabled);
    setCampanasGerenteZonaEnabled(enabled);
    window.location.reload();
  }, []);

  const handleToggleColeccionesGerente = useCallback((enabled: boolean) => {
    setGerenteColeccionesEnabled(enabled);
    setColeccionesGerenteEnabled(enabled);
    window.location.reload();
  }, []);

  const ipsColumns = useMemo(() => [
    { key: 'ip', label: 'Dirección IP', className: 'font-mono' },
    { key: 'motivo', label: 'Motivo' },
    {
      key: 'fechaBloqueo',
      label: 'Fecha Bloqueo',
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: 'fechaExpiracion',
      label: 'Fecha Expiración',
      render: (value: string) => new Date(value).toLocaleString()
    },
    { key: 'intentosRegistrados', label: 'Intentos' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, item: IPBloqueada) => (
        <button
          onClick={() => handleDesbloquearIP(item.id)}
          className="text-green-600 hover:text-green-800 text-sm"
          aria-label={`Desbloquear IP ${item.ip}`}
        >
          🔓 Desbloquear
        </button>
      )
    }
  ], [handleDesbloquearIP]);

  const auditoriaColumns = useMemo(() => [
    { key: 'cedulaConsultada', label: 'Cédula Consultada', className: 'font-mono' },
    { key: 'ip', label: 'IP Origen', className: 'font-mono' },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: 'exitosa',
      label: 'Resultado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Exitosa' : 'Fallida'}
        </span>
      )
    }
  ], []);

  if (loading) {
    return <LoadingSpinner message={MESSAGES.LOADING} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel de Seguridad</h1>
        <p className="text-gray-600">Monitoreo de seguridad y auditoría del sistema</p>
      </div>

      {error.hasError && (
        <ErrorMessage
          message={error.message || 'Ha ocurrido un error'}
          className="mb-4"
        />
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab('bloqueadas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'bloqueadas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            IPs Bloqueadas ({ipsBloqueadas.length})
          </button>
          <button
            onClick={() => setTab('auditoria')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'auditoria'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Auditoría ({auditoria.length})
          </button>
          <button
            onClick={() => setTab('funciones')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tab === 'funciones'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Funciones
          </button>
        </nav>
      </div>

      {/* Contenido de las tabs */}
      {tab === 'bloqueadas' && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Direcciones IP Bloqueadas</h2>
            <p className="text-gray-600 text-sm">IPs bloqueadas por intentos de acceso fallidos</p>
          </div>
          <DataTable
            data={ipsBloqueadas}
            columns={ipsColumns}
            emptyMessage="No hay IPs bloqueadas"
          />
        </div>
      )}

      {tab === 'auditoria' && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Registro de Auditoría</h2>
            <p className="text-gray-600 text-sm">Historial de consultas realizadas al sistema</p>
          </div>
          <DataTable
            data={auditoria}
            columns={auditoriaColumns}
            emptyMessage="No hay registros de auditoría"
          />
        </div>
      )}

      {tab === 'funciones' && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Funcionalidades por rol</h2>
            <p className="text-gray-600 text-sm">Activa o desactiva el módulo de campañas para los gerentes de zona.</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Módulo de campañas para gerentes</h3>
                  <p className="text-sm text-gray-600">Cuando está activado, el menú y la ruta de campañas quedan disponibles para los rol(es) correspondientes.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={campanasGerenteZonaEnabled}
                    onChange={(e) => handleToggleCampanasGerenteZona(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-green-600">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Módulo de colecciones para gerente regional</h3>
                  <p className="text-sm text-gray-600">Cuando está activado, el menú y la ruta de colecciones quedan disponibles para el Gerente Regional.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={coleccionesGerenteEnabled}
                    onChange={(e) => handleToggleColeccionesGerente(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="relative h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-green-600">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeguridadAdmin;