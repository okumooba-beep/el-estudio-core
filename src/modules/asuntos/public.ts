import { useIdeas } from '@modules/work-table/public'
import { estadoDe, prioridadDe } from './estados'

/**
 * Superficie pública del módulo Asuntos (ARCHITECTURE_RATIFIED.md §7):
 * lo único importable desde fuera.
 */
export const MODULE = { path: '/asuntos', label: 'Asuntos' }
export { AsuntosScreen } from './AsuntosScreen'

/**
 * Señal de atención para Home (Sprint "Home refleja estado real de los
 * Espacios"): Home no conoce "Importante"/"Pendiente"/"En espera" — solo
 * recibe destino + mensaje ya armados acá, con el mismo criterio que ya
 * usa AsuntosScreen (estadoDe/prioridadDe) para no inventar un estado
 * nuevo. `null` significa "nada que atender", nunca un mensaje vacío.
 */
export function useAttentionSignal(): { destino: 'asuntos'; mensaje: string } | null {
  const { ideas } = useIdeas()
  const hayImportantesEnEspera = ideas.some(
    (idea) =>
      idea.destino === 'asuntos' &&
      prioridadDe(idea) === 'importante' &&
      (estadoDe(idea) === 'pendiente' || estadoDe(idea) === 'en-espera'),
  )
  return hayImportantesEnEspera ? { destino: 'asuntos', mensaje: 'Asuntos tiene algo importante en espera' } : null
}
