/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8).
 * Extraído de src/index.css (:root --radius-sm/md/lg): cuatro valores por
 * radio, nunca uno solo, para que ninguna esquina sea perfectamente
 * circular (ver comentario original en index.css).
 */

export interface RadiusTokens {
  readonly sm: string
  readonly md: string
  readonly lg: string
}

export const radius: RadiusTokens = {
  sm: '7px 9px 8px 9px',
  md: '12px 16px 13px 15px',
  lg: '19px 25px 20px 24px',
}
