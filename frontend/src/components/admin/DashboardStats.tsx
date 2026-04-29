import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, UserPlus, TrendingUp, ShoppingBag, Shield, UsersRound } from 'lucide-react';

interface Stats {
  totalVendedoras: number;
  totalGerentesRegionales: number;
  totalGerentesZona: number;
  totalAuxiliares: number;
  vendedorasPorRegion: { region: string; total: number }[];
  reputacionStats: { reputacion: string; total: number }[];
}

function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalVendedoras: 0,
    totalGerentesRegionales: 0,
    totalGerentesZona: 0,
    totalAuxiliares: 0,
    vendedorasPorRegion: [],
    reputacionStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const vendedorasRes = await api.get('/vendedora');
        const vendedoras = vendedorasRes.data;
        const usuariosRes = await api.get('/auth/usuarios');
        const usuarios = usuariosRes.data;

        const gerentesRegionales = usuarios.filter((u: any) => u.rol === 'GERENTE_REGIONAL');
        const gerentesZona = usuarios.filter((u: any) => u.rol === 'GERENTE_ZONA');
        const auxiliares = usuarios.filter((u: any) => u.rol === 'AUXILIAR');

        const regionMap = new Map<string, number>();
        vendedoras.forEach((v: any) => {
          const region = v.region_nombre || 'Sin región';
          regionMap.set(region, (regionMap.get(region) || 0) + 1);
        });
        const vendedorasPorRegion = Array.from(regionMap.entries()).map(([region, total]) => ({ region, total }));

        const reputacionMap = new Map<string, number>();
        vendedoras.forEach((v: any) => {
          const reputacion = v.reputacion || 'Sin reputación';
          reputacionMap.set(reputacion, (reputacionMap.get(reputacion) || 0) + 1);
        });
        const reputacionStats = Array.from(reputacionMap.entries()).map(([reputacion, total]) => ({ reputacion, total }));

        setStats({
          totalVendedoras: vendedoras.length,
          totalGerentesRegionales: gerentesRegionales.length,
          totalGerentesZona: gerentesZona.length,
          totalAuxiliares: auxiliares.length,
          vendedorasPorRegion,
          reputacionStats,
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
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 text-sm">Total Vendedoras</p>
              <p className="text-3xl font-bold mt-1">{stats.totalVendedoras}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-indigo-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm">Gerentes Regionales</p>
              <p className="text-3xl font-bold mt-1">{stats.totalGerentesRegionales}</p>
            </div>
            <UsersRound className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-sm">Gerentes de Zona</p>
              <p className="text-3xl font-bold mt-1">{stats.totalGerentesZona}</p>
            </div>
            <Users className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sky-100 text-sm">Auxiliares</p>
              <p className="text-3xl font-bold mt-1">{stats.totalAuxiliares}</p>
            </div>
            <UserPlus className="w-8 h-8 text-sky-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Vendedoras por Región
          </h3>
          <div className="space-y-3">
            {stats.vendedorasPorRegion.map((item) => (
              <div key={item.region}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.region}</span>
                  <span className="font-medium text-gray-800">{item.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 rounded-full h-2"
                    style={{ width: `${(item.total / stats.totalVendedoras) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" />
            Distribución de Reputación
          </h3>
          <div className="space-y-3">
            {stats.reputacionStats.map((item) => {
              const colors: Record<string, string> = {
                EXCELENTE: 'bg-green-500',
                BUENA: 'bg-blue-500',
                REGULAR: 'bg-yellow-500',
                MALA: 'bg-red-500',
                POSITIVA: 'bg-emerald-500',
                OBSERVADA: 'bg-amber-500',
                RESTRINGIDA: 'bg-rose-500',
              };
              const color = colors[item.reputacion] || 'bg-gray-500';
              return (
                <div key={item.reputacion}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.reputacion}</span>
                    <span className="font-medium text-gray-800">{item.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${color} rounded-full h-2`}
                      style={{ width: `${(item.total / stats.totalVendedoras) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;
