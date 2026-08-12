import type { Idea } from '@/types/idea'

/** Sprint 006: nunca configurable, nunca un contador — el número vive únicamente acá. */
export const MAX_ACTIVAS = 5

/**
 * Sprint 013, punto 6, extraído a función propia en Sprint 015 ("Home
 * como eje del día") para que Home pueda pedir el mismo cálculo sin
 * duplicarlo — MisionesScreen y Home siempre ven la misma lista.
 */
export function seleccionarActivas(ideas: readonly Idea[]): Idea[] {
  const misiones = ideas.filter((idea) => idea.destino === 'misiones')
  const pendientes = misiones.filter((m) => m.estado !== 'terminada' && m.estado !== 'completada')
  return [...pendientes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, MAX_ACTIVAS)
}

/** "Principal" es solo "programada para hoy o mañana", nada más (Sprint 013, punto 6). */
export function seleccionarPrincipales(activas: readonly Idea[], hoyISO: string, mananaISO: string): Idea[] {
  return activas.filter((m) => m.programadaFecha === hoyISO || m.programadaFecha === mananaISO)
}

export function seleccionarSecundarias(activas: readonly Idea[], hoyISO: string, mananaISO: string): Idea[] {
  return activas.filter((m) => m.programadaFecha !== hoyISO && m.programadaFecha !== mananaISO)
}
