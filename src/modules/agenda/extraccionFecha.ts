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

import { interpretar, normalizar, type Prioridad } from '@shared-kernel/text/interpretarTexto'

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
 * Sprint 012, punto 3: rango [inicio, fin) para detectar solapamiento
 * Evento/Bloque. No es un campo nuevo del modelo — se recalcula al vuelo
 * desde el mismo texto libre, nunca se persiste. Sin un segundo número
 * ("a las 5", sin rango), el ítem es un punto: fin === inicio.
 */
export function extraerRangoHora(texto: string): { inicio: string; fin: string } | null {
  const normalizado = normalizar(texto)

  const rango = normalizado.match(/\b(\d{1,2})\s+a\s+(\d{1,2})\b/)
  if (rango) {
    const h1 = Number(rango[1])
    const h2 = Number(rango[2])
    if (h1 <= 23 && h2 <= 23) {
      return {
        inicio: `${String(h1).padStart(2, '0')}:00`,
        fin: `${String(h2).padStart(2, '0')}:00`,
      }
    }
  }

  const punto = extraerHora(texto)
  if (punto) return { inicio: punto, fin: punto }

  return null
}
