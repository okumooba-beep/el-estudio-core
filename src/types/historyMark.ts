/**
 * History Marks: pequeños cambios permanentes que un objeto acumula con
 * el tiempo — una esquina gastada, una cinta que empieza a asomar, una
 * hoja que sobresale, un lápiz apoyado (ejemplos de Implementación 09,
 * punto 08). `kind` queda como string abierto a propósito: cada ejemplo
 * es un futuro valor posible, nunca un enum cerrado, porque la lista de
 * objetos que pueden llevar marcas todavía va a crecer. Nunca por logros
 * ni recompensas, solo por tiempo vivido de verdad (ver docs/vision.md,
 * src/packages/world/world/worldRules.ts). No implementado todavía — ver
 * src/lib/room/historyMarks.ts. Una marca de café no vive acá: si es
 * del escritorio y no de un objeto, es un DeskMemoryMark (ver
 * src/types/deskMemory.ts).
 */
export interface HistoryMark {
  readonly id: string
  readonly kind: string
  /** ISO date: cuándo se grabó la marca. */
  readonly acquiredAt: string
}
