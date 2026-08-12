import { useIdeas } from '@modules/work-table/public'
import { seleccionarActivas, seleccionarPrincipales } from './seleccionarPrincipales'
import type { Idea } from '@/types/idea'

/**
 * Superficie pública del módulo Missions (F14, ARCHITECTURE_RATIFIED.md
 * §7, roadmap F14; renombrado de `misiones` en F16): lo único
 * importable de este módulo desde fuera. MisionesScreen se agrega acá
 * (fase "la habitación es el sistema operativo") para que el tab
 * Proyectos del Workspace lo consuma sin import directo al interior.
 */
export const MODULE = { path: '/misiones', label: 'Misiones' }
export { MisionesScreen } from './MisionesScreen'

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function mananaISO(): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  return fecha.toISOString().slice(0, 10)
}

/**
 * Sprint 015 ("Home como eje del día"): las Misiones "programadas para
 * hoy o mañana" — mismo criterio que ya usa MisionesScreen (ver
 * seleccionarPrincipales.ts), nunca un cálculo nuevo — para que Home
 * pueda mostrar "Misión principal" sin duplicar la lógica de Misiones.
 */
export function useMisionesPrincipales(): Idea[] {
  const { ideas } = useIdeas()
  return seleccionarPrincipales(seleccionarActivas(ideas), hoyISO(), mananaISO())
}
