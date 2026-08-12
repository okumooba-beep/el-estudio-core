import type { AtencionAgenda, ResumenHoy } from '@modules/agenda/public'

/**
 * Sprint 015 ("Home como eje del día"), punto 3/8: la frase HOY es una
 * regla determinista sobre datos que ya existen (Agenda/Misiones) — no
 * IA, no texto inventado, no párrafos. El orden de los `if` es la
 * prioridad: un conflicto o un evento urgente dice más sobre el día que
 * cuántas cosas hay agendadas, así que ganan primero.
 */
export function fraseHoy(atencion: AtencionAgenda, resumen: ResumenHoy): string {
  if (atencion.conflictoTexto) return 'Hay un conflicto que necesita resolución.'
  if (atencion.hayEventoUrgente) return 'Hoy hay algo que requiere tu atención.'
  if (resumen.hayCompromisoImportante) return 'Hoy tienes un compromiso importante.'
  if (resumen.totalActividades === 0) return 'Hoy está despejado.'
  if (resumen.totalActividades <= 2) return 'Hoy tienes pocas cosas pendientes.'
  return 'Hoy tienes un día ocupado.'
}
