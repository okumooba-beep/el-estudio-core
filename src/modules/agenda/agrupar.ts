import { extraerRangoHora } from './extraccionFecha'
import type { AgendaEvento, AgendaBloque } from '@/types/agenda'
import type { Idea } from '@/types/idea'

/**
 * Vista diaria (spec): "Ahora, Hoy, Mañana, Esta semana", sin archivado
 * automático — un ítem vencido nunca desaparece hasta que el usuario lo
 * completa o archiva a mano; agrupar nunca lo saca de la lista.
 *
 * Eventos y Bloques comparten las cuatro secciones (los dos responden
 * "qué pasa y cuándo"). Sprint 010, punto 7: un Bloque ahora también
 * trae su propia `hora` (extraída del texto libre, ver
 * extraccionFecha.ts) — sin hora, se queda al final de "Hoy" mientras
 * dure el día, igual que antes.
 *
 * Sprint 015.1, punto 7: "Ahora" pasa a significar literalmente eso —
 * un Bloque o Evento cuyo rango [inicio, fin] contiene la hora actual
 * (`ocurreAhora`, reutilizando `extraerRangoHora` que ya usa
 * conflictos.ts, nunca un motor temporal nuevo). Antes, cualquier ítem
 * de hoy con `hora <= horaActual` caía en "Ahora" sin mirar si ya había
 * terminado, y cualquier ítem vencido de un día anterior caía ahí
 * también sin condición — de ahí el bug de auditoría (11:52 mostrando
 * Meditación 07:30, Gimnasio 08:30, etc. como si estuvieran pasando).
 * Lo vencido (fecha pasada, o de hoy pero ya terminado) ahora cae en el
 * bucket separado `atrasado`: sigue visible y accionable, pero deja de
 * mentir diciendo que está "ocurriendo ahora". Una Misión nunca tiene
 * duración, así que nunca es "Ahora" — a lo sumo está en `hoy` o
 * `atrasado`.
 */
export type AgendaItem =
  | { tipo: 'evento'; id: string; texto: string; fecha: string; hora: string | null; completado: boolean; item: AgendaEvento }
  | { tipo: 'bloque'; id: string; texto: string; fecha: string; hora: string | null; completado: boolean; item: AgendaBloque }
  | { tipo: 'mision'; id: string; texto: string; fecha: string; hora: string | null; completado: boolean; item: Idea }

/**
 * Sprint 013: `misiones` son Ideas (destino='misiones') con
 * `programadaFecha` — Agenda las lee directo del mismo store
 * compartido de Misiones (useIdeas), nunca las copia a otra tabla.
 * `completado` es siempre `false` acá porque el propio filtro de
 * `programadaFecha` en el llamador ya excluye las archivadas.
 */
export function aItems(
  eventos: readonly AgendaEvento[],
  bloques: readonly AgendaBloque[],
  misiones: readonly Idea[] = [],
): AgendaItem[] {
  const deEventos: AgendaItem[] = eventos.map((evento) => ({
    tipo: 'evento',
    id: evento.id,
    texto: evento.texto,
    fecha: evento.fecha,
    hora: evento.hora,
    completado: evento.completado,
    item: evento,
  }))
  const deBloques: AgendaItem[] = bloques.map((bloque) => ({
    tipo: 'bloque',
    id: bloque.id,
    texto: bloque.texto,
    fecha: bloque.dia,
    hora: bloque.hora,
    completado: bloque.completado,
    item: bloque,
  }))
  const deMisiones: AgendaItem[] = misiones.map((mision) => ({
    tipo: 'mision',
    id: mision.id,
    texto: mision.texto,
    fecha: mision.programadaFecha!,
    hora: mision.programadaHora ?? null,
    completado: false,
    item: mision,
  }))
  return [...deEventos, ...deBloques, ...deMisiones]
}

export interface Buckets {
  ahora: AgendaItem[]
  /** Sprint 015.1: fecha pasada, o de hoy con la hora ya pasada y sin estar ocurriendo — nunca "Ahora". */
  atrasado: AgendaItem[]
  hoy: AgendaItem[]
  manana: AgendaItem[]
  estaSemana: AgendaItem[]
}

