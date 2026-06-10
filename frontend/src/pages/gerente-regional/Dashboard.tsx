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
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({});
  const [reputacionCounts, setReputacionCounts] = useState<Record<string, number>>({});
  const [gerentesPorRegion, setGerentesPorRegion] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener vendedoras (el backend filtra por sus regiones)
        const vendedorasRes = await api.get('/vendedora');
        const vendedoras = vendedorasRes.data;
        
        // Obtener gerentes de zona (con su región)
        const gerentesRes = await api.get('/auth/gerentes-zona');
        const gerentesZona = gerentesRes.data; // cada elemento tiene .region
        
        // Obtener mensajes no leídos
        const mensajesRes = await api.get('/mensajes/recibidos');
        const noLeidos = mensajesRes.data.filter((m: any) => !m.leido).length;
        
        // Calcular vendedoras con reputación negativa (MALA o RESTRINGIDA)
        const negativas = vendedoras.filter((v: any) => 
          v.reputacion === 'MALA' || v.reputacion === 'RESTRINGIDA'
        ).length;

        // Agrupar por región
        const byRegion: Record<string, number> = {};
        vendedoras.forEach((v: any) => {
          const name = v.region_nombre || 'Sin región';
          byRegion[name] = (byRegion[name] || 0) + 1;
        });

        // Distribución por reputación
        const byReputacion: Record<string, number> = {};
        vendedoras.forEach((v: any) => {
          const r = v.reputacion || 'DESCONOCIDA';
          byReputacion[r] = (byReputacion[r] || 0) + 1;
        });
        
        // Consultas simuladas (se puede conectar a auditoría después)
        const consultas = Math.floor(Math.random() * 100) + 50;
        
        setStats({
          totalVendedoras: vendedoras.length,
          vendedorasNegativas: negativas,
          consultasMes: consultas,
          mensajesSinLeer: noLeidos,
          totalGerentesZona: gerentesZona.length,
        });
        setRegionCounts(byRegion);
        setReputacionCounts(byReputacion);
        // Contar gerentes por región
        const gByRegion: Record<string, number> = {};
        gerentesZona.forEach((g: any) => {
          const r = g.region || 'Sin región';
          gByRegion[r] = (gByRegion[r] || 0) + 1;
        });
        setGerentesPorRegion(gByRegion);
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

      {/* Métrica: Gerentes por Región específica (Portuguesa / Cojedes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Gerentes de Zona en <span className="font-semibold">Portuguesa</span></p>
          <p className="text-2xl font-bold mt-2 text-emerald-700">{gerentesPorRegion['Portuguesa'] || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Gerentes de Zona en <span className="font-semibold">Cojedes</span></p>
          <p className="text-2xl font-bold mt-2 text-emerald-700">{gerentesPorRegion['Cojedes'] || 0}</p>
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

      {/* Panels: Vendedoras por Región y Distribución de Reputación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Vendedoras por Región */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-md font-semibold text-slate-800 mb-4">Vendedoras por Región</h2>
          <div className="space-y-3">
            {(() => {
              const entries = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
              const max = entries.length ? entries[0][1] : 1;
              return entries.map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <div className="w-3/4 pr-3">
                    <div className="text-sm text-slate-600 mb-1">{region}</div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.round((count / max) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="w-1/4 text-right text-sm text-slate-700 font-medium">{count}</div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Distribución de Reputación */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-md font-semibold text-slate-800 mb-4">Distribución de Reputación</h2>
          <div className="space-y-3">
            {(() => {
              const entries = Object.entries(reputacionCounts).sort((a, b) => b[1] - a[1]);
              const max = entries.length ? entries[0][1] : 1;
              const colorMap: Record<string, string> = {
                RESTRINGIDA: 'bg-rose-500',
                MALA: 'bg-red-500',
                OBSERVADA: 'bg-amber-500',
                BUENA: 'bg-emerald-500',
                DESCONOCIDA: 'bg-slate-400',
              };
              return entries.map(([rep, count]) => (
                <div key={rep} className="flex items-center justify-between">
                  <div className="w-3/4 pr-3">
                    <div className="text-sm text-slate-600 mb-1">{rep}</div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${colorMap[rep] || 'bg-slate-400'} h-2 rounded-full`} style={{ width: `${Math.round((count / max) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="w-1/4 text-right text-sm text-slate-700 font-medium">{count}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalDashboard;