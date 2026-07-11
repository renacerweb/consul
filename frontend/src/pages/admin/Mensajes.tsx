import { useEffect, useState, useCallback, useMemo } from 'react';
import { useToast } from '../../contexts/ToastContext';
import LayoutAdmin from '../../components/LayoutAdmin';
import api from '../../services/api';

interface Mensaje {
  id: number;
  titulo: string;
  contenido: string;
  leido: boolean;
  remitenteNombre: string;
  createdAt: string;
  destinatarioId?: number;
  paraTodosGerentes?: boolean;
}

interface Gerente {
  id: number;
  nombre: string;
  email: string;
}

interface FormData {
  titulo: string;
  contenido: string;
  destinatarioId: string;
  paraTodos: boolean;
}

// Constantes para mensajes
const MESSAGES = {
  LOADING: 'Cargando...',
  ERROR_LOAD: 'Error al cargar datos. Inténtalo de nuevo.',
  ERROR_SEND: 'Error al enviar mensaje. Verifica los datos.',
  SUCCESS_SEND: 'Mensaje enviado correctamente.',
  MARK_READ_ERROR: 'Error al marcar como leído.',
};

// Hook personalizado para manejar mensajes
const useMensajes = () => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMensajes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/mensajes/recibidos');
      setMensajes(response.data);
    } catch (err) {
      setError(MESSAGES.ERROR_LOAD);
      console.error('Error al cargar mensajes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarLeido = useCallback(async (id: number) => {
    try {
      await api.put(`/mensajes/${id}/leer`);
      setMensajes(prev => prev.map(m => m.id === id ? { ...m, leido: true } : m));
    } catch (err) {
      console.error(MESSAGES.MARK_READ_ERROR, err);
    }
  }, []);

  return { mensajes, loading, error, fetchMensajes, marcarLeido };
};

// Hook personalizado para gerentes
const useGerentes = () => {
  const [gerentes, setGerentes] = useState<Gerente[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchGerentes = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/mensajes/gerentes');
      setGerentes(response.data);
    } catch (err) {
      setError(MESSAGES.ERROR_LOAD);
      console.error('Error al cargar gerentes:', err);
    }
  }, []);

  return { gerentes, error, fetchGerentes };
};

// Componente Modal separado
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FormData, 'destinatarioId'> & { destinatarioId: number | null }) => void;
  gerentes: Gerente[];
}

const NuevoMensajeModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, gerentes }) => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    contenido: '',
    destinatarioId: '',
    paraTodos: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.contenido.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        titulo: formData.titulo,
        contenido: formData.contenido,
        destinatarioId: formData.paraTodos ? null : parseInt(formData.destinatarioId),
        paraTodos: formData.paraTodos,
      });
      setFormData({ titulo: '', contenido: '', destinatarioId: '', paraTodos: false });
      onClose();
    } catch (err) {
      console.error(MESSAGES.ERROR_SEND, err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 id="modal-title" className="text-xl font-bold mb-4">Enviar Mensaje</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Destinatario</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mb-2"
              value={formData.paraTodos ? 'todos' : 'individual'}
              onChange={(e) => setFormData({ ...formData, paraTodos: e.target.value === 'todos' })}
              aria-label="Seleccionar destinatario"
            >
              <option value="individual">👤 Gerente específico</option>
              <option value="todos">📢 Todos los gerentes</option>
            </select>
            {!formData.paraTodos && (
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formData.destinatarioId}
                onChange={(e) => setFormData({ ...formData, destinatarioId: e.target.value })}
                required={!formData.paraTodos}
                aria-label="Seleccionar gerente"
              >
                <option value="">Seleccionar gerente...</option>
                {gerentes.map((g) => (
                  <option key={g.id} value={g.id}>{g.nombre} - {g.email}</option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Título</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              required
              aria-label="Título del mensaje"
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Mensaje</label>
            <textarea
              value={formData.contenido}
              onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              rows={4}
              required
              aria-label="Contenido del mensaje"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg" disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function AdminMensajes() {
  const { mensajes, loading, error: mensajesError, fetchMensajes, marcarLeido } = useMensajes();
  const { gerentes, error: gerentesError, fetchGerentes } = useGerentes();
  const [showModal, setShowModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMensajes();
    fetchGerentes();
  }, [fetchMensajes, fetchGerentes]);

  const handleSendMessage = useCallback(async (data: Omit<FormData, 'destinatarioId'> & { destinatarioId: number | null }) => {
    try {
      await api.post('/mensajes/enviar', data);
      fetchMensajes();
      showToast(MESSAGES.SUCCESS_SEND, 'success');
    } catch (err) {
      showToast(MESSAGES.ERROR_SEND, 'error');
      throw err;
    }
  }, [fetchMensajes, showToast]);

  const mensajesMemo = useMemo(() => mensajes, [mensajes]);

  if (loading) return <LayoutAdmin title="Mensajes"><div>{MESSAGES.LOADING}</div></LayoutAdmin>;

  return (
    <LayoutAdmin title="Sistema de Mensajes">
      {(mensajesError || gerentesError) && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {mensajesError || gerentesError}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          aria-label="Abrir modal para nuevo mensaje"
        >
          ✉️ Nuevo Mensaje
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">De</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contenido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mensajesMemo.map((m) => (
              <tr key={m.id} className={!m.leido ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4">
                  {!m.leido && (
                    <button
                      onClick={() => marcarLeido(m.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      aria-label={`Marcar mensaje ${m.titulo} como leído`}
                    >
                      📖 Marcar leído
                    </button>
                  )}
                  {m.leido && <span className="text-gray-400">✅ Leído</span>}
                </td>
                <td className="px-6 py-4">{m.remitenteNombre}</td>
                <td className="px-6 py-4 font-medium">{m.titulo}</td>
                <td className="px-6 py-4">{m.contenido}</td>
                <td className="px-6 py-4 text-sm">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevoMensajeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSendMessage}
        gerentes={gerentes}
      />
    </LayoutAdmin>
  );
}

export default AdminMensajes;