/** Un Bloque/Evento está pasando en este instante si `horaActual` cae dentro de su [inicio, fin]. Una Misión no tiene duración: nunca "ocurre". */
function ocurreAhora(item: AgendaItem, horaActual: string): boolean {
  if (item.tipo === 'mision') return false
  const rango = extraerRangoHora(item.texto)
  return rango !== null && rango.inicio <= horaActual && horaActual <= rango.fin
}

export function agruparPorCuando(items: readonly AgendaItem[], ahora: Date = new Date()): Buckets {
  const hoyISO = ahora.toISOString().slice(0, 10)
  const mananaISO = sumarDias(hoyISO, 1)
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`

  const buckets: Buckets = { ahora: [], atrasado: [], hoy: [], manana: [], estaSemana: [] }

  for (const item of items) {
    const esHoy = item.fecha === hoyISO
    if (esHoy && ocurreAhora(item, horaActual)) {
      buckets.ahora.push(item)
    } else if (item.fecha < hoyISO || (esHoy && item.hora !== null && item.hora <= horaActual)) {
      buckets.atrasado.push(item)
    } else if (esHoy) {
      buckets.hoy.push(item)
    } else if (item.fecha === mananaISO) {
      buckets.manana.push(item)
    } else {
      buckets.estaSemana.push(item)
    }
  }

  const porCuando = (a: AgendaItem, b: AgendaItem) =>
    a.fecha === b.fecha ? (a.hora ?? '').localeCompare(b.hora ?? '') : a.fecha.localeCompare(b.fecha)
  buckets.ahora.sort(porCuando)
  buckets.atrasado.sort(porCuando)
  buckets.hoy.sort(porCuando)
  buckets.estaSemana.sort(porCuando)

  return buckets
}

function sumarDias(fechaISO: string, dias: number): string {
  const base = new Date(`${fechaISO}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/**
 * Sprint 015 ("Home como eje del día"): el primer ítem que todavía no
 * pasó, mismo orden que ya usan las secciones de la vista diaria (Hoy →
 * Mañana → Esta semana) — Home lo reusa para "PRÓXIMO" sin inventar un
 * criterio de orden propio.
 *
 * Sprint 015.1, punto 6: deja de incluir `buckets.ahora` — lo que está
 * ocurriendo ahora mismo ya no es "lo próximo", es "lo presente". Home
 * pide los dos por separado (`buckets.ahora[0]` y este) para poder
 * mostrar "AHORA" y "PRÓXIMO" a la vez cuando corresponde.
 */
export function proximoItem(buckets: Buckets): AgendaItem | null {
  return buckets.hoy[0] ?? buckets.manana[0] ?? buckets.estaSemana[0] ?? null
}

/**
 * La semana calendario (lunes a domingo) que contiene `hoy` — el lienzo
 * de Planificación semanal. Es la semana real, no "los próximos 7
 * días": un domingo mira hacia atrás a su lunes, no hacia adelante.
 *
 * Sprint 011, punto 1: `desplazamientoSemanas` mueve el lienzo entera
 * semanas hacia atrás/adelante (un domingo puede planificar la semana
 * que arranca mañana) — sigue siendo la semana real que contiene esa
 * fecha desplazada, nunca "los próximos 7 días" desde ahí.
 */
export function semanaCalendario(
  hoyISO: string = new Date().toISOString().slice(0, 10),
  desplazamientoSemanas = 0,
): string[] {
  const base = desplazamientoSemanas === 0 ? hoyISO : sumarDias(hoyISO, desplazamientoSemanas * 7)
  const hoy = new Date(`${base}T00:00:00.000Z`)
  // getUTCDay(): domingo=0 … sábado=6. Distancia hasta el lunes de esta semana.
  const diaSemana = hoy.getUTCDay()
  const distanciaALunes = diaSemana === 0 ? 6 : diaSemana - 1
  const lunesISO = sumarDias(base, -distanciaALunes)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunesISO, i))
}
