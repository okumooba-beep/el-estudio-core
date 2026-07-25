/**
 * Estado físico de una hoja. Un solo valor por ahora — "en su lugar,
 * quieta" — porque todavía no existe ningún movimiento entre muebles
 * para describir (Sprint 2.3, punto 08). Cuando exista una transición
 * real, este tipo crecerá; no antes.
 */
export type SheetEstado = 'en-lugar'

export interface SheetPhysics {
  /**
   * Posición libre en dos ejes, reservada para cuando un mueble permita
   * clavar una hoja en cualquier punto (en vez del orden vertical fijo
   * que usa el Tablero hoy). Sin valor todavía.
   */
  readonly position?: { readonly x: number; readonly y: number }
  readonly rotation: number
  readonly depth: number
  readonly estado: SheetEstado
}

const ROTATIONS = [-1.4, 1.1, -0.6, 1.6, -1.9, 0.8]

/**
 * Sprint 3.2, prioridad 4: el Tablero no debía sentirse como una lista
 * sobre fondo marrón. `position` ya existía reservado para esto — hoy
 * se usa como un corrimiento chico (no una posición libre todavía) que,
 * sumado a la rotación, deja que las hojas se superpongan apenas, como
 * un tablero real. Determinístico por índice, misma razón que ROTATIONS.
 */
const OFFSETS_X = [-6, 5, -3, 8, -5, 3]
const OFFSETS_Y = [-10, 6, -14, 4, -8, 10]

/**
 * Física de una hoja sobre un mueble (Sprint 2.3, punto 08): posición,
 * rotación, profundidad y estado — arquitectura para cuando exista
 * movimiento real entre muebles, no una animación todavía. La rotación
 * es determinística por índice (nunca Math.random en cada render: la
 * misma hoja se debe ver exactamente igual en cada re-render, no
 * parpadear ni "temblar").
 */
export function getSheetPlacement(index: number): SheetPhysics {
  return {
    rotation: ROTATIONS[index % ROTATIONS.length] ?? 0,
    position: {
      x: OFFSETS_X[index % OFFSETS_X.length] ?? 0,
      y: OFFSETS_Y[index % OFFSETS_Y.length] ?? 0,
    },
    depth: index,
    estado: 'en-lugar',
  }
}
