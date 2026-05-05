import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, ShoppingBag, TrendingUp, Mail, AlertCircle, CheckCircle } from 'lucide-react';

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
  createdAt: string;
}

interface Mensaje {
  id: number;
  titulo: string;
  leido: boolean;
  createdAt: string;
}

function Dashboard({ canEdit = false, canDelete = false }: DashboardProps) {
  const [vendedoras, setVendedoras] = useState<Vendedora[]>([]);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [stats, setStats] = useState({
    totalVendedoras: 0,
    consultasMes: 0,
    mensajesSinLeer: 0,
    vendedorasPositivas: 0,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    setUsuario(user);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener vendedoras (solo las que él creó)
        const vendedorasRes = await api.get('/vendedora');
        const misVendedoras = vendedorasRes.data;
        
        // Obtener mensajes no leídos
        const mensajesRes = await api.get('/mensajes/recibidos');
        const noLeidos = mensajesRes.data.filter((m: Mensaje) => !m.leido).length;
        
        // Calcular vendedoras con reputación positiva
        const positivas = misVendedoras.filter((v: Vendedora) => 
          v.reputacion === 'BUENA' || v.reputacion === 'EXCELENTE' || v.reputacion === 'POSITIVA'
        ).length;
        
        setVendedoras(misVendedoras);
        setMensajesNoLeidos(noLeidos);
        setStats({
          totalVendedoras: misVendedoras.length,
          consultasMes: Math.floor(Math.random() * 100), // Simulado, se puede conectar a auditoría
          mensajesSinLeer: noLeidos,
          vendedorasPositivas: positivas,
        });
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Mis Vendedoras</p>
              <p className="text-3xl font-bold mt-1">{stats.totalVendedoras}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm">Vendedoras Positivas</p>
              <p className="text-3xl font-bold mt-1">{stats.vendedorasPositivas}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-200" />
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
              <p className="text-rose-100 text-sm">Mensajes sin leer</p>
              <p className="text-3xl font-bold mt-1">{stats.mensajesSinLeer}</p>
            </div>
            <Mail className="w-8 h-8 text-rose-200" />
          </div>
        </div>
      </div>

      {/* Tabla de vendedoras (solo las que él registró) */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          Mis Vendedoras Registradas
        </h3>
        
        {vendedoras.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No has registrado ninguna vendedora aún.</p>
            <p className="text-sm mt-1">Ve a la sección "Vendedoras" para registrar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reputación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vendedoras.slice(0, 5).map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{v.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{v.cedula}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        v.reputacion === 'POSITIVA' || v.reputacion === 'EXCELENTE' || v.reputacion === 'BUENA' 
                          ? 'bg-green-100 text-green-800'
                          : v.reputacion === 'OBSERVADA' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {v.reputacion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendedoras.length > 5 && (
              <div className="text-center pt-3">
                <span className="text-xs text-gray-400">+ {vendedoras.length - 5} más</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Mensaje de ayuda */}
      <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Los mensajes sin leer aparecen en la sección "Mensajes"
        </p>
      </div>
    </div>
  );
}

export default Dashboard;