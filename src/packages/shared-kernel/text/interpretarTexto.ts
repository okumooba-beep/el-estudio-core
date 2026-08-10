/**
 * Sprint 014 — "Captura Invisible": único parser de lenguaje natural
 * para fecha/hora/prioridad, compartido por Agenda y Misiones (antes
 * cada módulo tenía su propia copia casi idéntica —
 * modules/agenda/extraccionFecha.ts y modules/missions/extraccionFecha.ts,
 * ahora ambos son adaptadores finos sobre este archivo, cada uno con
 * su propia regla de qué hacer cuando no hay señal de fecha). Vive acá
 * porque ningún módulo puede importar el interior de otro
 * (dependency-cruiser, module-no-cross-module-import) y esto lo
 * necesitan dos módulos de contenido distintos.
 *
 * Nunca inventa: cada campo es `null` cuando el texto no trae una
 * señal reconocible — el llamador decide qué hacer con la ausencia.
 */

export type Prioridad = 'importante' | 'urgente'

export interface Interpretacion {
  fecha: string | null
  hora: string | null
  prioridad: Prioridad | null
  /** `texto` sin las palabras usadas únicamente para interpretar fecha/hora/prioridad. */
  textoLimpio: string
}

interface Span {
  start: number
  end: number
}

const DIA_A_INDICE: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
}

const MES_A_INDICE: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
}

/** Expresiones aproximadas (punto 1, "Expresiones simples"): solo se usan si no hay una hora explícita. */
const HORA_APROXIMADA: Record<string, string> = {
  temprano: '08:00',
  tarde: '17:00',
  noche: '21:00',
}

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

function sumarDias(fechaISO: string, dias: number): string {
  const base = new Date(`${fechaISO}T00:00:00.000Z`)
  base.setUTCDate(base.getUTCDate() + dias)
  return aISO(base)
}

/** El próximo día con ese nombre — dicho hoy mismo cuenta como hoy, recién escrito. */
function proximoDia(indiceObjetivo: number, hoyISO: string): string {
  const hoy = new Date(`${hoyISO}T00:00:00.000Z`)
  const diff = (indiceObjetivo - hoy.getUTCDay() + 7) % 7
  return sumarDias(hoyISO, diff)
}

