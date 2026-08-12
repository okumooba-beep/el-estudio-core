import { useMemo } from 'react'
import { useAgenda } from './useAgenda'
import { useIdeas } from '@modules/work-table/public'
import { aItems, agruparPorCuando, proximoItem } from './agrupar'
import { calcularConflictosDia } from './conflictos'

/**
 * Superficie pública del módulo Agenda. `agenda` ya existía reservado
 * como IdeaDestino y FurnitureId (ver work-table/destinoFurniture.ts)
 * desde antes de tener ruta propia. Mismo patrón que finance/public.ts:
 * la ruta importa AgendaScreen directo de su propio archivo en App.tsx —
 * acá solo se expone la identidad de navegación.
 */
export const MODULE = { path: '/agenda', label: 'Agenda' }

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface ProximoAgenda {
  id: string
  tipo: 'evento' | 'bloque' | 'mision'
  texto: string
  hora: string | null
  conflictoTexto: string | null
  path: string
}

export interface AtencionAgenda {
  conflictoTexto: string | null
  hayEventoUrgente: boolean
}

export interface ResumenHoy {
  totalActividades: number
  hayCompromisoImportante: boolean
}

const RESUMEN_VACIO: ResumenHoy = { totalActividades: 0, hayCompromisoImportante: false }

/**
 * Sprint 015 ("Home como eje del día"): un único punto de entrada para
 * que Home lea "qué viene", "qué necesita atención" y "cómo se ve el
 * día" del mismo estado real que ya usa AgendaScreen (mismos
 * `aItems`/`agruparPorCuando`/`calcularConflictosDia`, nunca un cálculo
 * paralelo) — nunca copia eventos/bloques/misiones a otro lado, solo
 * los interpreta. Se llama una sola vez desde HoyScreen (useAgenda no
 * es un singleton compartido — ver useAgenda.ts) y sus resultados bajan
 * como props a FraseHoy/Proximo/AttentionSummary, para no repetir la
 * carga de IndexedDB.
 */
export function useAgendaHoy(): {
  proximo: ProximoAgenda | null
  atencion: AtencionAgenda
  resumen: ResumenHoy
  ready: boolean
} {
  const { eventos, bloques, ready } = useAgenda()
  const { ideas } = useIdeas()

  const bloquesActivos = useMemo(() => bloques.filter((bloque) => !bloque.archivado), [bloques])
  const misionesProgramadas = useMemo(
    () => ideas.filter((idea) => idea.destino === 'misiones' && idea.programadaFecha),
    [ideas],
  )
  const itemsPendientes = useMemo(
    () => aItems(eventos, bloquesActivos, misionesProgramadas).filter((item) => !item.completado),
    [eventos, bloquesActivos, misionesProgramadas],
  )
  const buckets = useMemo(() => agruparPorCuando(itemsPendientes), [itemsPendientes])

  const hoy = hoyISO()
  const eventosHoy = useMemo(() => eventos.filter((evento) => evento.fecha === hoy && !evento.completado), [eventos, hoy])
  const bloquesHoy = useMemo(() => bloquesActivos.filter((bloque) => bloque.dia === hoy), [bloquesActivos, hoy])
  const misionesHoy = useMemo(() => misionesProgramadas.filter((mision) => mision.programadaFecha === hoy), [misionesProgramadas, hoy])
  const conflictosHoy = useMemo(() => calcularConflictosDia(eventosHoy, bloquesHoy), [eventosHoy, bloquesHoy])

  return useMemo(() => {
    if (!ready) return { proximo: null, atencion: { conflictoTexto: null, hayEventoUrgente: false }, resumen: RESUMEN_VACIO, ready: false }

    const item = proximoItem(buckets)
    const conflictoDelProximo =
      item?.tipo === 'evento' ? (conflictosHoy.conflictosPorEvento.get(item.id) ?? null) : null
    const proximo: ProximoAgenda | null = item
      ? {
          id: item.id,
          tipo: item.tipo,
          texto: item.texto,
          hora: item.hora,
          conflictoTexto: conflictoDelProximo?.[0]?.texto ?? null,
          path: item.tipo === 'mision' ? '/misiones' : '/agenda',
        }
      : null

    const primerConflicto = [...conflictosHoy.conflictosPorEvento.values()][0]
    const conflictoTexto = primerConflicto?.[0]?.texto ?? null
    const hayEventoUrgente = [...buckets.ahora, ...buckets.hoy, ...buckets.manana].some(
      (candidato) => candidato.tipo === 'evento' && candidato.item.prioridad === 'urgente',
    )

    const resumen: ResumenHoy = {
      totalActividades: eventosHoy.length + bloquesHoy.length + misionesHoy.length,
      hayCompromisoImportante: eventosHoy.some((evento) => evento.prioridad === 'importante'),
    }

    return { proximo, atencion: { conflictoTexto, hayEventoUrgente }, resumen, ready: true }
  }, [ready, buckets, conflictosHoy, eventosHoy, bloquesHoy, misionesHoy])
}
