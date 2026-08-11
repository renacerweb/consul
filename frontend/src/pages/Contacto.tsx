import { useState } from 'react';
import { Link } from 'react-router-dom';

function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/contacto/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error al enviar el contacto:', error);
      alert('No se pudo enviar el mensaje. Intenta nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-12 max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Contacto</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Enviar mensaje al gerente regional</h1>
            <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">
              Completa tus datos, asunto y mensaje. Tu comunicación llegará directamente a la bandeja del gerente regional, y el gerente te contactará para coordinar el proceso.
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
            <div className="rounded-3xl border border-green-500/20 bg-emerald-500/10 p-8 text-slate-100">
              <h2 className="text-2xl font-semibold text-white">Mensaje enviado</h2>
              <p className="mt-3 text-slate-300">
                Tu mensaje llegará a la bandeja del gerente regional. Él te contactará para coordinar el proceso; esto no crea un registro automático.
              </p>
              <div className="mt-6 space-y-3 text-slate-300">
                <p><strong>Nombre:</strong> {formData.nombre || 'No especificado'}</p>
                <p><strong>Email:</strong> {formData.email || 'No especificado'}</p>
                <p><strong>Asunto:</strong> {formData.asunto || 'No especificado'}</p>
                <p><strong>Mensaje:</strong></p>
                <p className="whitespace-pre-line rounded-2xl bg-slate-900/50 p-4 text-slate-200">{formData.mensaje || 'No especificado'}</p>
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
                <span className="text-sm text-slate-300">Asunto</span>
                <input
                  type="text"
                  value={formData.asunto}
                  onChange={(e) => handleChange('asunto', e.target.value)}
                  placeholder="Asunto del mensaje"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Mensaje</span>
                <textarea
                  value={formData.mensaje}
                  onChange={(e) => handleChange('mensaje', e.target.value)}
                  placeholder="Escribe aquí tu mensaje para el gerente regional"
                  rows={6}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">El gerente regional te contactará después; no se guarda un registro automático de la vendedora.</p>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                >
                  Enviar mensaje
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Contacto;
