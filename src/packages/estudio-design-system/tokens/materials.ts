/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8).
 *
 * El sheet nombra cuatro materiales primarios: madera, concreto, cuero,
 * papel. La biblioteca de materiales ya implementada (Sprint 2.4, ver
 * src/packages/world/studio/materials.ts y las clases .material-* en
 * src/index.css) construyó cinco: papel, corcho, madera, metal, cuero —
 * concreto nunca se implementó, y corcho/metal no están nombrados por el
 * sheet como "primarios". Este archivo extrae los cinco ya reales y
 * aprobados a través de sprints anteriores (evidencia concreta) y
 * deliberadamente NO inventa un token `concrete` sin ningún valor de
 * referencia — mismo criterio que ya usa materials.ts: "mejor un hueco
 * documentado que una mentira prolija" (ver Architectural Deviations).
 *
 * Cada valor es el `background` exacto de su clase .material-* — el
 * brillo/ruido de `::after` (feTurbulence) queda fuera: es textura
 * generada, no un token de diseño estático.
 */

export interface MaterialTokens {
  readonly paper: string
  readonly cork: string
  readonly wood: string
  readonly metal: string
  readonly leather: string
}

export const materials: MaterialTokens = {
  paper:
    'radial-gradient(38% 30% at 22% 18%, rgba(255, 255, 255, 0.5), transparent 65%), radial-gradient(30% 26% at 78% 84%, rgba(0, 0, 0, 0.05), transparent 65%), linear-gradient(155deg, rgba(255, 255, 255, 0.3), transparent 60%), #e5d9c0',
  cork:
    'radial-gradient(55% 45% at 18% 12%, rgba(255, 228, 190, 0.05), transparent 62%), radial-gradient(48% 42% at 82% 78%, rgba(0, 0, 0, 0.2), transparent 65%), radial-gradient(38% 32% at 68% 8%, rgba(255, 228, 190, 0.04), transparent 60%), radial-gradient(30% 40% at 8% 82%, rgba(0, 0, 0, 0.14), transparent 60%), linear-gradient(155deg, #4c3b28 0%, #3d3020 55%, #332818 100%)',
  wood:
    'repeating-linear-gradient(92deg, rgba(0, 0, 0, 0.05) 0px, rgba(0, 0, 0, 0.05) 1px, transparent 3px, transparent 9px), radial-gradient(70% 55% at 30% 20%, rgba(255, 224, 180, 0.05), transparent 65%), linear-gradient(100deg, #5a4430 0%, #4a3826 50%, #3c2e1f 100%)',
  metal:
    'linear-gradient(115deg, rgba(255, 255, 255, 0.75) 0%, transparent 32%), radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.55), transparent 45%), linear-gradient(155deg, #c7cbd1 0%, #9a9fa7 45%, #55595f 100%)',
  leather:
    'radial-gradient(6px 4px at 64% 26%, rgba(0, 0, 0, 0.16), transparent 75%), linear-gradient(158deg, #5c4634 0%, #46362a 45%, #2c2119 100%)',
}

/** Tonos de tinta propios del papel (única superficie clara de la biblioteca — ver .material-paper en index.css). */
export interface PaperInkTokens {
  readonly ink: string
  readonly inkFaint: string
  readonly border: string
}

export const paperInk: PaperInkTokens = {
  ink: '#3c3327',
  inkFaint: '#7d6e56',
  border: 'rgba(60, 51, 39, 0.16)',
}
