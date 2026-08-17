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
 * conflictos.ts, nunca un motor temporal nuevo). Una Misión nunca tiene
 * duración, así que nunca es "Ahora".
 *
 * Sprint 015.2, punto 4: "Atrasado" deja de significar "cualquier cosa
 * vencida" y pasa a significar "vencido y que todavía requiere acción".
 * Un Bloque terminado (pasó su hora de fin) es historial, no pendiente:
 * sale de la agenda operativa sin pasar por `atrasado` (los datos siguen
 * en el store, `agrupar` solo deja de listarlo). Una Misión sin hora
 * tampoco — sigue perteneciendo únicamente a Misiones. Un Evento, o una
 * Misión que sí tiene hora, siguen cayendo en `atrasado` mientras estén
 * pendientes: a diferencia de un Bloque, todavía necesitan que alguien
 * haga algo con ellos. Antes, un Bloque de una semana pasada (p. ej.
 * copiado con "copiar al resto de la semana") se acumulaba en `atrasado`
 * para siempre, y como esa lista se mostraba completa en la vista
 * diaria, el mismo trío de Bloques (uno por cada día ya pasado)
 * aparecía repetido — de ahí el bug visible de "Meditación/Gimnasio/
 * Trading" duplicado varias veces. Dejar de listar Bloques terminados
 * en `atrasado` es la causa raíz, no una capa nueva de deduplicación.
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
  /** Sprint 015.2: vencido y que TODAVÍA requiere acción — nunca un Bloque terminado ni una Misión sin hora (ver comentario de arriba). */
  atrasado: AgendaItem[]
  hoy: AgendaItem[]
  manana: AgendaItem[]
  estaSemana: AgendaItem[]
}

/**
 * El rango [inicio, fin] de un ítem. Solo Bloque conserva texto libre
 * crudo (nunca pasa por el Umbral) donde `extraerRangoHora` puede
 * encontrar un rango real ("Gimnasio 7 a 8"). Evento guarda en
 * `item.texto` el `textoLimpio` (Sprint 012: AgendaScreen.tsx ya le
 * saca la frase de hora al crearlo) — reparsear ese texto para un
 * rango es indetectable o directamente engañoso, así que un Evento es
 * siempre un punto desde su propio `item.hora`, igual que una Misión
 * (que tampoco tiene hora embebida en su texto: vive en
 * `programadaHora`). Ninguno de los dos tiene duración real en el
 * modelo de datos. Sin hora: sin rango.
 */
function rangoDe(item: AgendaItem): { inicio: string; fin: string } | null {
  if (item.tipo === 'bloque') return extraerRangoHora(item.texto)
  return item.hora !== null ? { inicio: item.hora, fin: item.hora } : null
}

/**
 * Sprint 015.2, punto 2: `<` estricto en el fin — a la hora exacta de
 * cierre el ítem ya terminó, no sigue "ocurriendo". Un punto (Evento u
 * Misión sin rango real, inicio === fin) nunca satisface `horaActual <
 * fin`, así que nunca es "Ahora" — pasa directo de futuro a terminado.
 * Una Misión nunca tiene duración: nunca "ocurre".
 */
function ocurreAhora(item: AgendaItem, horaActual: string): boolean {
  if (item.tipo === 'mision') return false
  const rango = rangoDe(item)
  return rango !== null && rango.inicio <= horaActual && horaActual < rango.fin
}

/** Ya pasó su hora de fin (o su único punto, para Eventos/Misiones sin rango real). Sin hora: nunca "terminado" por tiempo. */
function yaTermino(item: AgendaItem, horaActual: string): boolean {
  const rango = rangoDe(item)
  return rango !== null && horaActual >= rango.fin
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
      continue
    }

    const vencido = item.fecha < hoyISO || (esHoy && yaTermino(item, horaActual))
    if (vencido) {
      // Bloque terminado: historial, no pendiente — deja de listarse acá
      // (sigue existiendo en el store). Misión sin hora: nunca "vencida",
      // sigue perteneciendo solo a Misiones. Evento, o Misión con hora:
      // siguen necesitando acción → Atrasado.
      if (item.tipo === 'bloque') continue
      if (item.tipo === 'mision' && item.hora === null) continue
      buckets.atrasado.push(item)
      continue
    }

    if (esHoy) {
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
 *
 * Sprint 015.2, punto 3: descarta ítems sin hora — no se pueden ordenar
 * temporalmente, así que nunca pueden ser "lo siguiente" (p. ej. una
 * Misión programada para hoy sin hora: sigue en `hoy`, pero jamás debe
 * salir elegida como Próximo).
 *
 * Sprint 017: ya no cae en `estaSemana`. Ese bucket es un catch-all sin
 * límite real de semana (ver `semanaCalendario` más abajo, que sí lo
 * calcula pero no se usa para acotarlo), así que dejarlo en la cadena
 * podía convertir un ítem de dentro de varios días en el "Próximo" de
 * hoy — justo lo que el brief prohíbe. Si no hay nada con hora hoy ni
 * mañana, no hay Próximo: null.
 */
export function proximoItem(buckets: Buckets): AgendaItem | null {
  const conHora = (item: AgendaItem) => item.hora !== null
  return buckets.hoy.find(conHora) ?? buckets.manana.find(conHora) ?? null
}

/**
 * Sprint 023 ("Agenda: separar Hoy de compromisos futuros"): el
 * siguiente compromiso más allá de hoy/mañana — mismo bucket que ya
 * arma `agruparPorCuando` (`estaSemana`, ya ordenado por fecha/hora),
 * nunca un cálculo temporal nuevo. Nunca reemplaza a `proximoItem()`:
 * esa sigue siendo la única fuente de "Próximo" (hoy/mañana); esto es
 * información adicional sobre lo que viene después, para que un
 * compromiso lejano (p. ej. "24 de agosto" visto un 17) tenga una
 * forma clara de asomar sin mezclarse con la agenda de hoy.
 */
export function proximoCompromisoFuturo(buckets: Buckets): AgendaItem | null {
  return buckets.estaSemana[0] ?? null
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
