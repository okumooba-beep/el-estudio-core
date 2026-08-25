import { useEffect, useMemo, useState } from 'react'
import { useAgenda } from './useAgenda'
import { agendaBloqueRepository, type NuevoAgendaBloque } from './agendaRepository'
import { useIdeas } from '@modules/work-table/public'
import { aItems, agruparPorCuando, proximoItem, type AgendaItem } from './agrupar'
import { calcularConflictosDia } from './conflictos'
import { extraerHora, extraerRangoHora } from './extraccionFecha'
import type { AgendaEvento, AgendaBloque } from '@/types/agenda'

/**
 * Superficie pública del módulo Agenda. `agenda` ya existía reservado
 * como IdeaDestino y FurnitureId (ver work-table/destinoFurniture.ts)
 * desde antes de tener ruta propia. Mismo patrón que finance/public.ts:
 * la ruta importa AgendaScreen directo de su propio archivo en App.tsx —
 * acá solo se expone la identidad de navegación.
 *
 * Módulo Auditoría: nunca reimplementa detección de conflictos ni
 * parseo de rangos horarios — `calcularConflictosDia` y `extraerRangoHora`
 * se re-exportan tal cual (mismas funciones que ya usa AgendaScreen.tsx),
 * y `useAgendaSemana`/`crearBloqueDesdeCorreccion` son la única lectura y
 * la única escritura que Auditoría necesita de Agenda — nunca toca
 * `agendaBloqueRepository` ni `useAgenda` directo (ver
 * dependency-cruiser: Auditoría solo puede importar `public.ts` ajenos).
 */
