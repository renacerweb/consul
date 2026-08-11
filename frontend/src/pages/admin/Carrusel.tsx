import React, { useState, useEffect } from 'react';
import LayoutAdmin from '../../components/LayoutAdmin';
import { Link } from 'react-router-dom';
import api from '../../services/api';

type Slide = {
  title: string;
  subtitle?: string;
  image: string;
  alt?: string;
};

const defaultSlides: Slide[] = [
  { title: 'Equipo profesional', subtitle: 'Imágenes reales del equipo trabajando junto a vendedoras confiables.', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80', alt: 'Equipo profesional colaborando' },
  { title: 'Experiencia y confianza', subtitle: 'Soluciones visuales que reflejan profesionalismo y respaldo.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80', alt: 'Mujeres profesionales revisando reportes' },
  { title: 'Ventas y prendas', subtitle: 'Mujeres en ventas con enfoque en moda y control de inventario.', image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=1200&q=80', alt: 'Mujeres trabajando con ropa y ventas' },
];

function AdminCarrusel() {
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await api.get('/carrusel');
        const data = response.data;
        setSlides(Array.isArray(data) ? data : defaultSlides);
      } catch (e) {
        console.error('No se pudo cargar carrusel:', e);
      }
    };
    fetchSlides();
  }, []);

  const updateSlide = (idx: number, patch: Partial<Slide>) => {
    setSlides((s) => s.map((sl, i) => (i === idx ? { ...sl, ...patch } : sl)));
  };

  const addSlide = () => setSlides((s) => [...s, { title: 'Nueva diapositiva', subtitle: '', image: '', alt: '' }]);
  const removeSlide = (idx: number) => setSlides((s) => s.filter((_, i) => i !== idx));

  const uploadImageToBackend = async (file: File) => {
    const form = new FormData();
    form.append('image', file);

    const uploadRes = await api.post('/carrusel/upload', form);
    return uploadRes.data.url as string;
  };

  const save = async () => {
    setLoading(true);
    try {
      await api.put('/carrusel', slides);
      window.dispatchEvent(new Event('carouselUpdated'));
      alert('Diapositivas guardadas');
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutAdmin title="Gestión de Carrusel">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Carrusel</h2>
          <div className="flex gap-2">
            <button onClick={addSlide} className="px-3 py-1 rounded bg-indigo-600 text-white">Agregar diapositiva</button>
            <button onClick={save} className="px-3 py-1 rounded bg-emerald-600 text-white">Guardar cambios</button>
            <Link to="/admin" className="px-3 py-1 rounded bg-slate-700 text-white">Volver</Link>
          </div>
        </div>

        <div className="space-y-4">
          {slides.map((sl, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-800/60 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <strong>Diapositiva {idx + 1}</strong>
                <button onClick={() => removeSlide(idx)} className="text-rose-400">Eliminar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Título</label>
                  <input value={sl.title} onChange={(e) => updateSlide(idx, { title: e.target.value })} className="w-full mt-1 p-2 rounded bg-slate-900 text-white" />
                  <label className="text-xs text-slate-300 mt-2 block">Subtítulo</label>
                  <input value={sl.subtitle} onChange={(e) => updateSlide(idx, { subtitle: e.target.value })} className="w-full mt-1 p-2 rounded bg-slate-900 text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-300">URL imagen</label>
                  <div className="flex gap-2">
                    <input value={sl.image} onChange={(e) => updateSlide(idx, { image: e.target.value })} className="w-full mt-1 p-2 rounded bg-slate-900 text-white" />
                    <label className="inline-flex items-center px-3 py-2 bg-slate-700 rounded text-sm cursor-pointer">
                      Subir
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadImageToBackend(file);
                          updateSlide(idx, { image: url });
                        } catch (err) {
                          console.error(err);
                          alert('Error al subir imagen');
                        }
                      }} />
                    </label>
                  </div>
                  <label className="text-xs text-slate-300 mt-2 block">Texto alternativo</label>
                  <input value={sl.alt} onChange={(e) => updateSlide(idx, { alt: e.target.value })} className="w-full mt-1 p-2 rounded bg-slate-900 text-white" />
                </div>
              </div>
              {sl.image && (
                <div className="mt-3">
                  <img src={sl.image} alt={sl.alt || sl.title} className="w-full max-h-48 object-cover rounded" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </LayoutAdmin>
  );
}

export default AdminCarrusel;
