/**
 * "Gastos fijos mensuales" — auto-detección: a diferencia de
 * `contienePalabra` (extraccion.ts), acá la coincidencia debe ignorar
 * tildes además de mayúsculas ("alquiler" tiene que matchear "Alquiler"
 * y "ALQUILER", pero también un concepto tipeado sin tilde como
 * "telefono" tiene que matchear la palabra clave "teléfono"). Módulo
 * propio en vez de tocar extraccion.ts: ese matcher es case-insensitive
 * pero deliberadamente sensible a tildes (ver su comentario), así que
 * ampliarlo ahí rompería su contrato actual.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

/** Misma coincidencia de palabra completa que `contienePalabra`, pero sobre texto normalizado (sin tildes, en minúsculas). */
export function contienePalabraClave(texto: string, palabraClave: string): boolean {
  const clave = normalizar(palabraClave.trim())
  if (!clave) return false
  const escapada = clave.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patron = new RegExp(`(?<![\\p{L}\\p{N}])${escapada}(?![\\p{L}\\p{N}])`, 'u')
  return patron.test(normalizar(texto))
}
