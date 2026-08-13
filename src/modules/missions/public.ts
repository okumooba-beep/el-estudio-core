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

/**
 * Sprint 015 ("Home como eje del día"): las Misiones que el usuario
 * marcó como Principal — mismo criterio que ya usa MisionesScreen (ver
 * seleccionarPrincipales.ts), nunca un cálculo nuevo — para que Home
 * pueda mostrar "Misión principal" sin duplicar la lógica de Misiones.
 *
 * Sprint 016.2: ya no depende de hoy/mañana — Principal es una
 * elección explícita del usuario, no una fecha.
 */
export function useMisionesPrincipales(): Idea[] {
  const { ideas } = useIdeas()
  return seleccionarPrincipales(seleccionarActivas(ideas))
}
