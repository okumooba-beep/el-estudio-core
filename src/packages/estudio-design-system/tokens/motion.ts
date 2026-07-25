/**
 * Codificación literal del sheet aprobado (ARCHITECTURE_FOUNDATION.md §8):
 * los ocho nombres del lenguaje de animación (Open/Close/Focus/Selection/
 * Classification/Completion/Transition/Micro), cada uno con su duración y
 * curva de easing.
 *
 * El sheet en sí (una de las 4 referencias visuales entregadas, no un
 * archivo de este repo) no está disponible como texto para citar sus
 * números exactos. En su lugar, cada valor se extrae de la animación ya
 * implementada y ya aprobada a través de sprints anteriores que mejor
 * corresponde a ese nombre en src/index.css — nunca un valor inventado
 * sin evidencia:
 * - Open: `.idea-hoja` (transición de apertura de una hoja al volverse activa).
 * - Close: misma curva que Open — no existe hoy una curva de cierre
 *   distinta; el toggle open/cerrado ya reutiliza la misma transición.
 * - Focus: `.libreta-light` / `:focus-visible` (opacidad al enfocar).
 * - Selection: `.idea-destino` / `.expediente-chip` (elegir un destino/chip).
 * - Classification: `@keyframes idea-destinos-in` (aparición de la
 *   propuesta de clasificación).
 * - Completion: sin transición propia implementada todavía
 *   (`.idea-hoja-completed` es opacidad estática) — usa el mismo valor
 *   que Focus, el acknowledgement más quieto que ya existe en la app.
 * - Transition: `body` (escala al acercarse — `.workspace:hover`,
 *   `[data-gaze="escritorio"]` — el único cambio de escena completa).
 * - Micro: micro-interacciones de hover/color repetidas en toda la app
 *   (`.idea-destino`, `.expediente-chip`, `.checklist-fila`).
 *
 * Varios nombres comparten hoy el mismo valor porque la implementación
 * real solo tiene tres familias de tiempo distintas (~150-200ms quieto,
 * ~320-420ms de asentamiento, y los ciclos de ambiente de 44-71s que
 * pertenecen solo a World, fuera del alcance de este Design System) — no
 * se inventó una octava curva distinta para parecer más completo de lo
 * que la evidencia permite.
 */

export interface MotionToken {
  readonly duration: string
  readonly easing: string
}

export interface MotionTokens {
  readonly open: MotionToken
  readonly close: MotionToken
  readonly focus: MotionToken
  readonly selection: MotionToken
  readonly classification: MotionToken
  readonly completion: MotionToken
  readonly transition: MotionToken
  readonly micro: MotionToken
}

const SETTLE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export const motion: MotionTokens = {
  open: { duration: '420ms', easing: SETTLE },
  close: { duration: '420ms', easing: SETTLE },
  focus: { duration: '200ms', easing: 'ease' },
  selection: { duration: '150ms', easing: 'ease' },
  classification: { duration: '420ms', easing: SETTLE },
  completion: { duration: '200ms', easing: 'ease' },
  transition: { duration: '320ms', easing: SETTLE },
  micro: { duration: '150ms', easing: 'ease' },
}