function aHHMM(h: number, m = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Orden de especificidad: "pasado mañana" antes que "mañana" — si no,
 * "mañana" matchearía la segunda mitad y "pasado" quedaría suelto en
 * el título limpio.
 */
function extraerFechaSpan(normalizado: string, hoyISO: string): { fecha: string; span: Span } | null {
  const pasadoManana = normalizado.match(/\bpasado\s+manana\b/)
  if (pasadoManana) {
    return { fecha: sumarDias(hoyISO, 2), span: { start: pasadoManana.index!, end: pasadoManana.index! + pasadoManana[0].length } }
  }

  const manana = normalizado.match(/\bmanana\b/)
  if (manana) return { fecha: sumarDias(hoyISO, 1), span: { start: manana.index!, end: manana.index! + manana[0].length } }

  const hoy = normalizado.match(/\bhoy\b/)
  if (hoy) return { fecha: hoyISO, span: { start: hoy.index!, end: hoy.index! + hoy[0].length } }

  for (const [dia, indice] of Object.entries(DIA_A_INDICE)) {
    const m = normalizado.match(new RegExp(`\\b${dia}\\b`))
    if (m) return { fecha: proximoDia(indice, hoyISO), span: { start: m.index!, end: m.index! + m[0].length } }
  }

  const explicita = normalizado.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (explicita) {
    const dia = Number(explicita[1])
    const mes = Number(explicita[2])
    const anioBruto = explicita[3]
    const anio = anioBruto ? (anioBruto.length === 2 ? 2000 + Number(anioBruto) : Number(anioBruto)) : Number(hoyISO.slice(0, 4))
    const fecha = `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return { fecha, span: { start: explicita.index!, end: explicita.index! + explicita[0].length } }
  }

  const deMes = normalizado.match(
    /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/,
  )
  if (deMes) {
    const dia = Number(deMes[1])
    const mesIndice = MES_A_INDICE[deMes[2]!]!
    const anioActual = Number(hoyISO.slice(0, 4))
    let fecha = `${anioActual}-${String(mesIndice + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    // Un año que ya pasó no es lo que el usuario quiso decir — asume el próximo.
    if (fecha < hoyISO) fecha = `${anioActual + 1}-${String(mesIndice + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    return { fecha, span: { start: deMes.index!, end: deMes.index! + deMes[0].length } }
  }

  return null
}

function extraerHoraSpan(normalizado: string, fechaSpan: Span | null): { hora: string; span: Span } | null {
  const conMinutos = normalizado.match(/\b(\d{1,2})[:.](\d{2})\s?(?:hs?)?\b/)
  if (conMinutos) {
    const h = Number(conMinutos[1])
    const m = Number(conMinutos[2])
    if (h <= 23 && m <= 59) return { hora: aHHMM(h, m), span: { start: conMinutos.index!, end: conMinutos.index! + conMinutos[0].length } }
  }

  const ampm = normalizado.match(/\b(\d{1,2})\s?(am|pm)\b/)
  if (ampm) {
    let h = Number(ampm[1]) % 12
    if (ampm[2] === 'pm') h += 12
    return { hora: aHHMM(h), span: { start: ampm.index!, end: ampm.index! + ampm[0].length } }
  }

  const aLas = normalizado.match(/\ba las?\s?(\d{1,2})\b/)
  if (aLas) {
    const h = Number(aLas[1])
    if (h <= 23) return { hora: aHHMM(h), span: { start: aLas.index!, end: aLas.index! + aLas[0].length } }
  }

  const soloHs = normalizado.match(/\b(\d{1,2})\s?hs\b/)
  if (soloHs) {
    const h = Number(soloHs[1])
    if (h <= 23) return { hora: aHHMM(h), span: { start: soloHs.index!, end: soloHs.index! + soloHs[0].length } }
  }

  const mediodia = normalizado.match(/\bmediodia\b/)
  if (mediodia) return { hora: '12:00', span: { start: mediodia.index!, end: mediodia.index! + mediodia[0].length } }

  const medianoche = normalizado.match(/\bmedianoche\b/)
  if (medianoche) return { hora: '00:00', span: { start: medianoche.index!, end: medianoche.index! + medianoche[0].length } }

  for (const [palabra, hora] of Object.entries(HORA_APROXIMADA)) {
    const m = normalizado.match(new RegExp(`\\b${palabra}\\b`))
    if (m) return { hora, span: { start: m.index!, end: m.index! + m[0].length } }
  }

  /**
   * Número suelto pegado a una fecha ya reconocida ("viernes 9"): solo
   * cuenta como hora inmediatamente después de la fecha, nunca en
   * cualquier parte del texto — si no, "Comprar 2 kg" se convertiría
   * en las 02:00.
   */
  if (fechaSpan) {
    const resto = normalizado.slice(fechaSpan.end)
    const pegado = resto.match(/^\s+(\d{1,2})\b(?!\s*[/:.])/)
    if (pegado) {
      const h = Number(pegado[1])
      if (h <= 23) {
        const start = fechaSpan.end + pegado[0].indexOf(pegado[1]!)
        return { hora: aHHMM(h), span: { start, end: start + pegado[1]!.length } }
      }
    }
  }

  return null
}

function extraerPrioridadSpan(normalizado: string): { prioridad: Prioridad; span: Span } | null {
  const urgente = normalizado.match(/\burgente\b/)
  if (urgente) return { prioridad: 'urgente', span: { start: urgente.index!, end: urgente.index! + urgente[0].length } }

  const importante = normalizado.match(/\bimportante\b/)
  if (importante) return { prioridad: 'importante', span: { start: importante.index!, end: importante.index! + importante[0].length } }

  return null
}

function limpiar(texto: string, spans: readonly Span[]): string {
  if (spans.length === 0) return texto.trim()
  const ordenados = [...spans].sort((a, b) => a.start - b.start)
  let resultado = ''
  let cursor = 0
  for (const span of ordenados) {
    resultado += texto.slice(cursor, span.start)
    cursor = span.end
  }
  resultado += texto.slice(cursor)
  return resultado.replace(/\s{2,}/g, ' ').trim()
}

export function interpretar(texto: string, hoyISO: string = aISO(new Date())): Interpretacion {
  const normalizado = normalizar(texto)

  const fechaMatch = extraerFechaSpan(normalizado, hoyISO)
  const horaMatch = extraerHoraSpan(normalizado, fechaMatch?.span ?? null)
  const prioridadMatch = extraerPrioridadSpan(normalizado)

  const spans: Span[] = []
  if (fechaMatch) spans.push(fechaMatch.span)
  if (horaMatch) spans.push(horaMatch.span)
  if (prioridadMatch) spans.push(prioridadMatch.span)

  return {
    fecha: fechaMatch?.fecha ?? null,
    hora: horaMatch?.hora ?? null,
    prioridad: prioridadMatch?.prioridad ?? null,
    textoLimpio: limpiar(texto, spans),
  }
}

/** "Hoy"/"Mañana"/"Pasado mañana"/nombre del día — la etiqueta para la vista previa silenciosa (punto 3). */
export function etiquetaFecha(fechaISO: string, hoyISO: string = aISO(new Date())): string {
  if (fechaISO === hoyISO) return 'Hoy'
  if (fechaISO === sumarDias(hoyISO, 1)) return 'Mañana'
  if (fechaISO === sumarDias(hoyISO, 2)) return 'Pasado mañana'
  const fecha = new Date(`${fechaISO}T00:00:00.000Z`)
  const nombre = fecha.toLocaleDateString('es-AR', { weekday: 'long', timeZone: 'UTC' })
  return nombre.charAt(0).toUpperCase() + nombre.slice(1)
}