export const MODULE = { path: '/agenda', label: 'Agenda' }
export { calcularConflictosDia, extraerRangoHora }

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface ProximoAgenda {
  id: string
  tipo: 'evento' | 'bloque' | 'mision'
  texto: string
  hora: string | null
  /** Sprint 015.1: solo se completa cuando el ítem está ocurriendo ahora mismo (ver `ahora` en useAgendaHoy) — "10:30–13:15" en vez de solo "10:30". */
  horaFin: string | null
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
 *
 * Sprint 015.1, punto 6: `ahora` y `proximo` se resuelven por separado
 * (antes un único `proximo` mezclaba los dos) — `ahora` es lo que está
 * pasando en este instante (`buckets.ahora[0]`), `proximo` es lo
 * siguiente que todavía no arrancó (`proximoItem`, que ya no mira
 * `buckets.ahora`). Home los muestra juntos solo cuando ambos existen.
 */
export function useAgendaHoy(): {
  ahora: ProximoAgenda | null
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
  /**
   * Sprint 015.2.1, punto 1: mismo fix que AgendaScreen.tsx — sin `ahora`
   * en las dependencias del memo, PRÓXIMO se congelaba en la hora en que
   * se montó Home y dejaba de reflejar el paso real del tiempo. Reloj
   * compartido, no un cálculo temporal nuevo (la clasificación sigue
   * siendo 100% de agrupar.ts).
   */
  const [momentoActual, setMomentoActual] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setMomentoActual(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  const buckets = useMemo(() => agruparPorCuando(itemsPendientes, momentoActual), [itemsPendientes, momentoActual])

  const hoy = hoyISO()
  const eventosHoy = useMemo(() => eventos.filter((evento) => evento.fecha === hoy && !evento.completado), [eventos, hoy])
  const bloquesHoy = useMemo(() => bloquesActivos.filter((bloque) => bloque.dia === hoy), [bloquesActivos, hoy])
  const misionesHoy = useMemo(() => misionesProgramadas.filter((mision) => mision.programadaFecha === hoy), [misionesProgramadas, hoy])
  const conflictosHoy = useMemo(() => calcularConflictosDia(eventosHoy, bloquesHoy), [eventosHoy, bloquesHoy])

  return useMemo(() => {
    if (!ready) {
      return {
        ahora: null,
        proximo: null,
        atencion: { conflictoTexto: null, hayEventoUrgente: false },
        resumen: RESUMEN_VACIO,
        ready: false,
      }
    }

    const aProximoAgenda = (item: AgendaItem | null): ProximoAgenda | null => {
      if (!item) return null
      const conflicto = item.tipo === 'evento' ? (conflictosHoy.conflictosPorEvento.get(item.id) ?? null) : null
      const rango = item.tipo === 'mision' ? null : extraerRangoHora(item.texto)
      return {
        id: item.id,
        tipo: item.tipo,
        texto: item.texto,
        hora: item.hora,
        horaFin: rango && rango.fin !== rango.inicio ? rango.fin : null,
        conflictoTexto: conflicto?.[0]?.texto ?? null,
        path: item.tipo === 'mision' ? '/misiones' : '/agenda',
      }
    }

    const ahora = aProximoAgenda(buckets.ahora[0] ?? null)
    const proximo = aProximoAgenda(proximoItem(buckets))

    const primerConflicto = [...conflictosHoy.conflictosPorEvento.values()][0]
    const conflictoTexto = primerConflicto?.[0]?.texto ?? null
    const hayEventoUrgente = [...buckets.ahora, ...buckets.atrasado, ...buckets.hoy, ...buckets.manana].some(
      (candidato) => candidato.tipo === 'evento' && candidato.item.prioridad === 'urgente',
    )

    const resumen: ResumenHoy = {
      totalActividades: eventosHoy.length + bloquesHoy.length + misionesHoy.length,
      hayCompromisoImportante: eventosHoy.some((evento) => evento.prioridad === 'importante'),
    }

    return { ahora, proximo, atencion: { conflictoTexto, hayEventoUrgente }, resumen, ready: true }
  }, [ready, buckets, conflictosHoy, eventosHoy, bloquesHoy, misionesHoy])
}

/**
 * Módulo Auditoría, §4/§5/§8: los eventos y bloques reales de una semana
 * (o de cualquier conjunto de días), sin filtrar archivados — a
 * diferencia de `useAgendaHoy` (que solo mira bloques activos porque su
 * consumidor es "qué pasa hoy"), Auditoría necesita ver también los
 * Bloques archivados para poder distinguir "omitido" de "desplazado" en
 * su vista analítica. Mismo `useAgenda()` de siempre, nunca un segundo
 * store ni una copia de eventos/bloques.
 */
export function useAgendaSemana(dias: readonly string[]): {
  eventos: AgendaEvento[]
  bloques: AgendaBloque[]
  ready: boolean
} {
  const { eventos, bloques, ready } = useAgenda()
  const diasSet = useMemo(() => new Set(dias), [dias])
  const eventosSemana = useMemo(() => eventos.filter((evento) => diasSet.has(evento.fecha)), [eventos, diasSet])
  const bloquesSemana = useMemo(() => bloques.filter((bloque) => diasSet.has(bloque.dia)), [bloques, diasSet])
  return { eventos: eventosSemana, bloques: bloquesSemana, ready }
}

/**
 * Módulo Auditoría, §14: "Aplicar a próxima semana" convierte la
 * corrección elegida en un Bloque real de Agenda — la única escritura
 * pública que Agenda expone hacia afuera, para que ningún otro módulo
 * toque `agendaBloqueRepository` directo. Nace protegido a propósito: una
 * corrección aplicada es, por definición, algo que el sistema decidió
 * proteger la próxima vez.
 */
export async function crearBloqueDesdeCorreccion(input: { texto: string; dia: string }): Promise<AgendaBloque> {
  const nuevo: NuevoAgendaBloque = { texto: input.texto, dia: input.dia, hora: extraerHora(input.texto), alarma: false }
  const creado = await agendaBloqueRepository.add(nuevo)
  return agendaBloqueRepository.update(creado.id, { protegido: true })
}
