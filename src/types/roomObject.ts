import type { HistoryMark } from './historyMark'

/**
 * Room Objects: la arquitectura para los objetos con historia que viven
 * sobre el escritorio (planta, lámpara, libreta, taza, fotografía,
 * reloj...). La libreta es el primero en existir — ver
 * src/components/room/roomObjectsRegistry.ts y
 * src/components/room/objects/Libreta.tsx.
 *
 * Cada objeto es un habitante, no un componente: debe poder responder
 * dos preguntas, "¿por qué apareció?" y "¿qué historia cuenta?" (ver
 * docs/vision.md). Si no puede responder ambas, no debe existir — por
 * eso `reason` y `story` son campos obligatorios, no opcionales.
 */

export type RoomObjectKind = 'planta' | 'lampara' | 'libreta' | 'taza' | 'fotografia' | 'reloj'

export interface RoomObjectPosition {
  x: number
  y: number
}

export type RoomObjectState = 'nuevo' | 'presente' | 'desgastado'

/**
 * Reservado para Objetos Persistentes (ver src/lib/room/objectEvolution.ts):
 * condiciones que en el futuro decidirán si un objeto aparece o cambia.
 * Vacío a propósito — no implementar todavía.
 */
export type RoomObjectCondition = never

export interface RoomObjectAnimation {
  readonly name: string
  readonly durationMs: number
}

export interface RoomObjectDefinition {
  id: string
  kind: RoomObjectKind
  position: RoomObjectPosition
  state: RoomObjectState
  visible: boolean
  animations: readonly RoomObjectAnimation[]
  conditions: readonly RoomObjectCondition[]
  /** ISO date: desde cuándo vive este objeto en el escritorio. Ver Objetos Persistentes. */
  presentSince: string
  /** ¿Por qué apareció este objeto? Nunca "porque sí", nunca una recompensa. */
  reason: string
  /** ¿Qué historia cuenta este objeto? */
  story: string
  /** History Marks acumuladas por el paso del tiempo (ver src/lib/room/historyMarks.ts). Vacío hasta que exista lógica real. */
  historyMarks: readonly HistoryMark[]
}
