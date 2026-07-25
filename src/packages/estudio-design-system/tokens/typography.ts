/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8):
 * Recoleta para display, Söhne Semibold para títulos, Inter para
 * cuerpo/secundario, Inter Medium para metadata, IBM Plex Mono para
 * código/datos. Ninguna de estas tipografías está instalada ni cargada
 * hoy (src/index.css usa una pila de fuentes de sistema, --font-sans/
 * --font-mono) — ese @font-face queda fuera de alcance de este sprint,
 * que es aditivo y todavía sin consumidores. La pila de sistema de
 * index.css se reutiliza acá como fallback, para que un futuro consumidor
 * nunca dependa de una fuente sin cargar.
 */

const SYSTEM_SANS_FALLBACK = '-apple-system, "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif'
const SYSTEM_MONO_FALLBACK = 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", "SF Mono", Consolas, monospace'

export interface TypographyTokens {
  readonly display: string
  readonly heading: string
  readonly body: string
  readonly secondary: string
  readonly metadata: string
  readonly code: string
}

export const typography: TypographyTokens = {
  display: `Recoleta, ${SYSTEM_SANS_FALLBACK}`,
  heading: `"Söhne Semibold", ${SYSTEM_SANS_FALLBACK}`,
  body: `Inter, ${SYSTEM_SANS_FALLBACK}`,
  secondary: `Inter, ${SYSTEM_SANS_FALLBACK}`,
  metadata: `"Inter Medium", ${SYSTEM_SANS_FALLBACK}`,
  code: `"IBM Plex Mono", ${SYSTEM_MONO_FALLBACK}`,
}
