/**
 * Una Idea nunca vive en el lugar donde nació (Sprint 2.0 — "El Destino
 * de las Ideas"). El Escritorio (destino 'hoy') solo la captura; el
 * Estudio existe para ayudarla a encontrar su lugar entre siete
 * destinos posibles — siete muebles (ver src/packages/world/studio/muebles.ts).
 * Cada Idea vive en exactamente uno: por eso `destino` es un campo
 * único, nunca una lista. Cuando cambia, la misma hoja se mudó de
 * mueble — nunca existe una copia en el mueble viejo (Sprint 2.2,
 * punto 04).
 *
 * Reemplaza a Nota (ver git history / docs previos): mismo propósito,
 * un nombre que ya no miente sobre lo que es — algo que todavía no
 * encontró dónde vivir, no una anotación cerrada sobre sí misma.
 */
import type { FurnitureId, HistoryEntry } from '@world/studio/furniture'

export type IdeaDestino = 'hoy' | 'misiones' | 'habitos' | 'trading' | 'finanzas' | 'biblioteca' | 'archivo'

export interface Idea {
  id: string
  texto: string
  fecha: string
  hora: string
  /** Dónde vive esta idea ahora. 'hoy' es también un destino real, no solo un estado transitorio. */
  destino: IdeaDestino
  /**
   * Desde dónde nació esta idea (Sprint 3.1 — "Dos formas de entrar"):
   * 'hoy' cuando pasó por el Escritorio, o el mismo destino cuando
   * nació directamente en un mueble vía "Nueva hoja". Todavía no se
   * usa para nada — solo se persiste.
   */
  origen: IdeaDestino
  /**
   * Reservado para el ciclo de vida propio de cada destino (p. ej.
   * 'pendiente' en Misiones). null hasta que el destino le dé un
   * significado real — muchos destinos todavía no lo necesitan.
   */
  estado: string | null
  /**
   * Dónde vive físicamente esta hoja ahora (Sprint 3.6, ver
   * src/packages/world/studio/furniture.ts). No reemplaza a `destino`: destino es
   * la categoría, currentFurniture es el mueble real que la aloja.
   */
  currentFurniture: FurnitureId
  /**
   * Cada mueble por el que pasó esta hoja, en orden. Nunca se borra una
   * entrada, solo se agrega — la única forma de cambiarlo es
   * moveSheet() (ver src/modules/work-table/moveSheet.ts).
   */
  history: readonly HistoryEntry[]
  createdAt: string
  updatedAt: string
  /** F5 (ARCHITECTURE_RATIFIED.md): marcado inerte — ver shared-kernel/persistence/Repository. */
  pendingSync: boolean
}
