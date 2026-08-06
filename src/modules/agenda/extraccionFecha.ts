/**
 * Extrae CUÁNDO ocurre un Evento a partir del texto libre del Umbral —
 * la contraparte temporal de finance/extraccion.ts (ahí se extrae un
 * monto, acá una fecha/hora). Nunca inventa una hora: si el texto no
 * trae una, `hora` queda en null.
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

/**
 * El próximo día con ese nombre. "Lunes" dicho un lunes es hoy —recién
 * escrito, todavía no pasó—; cualquier otro día de la semana avanza al
 * próximo que tenga ese nombre.
 */
function proximoDia(indiceObjetivo: number, hoyISO: string): string {
  const hoy = new Date(`${hoyISO}T00:00:00.000Z`)
  const diff = (indiceObjetivo - hoy.getUTCDay() + 7) % 7
  return sumarDias(hoyISO, diff)
}

/** YYYY-MM-DD. Sin fecha explícita en el texto ("a las 5"), el día es hoy. */
export function extraerFecha(texto: string, hoyISO: string = aISO(new Date())): string {
  const normalizado = normalizar(texto)

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

  return hoyISO
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

  return null
}
