import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import DataTable from './DataTable';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { MESSAGES } from '../constants/common';

interface Mensaje {
  id: number;
  titulo: string;
  contenido: string;
  leido: boolean;
  remitenteNombre: string;
  createdAt: string;
}

function MensajesGerente() {
  const { error, wrapAsync } = useErrorHandler();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [filteredMensajes, setFilteredMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMensaje, setSelectedMensaje] = useState<Mensaje | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const fetchMensajes = useCallback(async () => {
    await wrapAsync(async () => {
      const response = await api.get('/mensajes/recibidos');
      setMensajes(response.data);
      setFilteredMensajes(response.data);
      setLoading(false);
    }, MESSAGES.ERROR_LOAD);
  }, [wrapAsync]);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  const filtered = useMemo(() => {
    if (!busqueda.trim()) return mensajes;
    return mensajes.filter(m =>
      m.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.remitenteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.contenido.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [mensajes, busqueda]);

  useEffect(() => {
    setFilteredMensajes(filtered);
  }, [filtered]);

  const marcarLeido = useCallback(async (id: number) => {
    await wrapAsync(async () => {
      await api.put(`/mensajes/${id}/leer`);
      fetchMensajes();
    }, MESSAGES.ERROR_SAVE);
  }, [wrapAsync, fetchMensajes]);

  const openMensaje = useCallback(async (mensaje: Mensaje) => {
    setSelectedMensaje(mensaje);
    setShowModal(true);
    if (!mensaje.leido) {
      await marcarLeido(mensaje.id);
    }
  }, [marcarLeido]);

  const columns = useMemo(() => [
    {
      key: 'leido',
      label: 'Estado',
      render: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
          {value ? 'Leído' : 'No leído'}
        </span>
      )
    },
    { key: 'titulo', label: 'Título', className: 'font-medium' },
    { key: 'remitenteNombre', label: 'Remitente' },
    {
      key: 'createdAt',
      label: 'Fecha',
      render: (value: string) => new Date(value).toLocaleString()
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_: any, item: Mensaje) => (
        <button
          onClick={() => openMensaje(item)}
          className="text-blue-600 hover:text-blue-800 text-sm"
          aria-label={`Ver mensaje ${item.titulo}`}
        >
          👁️ Ver
        </button>
      )
    }
  ], [openMensaje]);

  if (loading) {
    return <LoadingSpinner message={MESSAGES.LOADING} />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Mensajes</h1>
        <p className="text-gray-600">Mensajes recibidos del sistema</p>
      </div>

      {error.hasError && (
        <ErrorMessage
          message={error.message || 'Ha ocurrido un error'}
          className="mb-4"
        />
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por título, remitente o contenido..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-md"
          aria-label="Buscar mensajes"
        />
      </div>

      <DataTable
        data={filteredMensajes}
        columns={columns}
        emptyMessage="No hay mensajes"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedMensaje?.titulo || 'Mensaje'}
      >
        {selectedMensaje && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De:</label>
              <p className="text-gray-900">{selectedMensaje.remitenteNombre}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha:</label>
              <p className="text-gray-900">{new Date(selectedMensaje.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contenido:</label>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {selectedMensaje.contenido}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MensajesGerente;