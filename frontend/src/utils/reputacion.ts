export const ACTIVA = 'ACTIVA';

export const REPUTACIONES_ACTIVAS = [
  'EXCELENTE',
  ACTIVA,
  'POSITIVA',
  'REGULAR'
];

export const REPUTACIONES_ACTIVAS_FILTER = [
  'EXCELENTE',
  ACTIVA,
  'BUENA',
  'POSITIVA',
  'REGULAR'
];

export const REPUTACIONES_GERENTE_ZONA = [
  ACTIVA,
  'OBSERVADA',
  'RESTRINGIDA'
];

export const REPUTACIONES_GERENTE_ZONA_FILTER = [
  ACTIVA,
  'BUENA',
  'OBSERVADA',
  'RESTRINGIDA'
];

export const REPUTACIONES_GENERALES = [
  'EXCELENTE',
  ACTIVA,
  'POSITIVA',
  'REGULAR',
  'MALA',
  'OBSERVADA',
  'RESTRINGIDA'
];

export function normalizeReputacionToDb(reputacion?: string) {
  const value = reputacion?.toString().trim().toUpperCase();
  if (!value) return 'BUENA';
  if (value === ACTIVA) return 'BUENA';
  return value;
}

export function displayReputacion(reputacion?: string) {
  const value = reputacion?.toString().trim().toUpperCase();
  if (!value) return '';
  if (value === 'BUENA') return ACTIVA;
  return value;
}
