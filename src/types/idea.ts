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

/** Rediseño Misiones — una sub-tarea propia de una misión, dentro de la misma Idea (ver `Idea.subtareas`). */
export interface Subtarea {
  id: string
  texto: string
  completada: boolean
}

export type IdeaDestino =
  | 'hoy'
  | 'misiones'
  | 'asuntos'
  | 'habitos'
  | 'trading'
  | 'finanzas'
  | 'agenda'
  | 'biblioteca'
  | 'archivo'

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
   * Reservado para Asuntos (Sprint 005): prioridad del seguimiento.
   * Ausente para cualquier otro destino, y ausente también en un
   * asunto recién capturado — la captura rápida no la pide, el
   * silencio significa 'normal'.
   */
  prioridad?: 'normal' | 'importante'
  /**
   * Reservado para Asuntos (Sprint 005): de quién o de qué se espera
   * algo. Ausente hasta que el usuario lo escribe a mano — la captura
   * rápida desde El Umbral solo trae el texto de qué se espera.
   */
  contraparte?: string
  /**
   * Reservado para Misiones (Sprint 013 — "Agenda como eje temporal"):
   * cuándo debe aparecer esta Misión en Agenda. Ausente = no programada,
   * invisible para Agenda — la Misión sigue viviendo únicamente acá
   * (Idea es la única fuente de verdad, Agenda solo la lee vía
   * work-table/public.ts, nunca la copia a otra tabla).
   */
  programadaFecha?: string
  /** Reservado para Misiones (Sprint 013). Ausente/null si no se extrajo una hora del texto. */
  programadaHora?: string | null
  /**
   * Reservado para Misiones (Sprint 016.2 — "Principales y secundarias"):
   * `true` cuando el usuario eligió explícitamente esta misión como una
   * de las cinco que quiere tener delante. Nunca se infiere de la fecha
   * ni de ningún otro campo — es una decisión, no un cálculo. Ausente o
   * `false` = secundaria (nunca invisible: sigue siendo una misión
   * pendiente como cualquier otra).
   */
  misionPrincipal?: boolean
  /**
   * Rediseño Misiones: checklist propio de una misión (ver `Subtarea`
   * arriba). Ausente o vacío = sin sub-tareas. El progreso (X/Y, círculo
   * con relleno proporcional) siempre se calcula a partir de esta lista
   * al leerla — nunca se persiste un porcentaje aparte.
   */
  subtareas?: Subtarea[]
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
