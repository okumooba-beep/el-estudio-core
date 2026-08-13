import type { Idea } from '@/types/idea'

/**
 * Sprint 016.2 ("Misiones: principales y secundarias"): límite real
 * solo sobre cuántas misiones pueden ser Principales — nunca sobre el
 * total de misiones pendientes. Una misión pendiente jamás desaparece
 * por existir más de cinco: las que no son Principal son Secundaria,
 * nunca invisible.
 */
export const MAX_PRINCIPALES = 5

/**
 * Sprint 013, punto 6, extraído a función propia en Sprint 015 ("Home
 * como eje del día") para que Home pueda pedir el mismo cálculo sin
 * duplicarlo — MisionesScreen y Home siempre ven la misma lista.
 *
 * Sprint 016.2: ya no recorta a las cinco más antiguas (`slice` fue el
 * bug — cualquier misión pendiente más allá de la quinta directamente
 * no se renderizaba, ni siquiera oculta). Devuelve TODAS las misiones
 * pendientes; el recorte a cinco existe únicamente dentro de
 * Principales, en `seleccionarPrincipales`.
 */
export function seleccionarActivas(ideas: readonly Idea[]): Idea[] {
  const misiones = ideas.filter((idea) => idea.destino === 'misiones')
  const pendientes = misiones.filter((m) => m.estado !== 'terminada' && m.estado !== 'completada')
  return [...pendientes].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * Sprint 016.2: "Principal" es una elección explícita del usuario
 * (`Idea.misionPrincipal`), nunca un cálculo a partir de la fecha —
 * eso es exactamente lo que hacía este código antes y es el segundo
 * bug del sprint: una misión de hoy/mañana se volvía "principal" sola,
 * sin que nadie lo decidiera.
 */
export function seleccionarPrincipales(activas: readonly Idea[]): Idea[] {
  return activas.filter((m) => m.misionPrincipal === true)
}

/** Todo lo que no es Principal es Secundaria — nunca se recorta ni se oculta. */
export function seleccionarSecundarias(activas: readonly Idea[]): Idea[] {
  return activas.filter((m) => m.misionPrincipal !== true)
}
