/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8).
 * Valores extraídos de src/index.css (:root), que ya declara estos mismos
 * tonos como "Design tokens" desde antes de que este paquete existiera —
 * acá quedan con nombre y tipo, todavía sin ningún consumidor.
 *
 * "Foco" y "deshabilitado" (semánticos pedidos por el sheet) no tenían
 * tono propio en el CSS existente: foco ya usa var(--accent) en
 * :focus-visible, y deshabilitado no tiene ninguna implementación en el
 * código hoy — ambos quedan acá como alias de un tono ya existente
 * (accent / inkFaint) en vez de inventar un color nuevo sin evidencia.
 */

export interface ColorTokens {
  readonly canvas: string
  readonly surface: string
  readonly surface2: string
  readonly border: string
  readonly ink: string
  readonly inkDim: string
  readonly inkFaint: string
  readonly accent: string
  readonly accentSoft: string
  readonly good: string
  readonly warn: string
  readonly critical: string
  readonly focus: string
  readonly disabled: string
}

export const colors: ColorTokens = {
  canvas: '#120F0C',
  surface: '#1B1612',
  surface2: '#241D17',
  border: '#2E261F',
  ink: '#EDE5DA',
  inkDim: '#B0A395',
  inkFaint: '#8A7F70',
  accent: '#D8A24A',
  accentSoft: 'rgba(216, 162, 74, 0.12)',
  good: '#6FAE85',
  warn: '#C99A55',
  critical: '#C97A73',
  focus: '#D8A24A',
  disabled: '#8A7F70',
}
