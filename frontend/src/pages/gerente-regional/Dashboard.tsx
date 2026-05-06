import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';
import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, ShoppingBag, TrendingUp, Mail, AlertCircle, XCircle } from 'lucide-react';

function GerenteRegionalDashboard() {
  const [stats, setStats] = useState({
    totalVendedoras: 0,
    vendedorasNegativas: 0,
    consultasMes: 0,
    mensajesSinLeer: 0,
    totalGerentesZona: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener vendedoras (el backend filtra por sus regiones)
        const vendedorasRes = await api.get('/vendedora');
        const vendedoras = vendedorasRes.data;
        
        // Obtener gerentes de zona que él creó
        const usuariosRes = await api.get('/auth/usuarios');
        const gerentesZona = usuariosRes.data.filter((u: any) => u.rol === 'GERENTE_ZONA');
        
        // Obtener mensajes no leídos
        const mensajesRes = await api.get('/mensajes/recibidos');
        const noLeidos = mensajesRes.data.filter((m: any) => !m.leido).length;
        
        // Calcular vendedoras con reputación negativa (MALA o RESTRINGIDA)
        const negativas = vendedoras.filter((v: any) => 
          v.reputacion === 'MALA' || v.reputacion === 'RESTRINGIDA'
        ).length;
        
        // Consultas simuladas (se puede conectar a auditoría después)
        const consultas = Math.floor(Math.random() * 100) + 50;
        
        setStats({
          totalVendedoras: vendedoras.length,
          vendedorasNegativas: negativas,
          consultasMes: consultas,
          mensajesSinLeer: noLeidos,
          totalGerentesZona: gerentesZona.length,
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LayoutGerenteRegional title="Dashboard Gerente Regional">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Vendedoras */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Total Vendedoras</p>
              <p className="text-3xl font-bold mt-1">{stats.totalVendedoras}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        {/* Vendedoras Negativas */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-100 text-sm">Vendedoras Negativas</p>
              <p className="text-3xl font-bold mt-1">{stats.vendedorasNegativas}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>

        {/* Consultas este mes */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-sm">Consultas este mes</p>
              <p className="text-3xl font-bold mt-1">{stats.consultasMes}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        {/* Mensajes sin leer */}
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

      {/* Información adicional - Gerentes de Zona bajo supervisión */}
      <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          Gerentes de Zona Bajo tu Supervisión
        </h3>
        <p className="text-gray-600">
          Has creado <span className="font-bold text-emerald-600">{stats.totalGerentesZona}</span> gerentes de zona
        </p>
        <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Puedes gestionar tus gerentes de zona en la sección "Usuarios"
          </p>
        </div>
      </div>
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalDashboard;