/**
 * Semana de Auditoría: lunes a domingo, calculada, nunca persistida como
 * entidad — `semanaId` es simplemente el lunes en YYYY-MM-DD (§15/§16 del
 * brief: la semana es una vista analítica, no un objeto propio).
 *
 * `agenda/agrupar.ts` ya tiene `semanaCalendario` con el mismo cálculo
 * lunes-a-domingo para el lienzo de Planificación semanal — no se reusa
 * acá a propósito: son dos consumidores independientes (Agenda planifica
 * hacia adelante con un offset de semanas; Auditoría necesita ancorar
 * semanas concretas por fecha, incluida la navegación del historial de
 * 4 semanas) y esta función es lo bastante chica como para que
 * duplicarla sea menos riesgo que acoplar Auditoría a un detalle interno
 * de Agenda que podría cambiar por razones que nada tienen que ver con
 * este módulo.
 */

function sumarDias(fechaISO: string, dias: number): string {
  const base = new Date(`${fechaISO}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/** El lunes (YYYY-MM-DD) de la semana calendario que contiene `fechaISO`. */
export function mondayOf(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`)
  const diaSemana = fecha.getUTCDay() // domingo=0 … sábado=6
  const distanciaALunes = diaSemana === 0 ? 6 : diaSemana - 1
  return sumarDias(fechaISO, -distanciaALunes)
}

/** Los 7 días (lunes→domingo) de la semana identificada por `semanaId` (su lunes). */
export function weekDays(semanaId: string): string[] {
  return Array.from({ length: 7 }, (_, i) => sumarDias(semanaId, i))
}

/** `semanaId` desplazado N semanas — negativo hacia atrás, para el historial de 4 semanas. */
export function semanaDesplazada(semanaId: string, desplazamiento: number): string {
  return sumarDias(semanaId, desplazamiento * 7)
}
