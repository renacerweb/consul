import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const { login, usuario } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Redirigir según el rol cuando el usuario está autenticado
  useEffect(() => {
    if (usuario) {
      const redirectByRole = () => {
        switch (usuario.rol) {
          case 'ADMIN':
            navigate('/admin', { replace: true });
            break;
          case 'GERENTE_REGIONAL':
            navigate('/gerente-regional', { replace: true });
            break;
          case 'GERENTE_ZONA':
            navigate('/gerente', { replace: true });
            break;
          case 'AUXILIAR':
            navigate('/auxiliar', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      };
      redirectByRole();
    }
  }, [usuario, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      showToast('Inicio de sesión exitoso', 'success');
      // La redirección se hará automáticamente en el useEffect de usuario
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-300 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-2xl bg-white">
              <img src="/logo.png" alt="Renacer logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Renacer Check In</h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto">
              Sistema de verificación de vendedoras
            </p>
          </div>

          {/* Login Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <LogIn className="w-5 h-5 text-indigo-500" />
              <h2 className="text-xl font-semibold text-slate-900">Iniciar Sesión</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="admin@renacer.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 bg-white text-indigo-500 focus:ring-indigo-400 focus:ring-offset-0 cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-slate-600 text-sm group-hover:text-slate-900 transition">Recordarme</span>
                </label>
                <Link to="/forgot-password" className="text-indigo-600 text-sm hover:text-indigo-500 transition">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:scale-100 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Ingresar
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Security notice */}
              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  Acceso restringido solo para personal autorizado
                </p>
              </div>
            </form>
          </div>

          {/* Back to home button */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;