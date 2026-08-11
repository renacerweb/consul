import { useState } from 'react';
import { Link } from 'react-router-dom';

function RegistroVendedora() {
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    comentario: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Registro de vendedora</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Quiero unirme como vendedora</h1>
            <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">
              Completa tus datos y nuestro equipo de gerentes regionales te contactará para continuar el proceso.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Volver al inicio
          </Link>
        </div>

        <div className="rounded-[32px] bg-white/5 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
          {submitted ? (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-slate-100">
              <h2 className="text-2xl font-semibold text-white">Registro enviado</h2>
              <p className="mt-3 text-slate-300">
                Gracias por tu interés. Un gerente regional recibirá tu solicitud y se pondrá en contacto contigo.
              </p>
              <div className="mt-6 space-y-3 text-slate-300">
                <p><strong>Nombre:</strong> {formData.nombre || 'No especificado'}</p>
                <p><strong>Cédula:</strong> {formData.cedula || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> {formData.telefono || 'No especificado'}</p>
                <p><strong>Email:</strong> {formData.email || 'No especificado'}</p>
                <p><strong>Comentario:</strong></p>
                <p className="whitespace-pre-line rounded-2xl bg-slate-900/50 p-4 text-slate-200">{formData.comentario || 'No especificado'}</p>
              </div>
              <Link
                to="/"
                className="mt-6 inline-flex rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
              >
                Volver al inicio
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">Nombre completo</span>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Tu nombre"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-300">Cédula</span>
                  <input
                    type="text"
                    value={formData.cedula}
                    onChange={(e) => handleChange('cedula', e.target.value)}
                    placeholder="Número de cédula"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-300">Teléfono</span>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="Tu teléfono"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-300">Correo electrónico</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm text-slate-300">Comentario</span>
                <textarea
                  value={formData.comentario}
                  onChange={(e) => handleChange('comentario', e.target.value)}
                  placeholder="Describe tu experiencia o lo que esperas del registro"
                  rows={5}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">Un gerente regional revisará tu solicitud y te contactará.</p>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                >
                  Enviar registro
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegistroVendedora;
