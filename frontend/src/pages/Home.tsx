import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, User, Phone, MapPin, Clock, AlertCircle, CheckCircle, XCircle, HelpCircle, Menu, X } from 'lucide-react';

function Home() {
  const [cedula, setCedula] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const validarCedula = (value: string): boolean => {
    if (!value) return false;
    const numeros = /^\d+$/.test(value);
    const longitud = value.length >= 6 && value.length <= 9;
    return numeros && longitud;
  };

  const buscar = async () => {
    setError('');
    setErrorValidacion('');
    
    if (!cedula.trim()) {
      setErrorValidacion('Por favor ingrese un número de cédula');
      return;
    }
    
    if (!validarCedula(cedula)) {
      setErrorValidacion('La cédula debe tener entre 6 y 9 dígitos numéricos');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.get(`/vendedora/buscar/${cedula}`);
      setResultado(response.data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Vendedora no encontrada');
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]+$/.test(value)) {
      setCedula(value);
      setErrorValidacion('');
    }
  };

  const getStatusConfig = (reputacion: string) => {
    switch (reputacion) {
      case 'EXCELENTE':
        return { color: 'green', text: 'Excelente - Vendedora destacada', icon: CheckCircle, bgLight: 'bg-green-50', borderLight: 'border-green-100', textColor: 'text-green-700', iconColor: 'text-green-600' };
      case 'BUENA':
        return { color: 'blue', text: 'Buena - Vendedora confiable', icon: CheckCircle, bgLight: 'bg-blue-50', borderLight: 'border-blue-100', textColor: 'text-blue-700', iconColor: 'text-blue-600' };
      case 'POSITIVA':
        return { color: 'emerald', text: 'Positiva - Sin novedad', icon: CheckCircle, bgLight: 'bg-emerald-50', borderLight: 'border-emerald-100', textColor: 'text-emerald-700', iconColor: 'text-emerald-600' };
      case 'REGULAR':
        return { color: 'yellow', text: 'Regular - Desempeño promedio', icon: AlertCircle, bgLight: 'bg-yellow-50', borderLight: 'border-yellow-100', textColor: 'text-yellow-700', iconColor: 'text-yellow-600' };
      case 'OBSERVADA':
        return { color: 'amber', text: 'En observación - Se recomienda verificar', icon: AlertCircle, bgLight: 'bg-amber-50', borderLight: 'border-amber-100', textColor: 'text-amber-700', iconColor: 'text-amber-600' };
      case 'MALA':
        return { color: 'red', text: 'Mala - Requiere atención', icon: XCircle, bgLight: 'bg-red-50', borderLight: 'border-red-100', textColor: 'text-red-700', iconColor: 'text-red-600' };
      case 'RESTRINGIDA':
        return { color: 'rose', text: 'Restringida - Consultar con administración', icon: XCircle, bgLight: 'bg-rose-50', borderLight: 'border-rose-100', textColor: 'text-rose-700', iconColor: 'text-rose-600' };
      default:
        return { color: 'gray', text: 'Sin clasificación', icon: HelpCircle, bgLight: 'bg-gray-50', borderLight: 'border-gray-100', textColor: 'text-gray-700', iconColor: 'text-gray-600' };
    }
  };

  const getReputacionBadge = (reputacion: string) => {
    const colors: Record<string, string> = {
      EXCELENTE: 'bg-green-100 text-green-800',
      BUENA: 'bg-blue-100 text-blue-800',
      POSITIVA: 'bg-emerald-100 text-emerald-800',
      REGULAR: 'bg-yellow-100 text-yellow-800',
      OBSERVADA: 'bg-amber-100 text-amber-800',
      MALA: 'bg-red-100 text-red-800',
      RESTRINGIDA: 'bg-rose-100 text-rose-800',
    };
    return colors[reputacion] || 'bg-gray-100 text-gray-800';
  };

  const statusConfigResult = resultado ? getStatusConfig(resultado.reputacion) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header Responsive */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-base sm:text-xl">R</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Renacer Check In
              </h1>
            </div>
            
            <div className="hidden sm:block">
              <Link 
                to="/login" 
                className="group flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
              >
                <span>Iniciar Sesión</span>
                <span className="group-hover:translate-x-1 transition">→</span>
              </Link>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-slate-100 animate-fadeIn">
              <Link 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md"
              >
                <span>Iniciar Sesión</span>
                <span>→</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-8 sm:py-12 md:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/20 via-transparent to-purple-100/20" />
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-4 sm:mb-6">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs sm:text-sm text-indigo-700 font-medium">Consulta Rápida y Segura</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-3 sm:mb-4 px-2">
            Sistema de Verificación
            <span className="block sm:inline bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> de Vendedoras</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl mx-auto px-4">
            Consulta el estado e historial de una vendedora de forma rápida y segura
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20 max-w-7xl">
        <div className="flex flex-col lg:flex-row justify-center items-start gap-6 md:gap-8">
          
          {/* Search Card */}
          <div className="w-full lg:w-96">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 transition-all duration-300 hover:shadow-2xl">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-2">Buscar por cédula</h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">Ingrese el número de identificación</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Número de cédula"
                    value={cedula}
                    onChange={handleCedulaChange}
                    onKeyPress={(e) => e.key === 'Enter' && buscar()}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                    inputMode="numeric"
                    maxLength={9}
                  />
                </div>
                <button
                  onClick={buscar}
                  disabled={loading}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    'Consultar'
                  )}
                </button>
              </div>
              
              <p className="text-xs text-slate-400 mt-3">Ejemplo: 12345678</p>
              
              {errorValidacion && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errorValidacion}
                </div>
              )}
              
              {error && !resultado && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Result Card */}
          {resultado && statusConfigResult && (
            <div className="w-full lg:w-[500px] animate-fadeIn">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-white/50 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                
                {/* Status Header */}
                <div className={`p-3 sm:p-4 ${statusConfigResult.bgLight} border-b ${statusConfigResult.borderLight}`}>
                  <div className="flex items-center gap-2">
                    <statusConfigResult.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfigResult.iconColor}`} />
                    <span className={`font-semibold text-xs sm:text-sm ${statusConfigResult.textColor}`}>
                      {statusConfigResult.text}
                    </span>
                  </div>
                </div>

                {/* Profile */}
                <div className="p-4 sm:p-6 text-center border-b border-slate-100">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner">
                    <User className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 break-words px-2">{resultado.nombre}</h3>
                  {resultado.region_nombre && (
                    <p className="text-sm text-indigo-600 mt-1">📍 {resultado.region_nombre}</p>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 border-b border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-bold">ID</span>
                    </div>
                    <span className="font-mono text-sm sm:text-base break-all">{resultado.cedula}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-sm sm:text-base break-all">{resultado.telefono || 'No registrado'}</span>
                  </div>
                  
                  <div className="flex items-start gap-3 text-slate-600">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-sm sm:text-base break-words">{resultado.direccion || 'No registrada'}</span>
                  </div>
                </div>

                {/* History */}
                <div className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <h4 className="font-semibold text-slate-700">
                      Historial de reportes ({resultado.historial?.length || 0})
                    </h4>
                  </div>
                  
                  {resultado.historial && resultado.historial.length > 0 ? (
                    <div className="space-y-3">
                      {resultado.historial.map((h: any, idx: number) => (
                        <div key={idx} className="pl-3 border-l-2 border-indigo-200 py-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <p className="font-medium text-slate-700 text-sm">
                              Reportado por: <span className="text-indigo-600">{h.gerenteZonaNombre || 'Gerente'}</span>
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getReputacionBadge(h.reputacion)}`}>
                              {h.reputacion}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(h.fechaReporte).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">Sin historial de reportes</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur-sm border-t border-white/20 py-6 sm:py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl text-center">
          <p className="text-slate-500 text-xs sm:text-sm">
            Sistema de Verificación de Vendedoras - Renacer Check In
          </p>
          <p className="text-slate-400 text-xs mt-2">
            © 2026 Renacer - Todos los derechos reservados
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Home;