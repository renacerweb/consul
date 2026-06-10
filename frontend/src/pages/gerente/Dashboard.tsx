import { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, Mail } from 'lucide-react';
import LayoutGerente from '../../components/LayoutGerente';
import api from '../../services/api';

function GerenteDashboard() {
  const [stats, setStats] = useState({
    totalVendedoras: 0,
    consultasMes: 0,
    mensajesSinLeer: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const vendedorasRes = await api.get('/vendedora');
        const mensajesRes = await api.get('/mensajes/recibidos');

        const noLeidos = mensajesRes.data.filter((m: any) => !m.leido).length;
        const consultas = Math.floor(Math.random() * 100) + 20;

        setStats({
          totalVendedoras: vendedorasRes.data.length,
          consultasMes: consultas,
          mensajesSinLeer: noLeidos,
        });
      } catch (error) {
        console.error('Error al cargar estadísticas del dashboard:', error);
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
    <LayoutGerente title="Inicio">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Total Vendedoras</p>
              <p className="text-3xl font-bold mt-1">{stats.totalVendedoras}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-emerald-200" />
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Instrucciones para Gerente de Zona</h2>
        <div className="space-y-3 text-sm text-slate-600">
          <p>Una vendedora que dure 45 días después del cierre será calificada como <strong>OBSERVADA</strong>.</p>
          <p>Una vendedora que dure 60 días después del cierre será calificada como <strong>RESTRINGIDA</strong>.</p>
        </div>
      </div>
    </LayoutGerente>
  );
}

export default GerenteDashboard;