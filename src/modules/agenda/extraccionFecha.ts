/**
 * Extrae CUÁNDO ocurre un Evento a partir del texto libre del Umbral —
 * la contraparte temporal de finance/extraccion.ts (ahí se extrae un
 * monto, acá una fecha/hora). Nunca inventa una hora: si el texto no
 * trae una, `hora` queda en null.
 *
 * Sprint 014: el reconocimiento de fecha/hora/prioridad vive ahora en
 * @shared-kernel/text/interpretarTexto (compartido con Misiones) — este
 * archivo es un adaptador fino que agrega solo lo específico de Agenda:
 * el rango suelto "3 a 4" (heredado de Sprint 010 para Bloques) y el
 * default a "hoy" cuando no hay fecha.
 */

import { interpretar, normalizar, aHora24, type Prioridad } from '@shared-kernel/text/interpretarTexto'

function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** YYYY-MM-DD. Sin fecha explícita en el texto ("a las 5"), el día es hoy. */
export function extraerFecha(texto: string, hoyISO: string = aISO(new Date())): string {
  return interpretar(texto, hoyISO).fecha ?? hoyISO
}

/**
 * HH:MM, o null si el texto no trae una hora concreta. Además de lo que
 * reconoce el parser compartido, acepta el rango suelto "3 a 4" (sin "a
 * las") como punto de inicio — Sprint 010, para Bloques tipo "Gimnasio 7
 * a 8", también válido para Eventos.
 */
export function extraerHora(texto: string): string | null {
  const compartida = interpretar(texto).hora
  if (compartida) return compartida

  const normalizado = normalizar(texto)
  const rango = normalizado.match(/\b(\d{1,2})\s+a\s+(\d{1,2})\b/)
  if (rango) {
    const h = Number(rango[1])
    if (h <= 23) return `${String(h).padStart(2, '0')}:00`
  }

  return null
}

/** Evento completo desde el texto libre del Umbral: fecha, hora, prioridad y el título ya limpio. */
export function interpretarEvento(
  texto: string,
  hoyISO: string = aISO(new Date()),
): { fecha: string; hora: string | null; prioridad: Prioridad | null; textoLimpio: string } {
  const resultado = interpretar(texto, hoyISO)
  return {
    fecha: resultado.fecha ?? hoyISO,
    hora: extraerHora(texto),
    prioridad: resultado.prioridad,
    textoLimpio: resultado.textoLimpio,
  }
}

/**
 * "7", "07:30" → "HH:MM"; null si no es una hora válida (0-23, 0-59).
 * Sprint 015.3, punto 7: `meridiano` opcional ("am"/"pm", detectado por
 * `extraerRangoHora` junto al número) convierte de 12h a 24h — sin él,
 * se mantiene la convención existente (número tal cual).
 */
function normalizarHora(token: string | undefined, meridiano?: 'am' | 'pm'): string | null {
  const match = token?.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (!match) return null
  const horas = Number(match[1])
  const minutos = match[2] ? Number(match[2]) : 0
  if (minutos > 59) return null
  if (meridiano) {
    if (horas < 1 || horas > 12) return null
    return `${String(aHora24(horas, meridiano)).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
  }
  if (horas > 23) return null
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

/**
 * Sprint 012, punto 3: rango [inicio, fin) para detectar solapamiento
 * Evento/Bloque. No es un campo nuevo del modelo — se recalcula al vuelo
 * desde el mismo texto libre, nunca se persiste. Sin un segundo número
 * ("a las 5", sin rango), el ítem es un punto: fin === inicio.
 *
 * Sprint 015.2, punto 3: el rango suelto también acepta minutos en
 * cualquiera de los dos lados ("10:30 a 13:15", no solo "10 a 13") — antes
 * el regex bare-hour no reconocía el minuto y el rango caía a "punto" en
 * el inicio, haciendo que un Bloque con hora de fin real pareciera
 * terminado apenas empezaba. Mismo mecanismo, no un motor temporal nuevo.
 *
 * Sprint 015.3, punto 7: cada lado del rango también acepta un AM/PM
 * propio ("10 AM a 1 PM", "7:30 AM a 8 AM") — cada número se convierte a
 * 24h con el suyo, nunca se infiere el del otro lado.
 */
export function extraerRangoHora(texto: string): { inicio: string; fin: string } | null {
  const normalizado = normalizar(texto)

  const rango = normalizado.match(
    /\b(\d{1,2}(?::\d{2})?)\s?(am|pm)?\s+a\s+(\d{1,2}(?::\d{2})?)\s?(am|pm)?\b/,
  )
  if (rango) {
    const inicio = normalizarHora(rango[1], rango[2] as 'am' | 'pm' | undefined)
    const fin = normalizarHora(rango[3], rango[4] as 'am' | 'pm' | undefined)
    if (inicio && fin) return { inicio, fin }
  }

  const punto = extraerHora(texto)
  if (punto) return { inicio: punto, fin: punto }

  return null
}
