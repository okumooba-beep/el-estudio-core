import { MODULE as diario } from '@modules/journal/public'
import { MODULE as misiones } from '@modules/missions/public'
import { MODULE as habitos } from '@modules/habits/public'
import { MODULE as trading } from '@modules/trading/public'
import { MODULE as finanzas } from '@modules/finance/public'
import { MODULE as biblioteca } from '@modules/frases/public'
import type { IdeaDestino } from '@/types/idea'

export interface Space {
  /** null para Diario: no es un destino de Idea, es el registro permanente de todo lo escrito (ver destinoFurniture.ts). */
  destino: IdeaDestino | null
  path: string
  label: string
  /**
   * Columna "Propósito" de docs/EL_ESTUDIO_CORE.md §5 (Information
   * Architecture) citada tal cual, nunca redactada de nuevo acá —
   * ese documento ya es la especificación oficial de qué es cada
   * módulo. Misiones no aparece como fila propia en esa tabla (el
   * documento la describe como parte de la Pizarra/Calendar,
   * todavía sin construir): por eso queda sin propósito en vez de
   * inventarle uno.
   */
  proposito: string | null
}

/**
 * Build Core V1 — "Espacios": la misma lista de destinos reales que ya
 * armó Sprint "Build V1" (ModuleGrid). No importa `@world/studio/muebles`
 * (a diferencia de esa versión): dependency-cruiser (`module-no-world`)
 * solo exime a IdeaCapture/MisionesScreen/HabitosScreen/TradingScreen, no
 * a un archivo nuevo — así que la identidad de "lugar" viene del propio
 * spec de producto, no del grafo de muebles.
 *
 * El brief sugirió también "Planning" y "AI" como Espacios — ninguno de
 * los dos tiene mueble, ruta, ni destino en IdeaDestino (ver
 * src/types/idea.ts), y ninguno aparece en la tabla de módulos de
 * EL_ESTUDIO_CORE.md: no corresponde fabricarlos acá. Se documenta como
 * decisión explícita en el reporte de este sprint, no en silencio.
 */
export const SPACES: readonly Space[] = [
  { destino: null, path: diario.path, label: diario.label, proposito: 'Escritura rápida, memoria por asociación' },
  { destino: 'misiones', path: misiones.path, label: misiones.label, proposito: null },
  { destino: 'habitos', path: habitos.path, label: habitos.label, proposito: 'Consistencia mínima, sin gamificación' },
  { destino: 'trading', path: trading.path, label: trading.label, proposito: 'Reemplazo del diario de trading externo' },
  {
    destino: 'finanzas',
    path: finanzas.path,
    label: finanzas.label,
    proposito: 'Conciencia de dinero sin complejidad contable',
  },
  {
    destino: 'biblioteca',
    path: biblioteca.path,
    label: biblioteca.label,
    proposito: 'Referencias y citas acumuladas, curadas',
  },
]

export const DESTINO_TO_SPACE: Partial<Record<IdeaDestino, Space>> = Object.fromEntries(
  SPACES.filter((espacio): espacio is Space & { destino: IdeaDestino } => espacio.destino !== null).map((espacio) => [
    espacio.destino,
    espacio,
  ]),
)
