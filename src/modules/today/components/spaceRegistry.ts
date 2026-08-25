import { MODULE as diario } from '@modules/journal/public'
import { MODULE as misiones } from '@modules/missions/public'
import { MODULE as asuntos } from '@modules/asuntos/public'
import { MODULE as habitos } from '@modules/habits/public'
import { MODULE as trading } from '@modules/trading/public'
import { MODULE as finanzas } from '@modules/finance/public'
import { MODULE as agenda } from '@modules/agenda/public'
import { MODULE as auditoria } from '@modules/auditoria/public'
import { MODULE as biblioteca } from '@modules/frases/public'
import type { IdeaDestino } from '@/types/idea'

export interface Space {
  /** null para Diario: no es un destino de Idea, es el registro permanente de todo lo escrito (ver destinoFurniture.ts). */
  destino: IdeaDestino | null
  path: string
  label: string
  /**
   * Core V2 — cada Espacio pasa a tener personalidad propia, no una
   * descripción funcional (Sprint "Build Core V1" citaba la columna
   * "Propósito" de docs/EL_ESTUDIO_CORE.md §5 tal cual; acá se
   * reemplaza por la frase que el propio brief de este sprint dio
   * palabra por palabra para cada módulo — nunca inventada acá). Sigue
   * sin fabricarse una para Misiones en versiones previas: este sprint
   * sí la agrega porque el brief la incluyó explícitamente.
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
  { destino: null, path: diario.path, label: diario.label, proposito: 'Pensá con claridad.' },
  { destino: 'misiones', path: misiones.path, label: misiones.label, proposito: 'Lo que merece acción.' },
  { destino: 'asuntos', path: asuntos.path, label: asuntos.label, proposito: 'Lo que espera a otro.' },
  { destino: 'habitos', path: habitos.path, label: habitos.label, proposito: 'Un día a la vez.' },
  { destino: 'trading', path: trading.path, label: trading.label, proposito: 'Operá con disciplina.' },
  {
    destino: 'finanzas',
    path: finanzas.path,
    label: finanzas.label,
    proposito: 'Entendé tu dinero.',
  },
  {
    destino: 'agenda',
    path: agenda.path,
    label: agenda.label,
    proposito: '¿Qué pasa y cuándo?',
  },
  {
    destino: null,
    path: auditoria.path,
    label: auditoria.label,
    proposito: 'Revisá lo que hiciste.',
  },
  {
    destino: 'biblioteca',
    path: biblioteca.path,
    label: biblioteca.label,
    proposito: 'Todo lo que aprendiste.',
  },
]

export const DESTINO_TO_SPACE: Partial<Record<IdeaDestino, Space>> = Object.fromEntries(
  SPACES.filter((espacio): espacio is Space & { destino: IdeaDestino } => espacio.destino !== null).map((espacio) => [
    espacio.destino,
    espacio,
  ]),
)
