/**
 * "Creada hoy", nunca "Creada 2026-07-13" (Sprint 2.0, punto 03 — la
 * evidencia debe leerse como algo real, no como un timestamp de base
 * de datos). Compartido por Misiones, Hábitos y Trading: los tres
 * muestran evidencia mínima con la misma voz.
 */
export function describeDay(fecha: string, now: Date = new Date()): string {
  const today = now.toISOString().slice(0, 10)
  if (fecha === today) return 'hoy'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (fecha === yesterday.toISOString().slice(0, 10)) return 'ayer'

  return `el ${fecha}`
}
