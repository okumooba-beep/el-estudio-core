/**
 * Sprint 013, punto 4: extrae CUÁNDO se programa una Misión a partir del
 * texto libre de "+ Nueva misión".
 *
 * Sprint 014: el reconocimiento en sí (fecha/hora, texto limpio) vive
 * ahora en @shared-kernel/text/interpretarTexto (compartido con
 * Agenda) — este archivo solo aplica la regla propia de Misiones.
 *
 * Diferencia clave con Agenda: ahí "sin fecha explícita" cae en HOY
 * porque un Evento siempre necesita alguna fecha. Acá una Misión sin
 * señal de fecha queda SIN programar (null) — el parser compartido ya
 * nunca inventa una fecha, así que alcanza con pasar el resultado tal
 * cual.
 */

import { interpretar } from '@shared-kernel/text/interpretarTexto'

export interface MisionInterpretada {
  fecha: string | null
  hora: string | null
  textoLimpio: string
}

export function interpretarMision(texto: string): MisionInterpretada {
  const { fecha, hora, textoLimpio } = interpretar(texto)
  return { fecha, hora, textoLimpio }
}
