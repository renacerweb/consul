import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, User, Phone, MapPin, Clock, AlertCircle, CheckCircle, XCircle, HelpCircle, Menu, X, ArrowLeft, ArrowRight } from 'lucide-react';

const defaultCarouselSlides = [
  {
    title: 'Equipo profesional',
    subtitle: 'Imágenes reales del equipo trabajando junto a vendedoras confiables.',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    alt: 'Equipo profesional colaborando',
  },
  {
    title: 'Experiencia y confianza',
    subtitle: 'Soluciones visuales que reflejan profesionalismo y respaldo.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    alt: 'Mujeres profesionales revisando reportes',
  },
  {
    title: 'Ventas y prendas',
    subtitle: 'Mujeres en ventas con enfoque en moda y control de inventario.',
    image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80',
    alt: 'Mujeres trabajando con ropa y ventas',
  },
];

function Home() {
  const [cedula, setCedula] = useState('');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [usuario, setUsuario] = useState<any>(null);

  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);
  const [carouselLoaded, setCarouselLoaded] = useState(false);

  const getApiBaseUrl = () => {
    const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
    if (typeof rawApiUrl === 'string' && rawApiUrl.trim()) {
      return rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }
    return '';
  };

  const normalizeImageUrl = (url: string) => {
    if (!url) return url;
    const apiBaseUrl = getApiBaseUrl();
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.pathname.startsWith('/uploads/')) {
        return apiBaseUrl ? `${apiBaseUrl}${parsed.pathname}${parsed.search}` : `${parsed.pathname}${parsed.search}`;
      }
      if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) {
        return apiBaseUrl ? `${apiBaseUrl}${parsed.pathname}${parsed.search}` : `${parsed.pathname}${parsed.search}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const nextSlide = () => {
    if (!carouselSlides.length) return;
    setSlideIndex((prev) => (prev + 1) % carouselSlides.length);
  };

  const prevSlide = () => {
    if (!carouselSlides.length) return;
    setSlideIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

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
      console.error('Error al consultar vendedora:', err);
      setError(err.response?.data?.mensaje || err.message || 'Vendedora no encontrada');
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    buscar();
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]+$/.test(value)) {
      setCedula(value);
      setError('');
      setErrorValidacion('');
      if (!value) {
        setResultado(null);
      }
    }
  };

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('usuario') || 'null');
      if (user) setUsuario(user);
    } catch (e) {
      // ignore
    }
  }, []);

  const loadCarousel = () => {
    api.get('/carrusel')
      .then((response) => {
        const data = response.data;
        if (Array.isArray(data) && data.length) {
          setCarouselSlides(data.map((slide: any) => ({
            ...slide,
            image: normalizeImageUrl(slide.image),
          })));
        }
      })
      .catch(() => {})
      .finally(() => setCarouselLoaded(true));
  };

  // Listen for updates from admin when carousel changes
  useEffect(() => {
    const handler = () => {
      loadCarousel();
    };
    window.addEventListener('carouselUpdated', handler);
    return () => window.removeEventListener('carouselUpdated', handler);
  }, []);

  // Inicialmente cargar desde backend
  useEffect(() => {
    loadCarousel();
  }, []);

  const getStatusConfig = (reputacion: string) => {
    switch (reputacion) {
      case 'EXCELENTE':
        return { color: 'green', text: 'Excelente - Vendedora destacada', icon: CheckCircle, bgLight: 'bg-emerald-950/70', borderLight: 'border-emerald-700/50', textColor: 'text-emerald-200', iconColor: 'text-emerald-200' };
      case 'BUENA':
        return { color: 'blue', text: 'Activa - Vendedora confiable', icon: CheckCircle, bgLight: 'bg-blue-950/70', borderLight: 'border-blue-700/50', textColor: 'text-blue-200', iconColor: 'text-blue-200' };
      case 'POSITIVA':
        return { color: 'emerald', text: 'Positiva - Sin novedad', icon: CheckCircle, bgLight: 'bg-emerald-950/70', borderLight: 'border-emerald-700/50', textColor: 'text-emerald-200', iconColor: 'text-emerald-200' };
      case 'REGULAR':
        return { color: 'yellow', text: 'Regular - Desempeño promedio', icon: AlertCircle, bgLight: 'bg-amber-950/70', borderLight: 'border-amber-700/50', textColor: 'text-amber-200', iconColor: 'text-amber-200' };
      case 'OBSERVADA':
        return { color: 'amber', text: 'En observación - Se recomienda verificar', icon: AlertCircle, bgLight: 'bg-amber-950/70', borderLight: 'border-amber-700/50', textColor: 'text-amber-200', iconColor: 'text-amber-200' };
      case 'MALA':
        return { color: 'red', text: 'Mala - Requiere atención', icon: XCircle, bgLight: 'bg-rose-950/70', borderLight: 'border-rose-700/50', textColor: 'text-rose-200', iconColor: 'text-rose-200' };
      case 'RESTRINGIDA':
        return { color: 'rose', text: 'Restringida - Consultar con administración', icon: XCircle, bgLight: 'bg-rose-950/70', borderLight: 'border-rose-700/50', textColor: 'text-rose-200', iconColor: 'text-rose-200' };
      default:
        return { color: 'gray', text: 'Sin clasificación', icon: HelpCircle, bgLight: 'bg-slate-950/70', borderLight: 'border-slate-700/50', textColor: 'text-slate-200', iconColor: 'text-slate-200' };
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

  const displayReputacion = (reputacion: string) => {
    if (!reputacion) return 'Sin clasificación';
    return reputacion
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const statusConfigResult = resultado ? getStatusConfig(resultado.reputacion) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Header Responsive */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/95 border-b border-slate-800/60 shadow-lg">
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
              className="sm:hidden p-2 rounded-lg bg-slate-800/70 backdrop-blur-sm shadow-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-slate-800 animate-fadeIn">
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

      {/* Hero + Carousel Background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {carouselLoaded && carouselSlides.length ? (
            <img
              src={carouselSlides[slideIndex].image}
              alt={carouselSlides[slideIndex].alt}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-slate-900" />
          )}
          <div className="absolute inset-0 bg-slate-950/75 sm:bg-slate-950/60" />
        </div>
        <div className="relative min-h-[680px] sm:min-h-[760px]">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/20 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative flex h-full flex-col justify-center items-center text-center py-12 sm:py-20 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-indigo-300 animate-pulse" />
              <span className="text-xs sm:text-sm text-indigo-100 font-medium">Consulta Rápida y Segura</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Sistema de Verificación{' '}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-purple-300 bg-clip-text text-transparent">de Vendedoras</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto">
              Consulta el estado e historial de una vendedora de forma rápida y segura. Operamos en Portuguesa y Cojedes para brindar cobertura regional especializada.
            </p>
            <form onSubmit={handleSubmit} className="mt-10 w-full max-w-3xl rounded-[32px] bg-gradient-to-br from-indigo-950/90 via-slate-950 to-slate-900/95 ring-2 ring-indigo-500/20 border border-indigo-500/10 p-6 sm:p-8 shadow-[0_35px_80px_-40px_rgba(79,70,229,0.85)] backdrop-blur-xl text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-3 py-1.5 text-sm font-semibold text-indigo-100 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-300 animate-pulse" />
                Consulta prioritaria
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Buscar por cédula</h3>
              <p className="text-sm sm:text-base text-indigo-200/90 mb-6">La consulta principal de la plataforma. Ingresa cédula y revisa el estado actual de la vendedora.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200/70 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Número de cédula"
                    value={cedula}
                    onChange={handleCedulaChange}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-slate-950/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
                    inputMode="numeric"
                    maxLength={9}
                  />
                </div>
                <button
                  type="submit"
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
              <p className="text-xs text-slate-500 mt-3">Ejemplo: 12345678</p>
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
            </form>
            {carouselLoaded && carouselSlides.length > 0 && (
              <div className="mt-10 w-full max-w-4xl text-left text-white">
                <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={prevSlide}
                  disabled={!carouselSlides.length}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-slate-900/10 hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Anterior"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  {carouselSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSlideIndex(idx)}
                      className={`h-2.5 w-2.5 rounded-full transition ${idx === slideIndex ? 'bg-white' : 'bg-white/40'}`}
                      aria-label={`Ir a la diapositiva ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={nextSlide}
                  disabled={!carouselSlides.length}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-slate-900/10 hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Siguiente"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </section>
      
      {/* Instrucciones de calificación (solo visible para GERENTE_ZONA) */}
      {usuario?.rol === 'GERENTE_ZONA' && (
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl mb-6">
          <div className="bg-white/90 rounded-2xl border border-indigo-100 p-4 sm:p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-indigo-700 mb-2">Instrucciones de calificación</h3>
            <ul className="text-sm text-slate-600 space-y-1 pl-4">
              <li>• Una vendedora que dure 45 días después del cierre será calificada como <strong>OBSERVADA</strong>.</li>
              <li>• Una vendedora que dure 60 días después del cierre será calificada como <strong>RESTRINGIDA</strong>.</li>
            </ul>
          </div>
        </div>
      )}
      {/* Main Container */}
      <div className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20 max-w-7xl">
        <div className="flex flex-col justify-center items-start gap-6 md:gap-8">
          {/* Result Modal */}
          {resultado && statusConfigResult && (
            <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 bg-black/70 backdrop-blur-sm">
              <div className="relative w-full max-w-3xl animate-fadeIn">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    onClick={() => setResultado(null)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/90 text-slate-200 shadow-lg shadow-black/30 hover:bg-slate-800 transition"
                    aria-label="Cerrar ventana de resultado"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-slate-900/95 rounded-[28px] shadow-2xl border border-slate-800/70 overflow-hidden transition-all duration-300">

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
                  <div className="p-4 sm:p-6 text-center border-b border-slate-800">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-inner">
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-500" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white break-words px-2">{resultado.nombre}</h3>
                    {resultado.region_nombre && (
                      <p className="text-sm text-indigo-300 mt-1">📍 {resultado.region_nombre}</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 border-b border-slate-800">
                    <div className="flex items-center gap-3 text-slate-300">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-200">ID</span>
                      </div>
                      <span className="font-mono text-sm sm:text-base break-all">{resultado.cedula}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
                      </div>
                      <span className="text-sm sm:text-base break-all">{resultado.telefono || 'No registrado'}</span>
                    </div>
                    
                    <div className="flex items-start gap-3 text-slate-300">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
                      </div>
                      <span className="text-sm sm:text-base break-words">{resultado.direccion || 'No registrada'}</span>
                    </div>
                  </div>

                  {/* History */}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <h4 className="font-semibold text-slate-100">
                        Historial de reportes ({resultado.historial?.length || 0})
                      </h4>
                    </div>
                    
                    {resultado.historial && resultado.historial.length > 0 ? (
                      <div className="space-y-3">
                        {resultado.historial.map((h: any, idx: number) => (
                          <div key={idx} className="pl-3 border-l-2 border-indigo-200 py-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="font-medium text-slate-100 text-sm">
                                Reportado por: <span className="text-indigo-600">{h.gerenteZonaNombre || 'Gerente'}</span>
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getReputacionBadge(h.reputacion)}`}>
                                {displayReputacion(h.reputacion)}
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
            </div>
          )}
        </div>
      </div>

      {/* Contact & Join Section */}
      <section className="bg-slate-950 text-white py-14">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[32px] border border-indigo-500/15 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-sm ring-1 ring-indigo-500/10">
              <span className="text-sm uppercase tracking-[0.32em] text-indigo-300">Contáctanos</span>
              <h3 className="mt-4 text-3xl font-bold text-white">¿Tienes dudas o quieres más información?</h3>
              <p className="mt-4 text-slate-300 leading-relaxed">Escríbenos y tu mensaje llegará directamente a la bandeja del gerente regional de Portuguesa o Cojedes. El gerente te contactará para coordinar y registrar la vendedora personalmente.</p>
              <div className="mt-8 space-y-4 text-slate-200">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-100">📧</span>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <a href="mailto:contacto@renacer.com" className="text-base font-medium text-white hover:text-indigo-200">contacto@renacer.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-100">📞</span>
                  <div>
                    <p className="text-sm text-slate-400">Teléfono</p>
                    <a href="tel:+584149738052" className="text-base font-medium text-white hover:text-indigo-200">+58 414 9738052</a>
                  </div>
                </div>
              </div>
              <Link to="/contacto" className="mt-8 inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400">Enviar mensaje</Link>
            </div>

            <div className="rounded-[32px] border border-slate-800/60 bg-gradient-to-br from-indigo-900/95 via-slate-950/90 to-slate-950/95 p-8 shadow-2xl backdrop-blur-sm ring-1 ring-white/5">
              <span className="text-sm uppercase tracking-[0.32em] text-indigo-300">Únete al equipo</span>
              <h3 className="mt-4 text-3xl font-bold text-white">Captamos nuevas vendedoras</h3>
              <p className="mt-4 text-slate-300 leading-relaxed">Si eres vendedora o conoces a alguien que quiera formar parte, regístrate con nosotros y recibe todo el soporte para iniciar.</p>
              <ul className="mt-8 space-y-4 text-slate-200">
                <li className="flex gap-3">
                  <span className="mt-1">✔</span>
                  <span>Validación rápida y confiable.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1">✔</span>
                  <span>Soporte continuo para nuevos ingresos.</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1">✔</span>
                  <span>Mejora tu visibilidad ante gerentes de zona.</span>
                </li>
              </ul>
              <Link to="/registro-vendedora" className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:brightness-110">Quiero registrarme</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950/95 backdrop-blur-sm border-t border-slate-800/40 py-6 sm:py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl text-center">
          <p className="text-slate-400 text-xs sm:text-sm">
            Sistema de Verificación de Vendedoras - Renacer Check In
          </p>
          <p className="text-slate-500 text-xs mt-2">
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