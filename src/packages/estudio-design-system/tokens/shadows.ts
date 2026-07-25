/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8).
 * Extraído de las recetas de box-shadow ya repetidas en src/index.css:
 * - `surface`: la receta compartida por .tablero y .mesa-analisis (dos
 *   muebles independientes con el mismo valor exacto — evidencia de que
 *   ya es un patrón, no una coincidencia).
 * - `surfaceElevated`: la receta más elaborada de .workspace, el mueble
 *   más cercano al ojo de la habitación.
 * - `contact`: la sombra de contacto compartida por .idea-hoja y
 *   .expediente (una hoja apoyada, nunca una tarjeta flotando).
 */

export interface ShadowTokens {
  readonly surface: string
  readonly surfaceElevated: string
  readonly contact: string
}

export const shadows: ShadowTokens = {
  surface:
    'inset 0 0 0 1px rgba(0, 0, 0, 0.3), inset 0 40px 60px -46px rgba(0, 0, 0, 0.6), 0 24px 44px -34px rgba(0, 0, 0, 0.55)',
  surfaceElevated:
    'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 34px 46px -34px rgba(0, 0, 0, 0.12), inset 0 -10px 16px -12px rgba(0, 0, 0, 0.3), 0 28px 56px -30px rgba(0, 0, 0, 0.32)',
  contact: '0 8px 14px -12px rgba(0, 0, 0, 0.5)',
}
