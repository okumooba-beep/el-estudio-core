/**
 * Sprint 013, punto 4: extrae CUÁNDO se programa una Misión a partir del
 * texto libre de "+ Nueva misión" — misma idea que
 * modules/agenda/extraccionFecha.ts (que a su vez ya es "la contraparte
 * temporal de finance/extraccion.ts"), pero un archivo propio: un módulo
 * nunca importa el interior de otro (dependency-cruiser,
 * module-no-cross-module-import), y Misiones necesita esta lógica sin
 * depender de Agenda.
 *
 * Diferencia clave con la versión de Agenda: ahí "sin fecha explícita"
 * cae en HOY porque un Evento siempre necesita alguna fecha. Acá una
 * Misión sin señal de fecha debe quedar SIN programar (null), no en
 * hoy por defecto — de lo contrario toda Misión aparecería en Agenda.
 */

const DIA_A_INDICE: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
}

function normalizar(texto: string): string {
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

function proximoDia(indiceObjetivo: number, hoyISO: string): string {
  const hoy = new Date(`${hoyISO}T00:00:00.000Z`)
  const diff = (indiceObjetivo - hoy.getUTCDay() + 7) % 7
  return sumarDias(hoyISO, diff)
}

/** YYYY-MM-DD, o null si el texto no trae ninguna señal de fecha — una Misión sin señal queda sin programar. */
export function extraerFecha(texto: string, hoyISO: string = aISO(new Date())): string | null {
  const normalizado = normalizar(texto)

  if (/\bhoy\b/.test(normalizado)) return hoyISO
  if (/\bmanana\b/.test(normalizado)) return sumarDias(hoyISO, 1)

  for (const [dia, indice] of Object.entries(DIA_A_INDICE)) {
    if (new RegExp(`\\b${dia}\\b`).test(normalizado)) return proximoDia(indice, hoyISO)
  }

  const fechaExplicita = texto.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (fechaExplicita) {
    const dia = Number(fechaExplicita[1])
    const mes = Number(fechaExplicita[2])
    const anioBruto = fechaExplicita[3]
    const anio = anioBruto
      ? anioBruto.length === 2
        ? 2000 + Number(anioBruto)
        : Number(anioBruto)
      : Number(hoyISO.slice(0, 4))
    return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  return null
}

/** HH:MM, o null si el texto no trae una hora concreta. */
export function extraerHora(texto: string): string | null {
  const normalizado = normalizar(texto)

  const conMinutos = texto.match(/\b(\d{1,2})[:.](\d{2})\s?(?:hs?)?\b/i)
  if (conMinutos) {
    const h = Number(conMinutos[1])
    const m = Number(conMinutos[2])
    if (h <= 23 && m <= 59) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const ampm = normalizado.match(/\b(\d{1,2})\s?(am|pm)\b/)
  if (ampm) {
    let h = Number(ampm[1]) % 12
    if (ampm[2] === 'pm') h += 12
    return `${String(h).padStart(2, '0')}:00`
  }

  const aLas = normalizado.match(/\ba las?\s?(\d{1,2})\b/)
  if (aLas) {
    const h = Number(aLas[1])
    if (h <= 23) return `${String(h).padStart(2, '0')}:00`
  }

  /** "Enviar presupuesto hoy 18 hs urgente": hora suelta con "hs", sin minutos ni rango. */
  const soloHs = normalizado.match(/\b(\d{1,2})\s?hs\b/)
  if (soloHs) {
    const h = Number(soloHs[1])
    if (h <= 23) return `${String(h).padStart(2, '0')}:00`
  }

  return null
}
