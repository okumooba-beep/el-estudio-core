import type { AgendaEvento, AgendaBloque } from '@/types/agenda'

/**
 * Vista diaria (spec): "Ahora, Hoy, Mañana, Esta semana", sin archivado
 * automático — un ítem vencido sigue en "Ahora" hasta que el usuario lo
 * completa o archiva a mano; agrupar nunca lo saca de la lista.
 *
 * Eventos y Bloques comparten las cuatro secciones (los dos responden
 * "qué pasa y cuándo"). Un Bloque no tiene hora propia — nace como
 * texto libre ubicado en un día, nunca en un horario— así que sin hora
 * que comparar se queda en "Hoy" mientras dure el día.
 */
export type AgendaItem =
  | { tipo: 'evento'; id: string; texto: string; fecha: string; hora: string | null; completado: boolean; item: AgendaEvento }
  | { tipo: 'bloque'; id: string; texto: string; fecha: string; hora: null; completado: boolean; item: AgendaBloque }

export function aItems(eventos: readonly AgendaEvento[], bloques: readonly AgendaBloque[]): AgendaItem[] {
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
    hora: null,
    completado: bloque.completado,
    item: bloque,
  }))
  return [...deEventos, ...deBloques]
}

export interface Buckets {
  ahora: AgendaItem[]
  hoy: AgendaItem[]
  manana: AgendaItem[]
  estaSemana: AgendaItem[]
}

export function agruparPorCuando(items: readonly AgendaItem[], ahora: Date = new Date()): Buckets {
  const hoyISO = ahora.toISOString().slice(0, 10)
  const mananaISO = sumarDias(hoyISO, 1)
  const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`

  const buckets: Buckets = { ahora: [], hoy: [], manana: [], estaSemana: [] }

  for (const item of items) {
    if (item.fecha < hoyISO || (item.fecha === hoyISO && item.hora !== null && item.hora <= horaActual)) {
      buckets.ahora.push(item)
    } else if (item.fecha === hoyISO) {
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
 * La semana calendario (lunes a domingo) que contiene `hoy` — el lienzo
 * de Planificación semanal. Es la semana real, no "los próximos 7
 * días": un domingo mira hacia atrás a su lunes, no hacia adelante.
 */
export function semanaCalendario(hoyISO: string = new Date().toISOString().slice(0, 10)): string[] {
  const hoy = new Date(`${hoyISO}T00:00:00.000Z`)
  // getUTCDay(): domingo=0 … sábado=6. Distancia hasta el lunes de esta semana.
  const diaSemana = hoy.getUTCDay()
  const distanciaALunes = diaSemana === 0 ? 6 : diaSemana - 1
  const lunesISO = sumarDias(hoyISO, -distanciaALunes)
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunesISO, i))
}
