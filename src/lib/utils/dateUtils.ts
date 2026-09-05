/**
 * Utilidades para manejo de fechas en formato local "YYYY-MM-DD HH:mm:ss"
 * Evita desfaces de zona horaria generados por cadenas ISO en UTC (Z).
 */

function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Formatea un objeto Date (o fecha actual) al formato local "YYYY-MM-DD HH:mm:ss"
 * Ejemplo: "2026-08-26 11:30:04"
 */
export function formatLocalDateTime(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Calcula la fecha de expiración sumando minutos a la fecha actual
 * y devuelve el string formateado en "YYYY-MM-DD HH:mm:ss"
 */
export function calculateExpirationDate(minutes: number, fromDate: Date = new Date()): string {
  const expires = new Date(fromDate.getTime() + minutes * 60 * 1000);
  return formatLocalDateTime(expires);
}

/**
 * Convierte un string "YYYY-MM-DD HH:mm:ss" (o formato ISO) a timestamp en milisegundos
 */
export function parseDateTimeToMs(dateStr: string): number {
  if (!dateStr) return 0;
  // Si viene en formato "YYYY-MM-DD HH:mm:ss", reemplazar espacio por T para parseo nativo local consistente
  const normalized = dateStr.includes(' ') && !dateStr.includes('T')
    ? dateStr.replace(' ', 'T')
    : dateStr;
  return new Date(normalized).getTime();
}

/**
 * Verifica si una fecha en string "YYYY-MM-DD HH:mm:ss" ya expiró respecto al momento actual
 */
export function isExpired(expiresAtStr: string): boolean {
  const expiresMs = parseDateTimeToMs(expiresAtStr);
  return Date.now() > expiresMs;
}
