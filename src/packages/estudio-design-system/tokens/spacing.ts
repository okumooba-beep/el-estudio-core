/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8):
 * grid de espaciado de 8pt, con un medio paso de 4px para ajustes finos.
 * Ninguna medida ad hoc existente en el CSS actual (features/*, index.css)
 * sigue todavía esta grilla — son deuda previa a este Design System, no
 * una fuente alternativa de valores (ver Deferred Architectural Debt).
 */

export interface SpacingTokens {
  readonly xs: string
  readonly sm: string
  readonly md: string
  readonly lg: string
  readonly xl: string
  readonly xxl: string
  readonly xxxl: string
}

export const spacing: SpacingTokens = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
}
