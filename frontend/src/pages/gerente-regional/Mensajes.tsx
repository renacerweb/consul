import { useEffect, useState, useCallback, useMemo } from 'react';
import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Mensaje {
  id: number;
  titulo: string;
  contenido: string;
  leido: boolean;
  remitenteNombre: string;
  createdAt: string;
}

interface Gerente {
  id: number;
  nombre: string;
  email: string;
}

function NuevoMensajeModal({ isOpen, onClose, onSubmit, gerentes }: any) {
  const [formData, setFormData] = useState({ titulo: '', contenido: '', destinatarioId: '', paraTodos: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: any) => {
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
      console.error('Error al enviar mensaje', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Enviar Mensaje</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Destinatario</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mb-2"
              value={formData.paraTodos ? 'todos' : 'individual'}
              onChange={(e) => setFormData({ ...formData, paraTodos: e.target.value === 'todos' })}
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
              >
                <option value="">Seleccionar gerente...</option>
                {gerentes.map((g: Gerente) => (
                  <option key={g.id} value={g.id}>{g.nombre} - {g.email}</option>
                ))}
              </select>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Título</label>
            <input type="text" value={formData.titulo} onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Mensaje</label>
            <textarea value={formData.contenido} onChange={(e) => setFormData({ ...formData, contenido: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={4} required />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function GerenteRegionalMensajes() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerentes, setGerentes] = useState<Gerente[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchMensajes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/mensajes/recibidos');
      setMensajes(res.data);
    } catch (err) {
      console.error('Error al cargar mensajes', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGerentes = useCallback(async () => {
    try {
      const res = await api.get('/mensajes/gerentes');
      setGerentes(res.data);
    } catch (err) {
      console.error('Error al cargar gerentes', err);
    }
  }, []);

  useEffect(() => {
    fetchMensajes();
    fetchGerentes();
  }, [fetchMensajes, fetchGerentes]);

  const handleSend = useCallback(async (data: any) => {
    await api.post('/mensajes/enviar', data);
    await fetchMensajes();
    alert('Mensaje enviado');
  }, [fetchMensajes]);

  const marcarLeido = useCallback(async (id: number) => {
    try {
      await api.put(`/mensajes/${id}/leer`);
      await fetchMensajes();
    } catch (err) {
      console.error('Error al marcar leído', err);
    }
  }, [fetchMensajes]);

  if (loading) return <LayoutGerenteRegional title="Mensajes"><LoadingSpinner message="Cargando..." /></LayoutGerenteRegional>;

  return (
    <LayoutGerenteRegional title="Mensajes">
      <div className="mb-4">
        <button onClick={() => setShowModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg">✉️ Nuevo Mensaje</button>
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
            {mensajes.map((m) => (
              <tr key={m.id} className={!m.leido ? 'bg-blue-50' : ''}>
                <td className="px-6 py-4">
                  {!m.leido ? (
                    <button onClick={() => marcarLeido(m.id)} className="text-blue-600 hover:text-blue-800 text-sm">📖 Marcar leído</button>
                  ) : (
                    <span className="text-gray-400">✅ Leído</span>
                  )}
                </td>
                <td className="px-6 py-4">{m.remitenteNombre}</td>
                <td className="px-6 py-4 font-medium">{m.titulo}</td>
                <td className="px-6 py-4">{m.contenido}</td>
                <td className="px-6 py-4 text-sm">{new Date(m.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevoMensajeModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleSend} gerentes={gerentes} />
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalMensajes;
