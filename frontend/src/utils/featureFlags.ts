const GERENTE_ZONA_CAMPANAS_KEY = 'feature:gerente-zona-campanas-enabled';
const GERENTE_COLECCIONES_KEY = 'feature:gerente-colecciones-enabled';

export function isGerenteZonaCampanasEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  const storedValue = window.localStorage.getItem(GERENTE_ZONA_CAMPANAS_KEY);
  if (storedValue === null) return true;

  return storedValue === 'true';
}

export function setGerenteZonaCampanasEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(GERENTE_ZONA_CAMPANAS_KEY, String(enabled));
}

export function isGerenteColeccionesEnabled(): boolean {
  if (typeof window === 'undefined') return true;

  const storedValue = window.localStorage.getItem(GERENTE_COLECCIONES_KEY);
  if (storedValue === null) return true;

  return storedValue === 'true';
}

export function setGerenteColeccionesEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(GERENTE_COLECCIONES_KEY, String(enabled));
}
