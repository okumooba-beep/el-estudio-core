import { DESTINO_TO_FURNITURE } from './destinoFurniture'
import type { Idea, IdeaDestino } from '@/types/idea'

export const DRAFT_ID = 'draft'

/**
 * Una hoja en borrador: existe solo en memoria, nunca en IndexedDB
 * (Sprint 3.2, prioridad 1 — "nunca dejar hojas basura"). "Nueva hoja"
 * ya no persiste vacío de entrada; recién se guarda de verdad cuando el
 * primer blur trae texto (ver IdeaSheet onTextoChange/onEmptyBlur).
 */
export function draftIdea(destino: IdeaDestino): Idea {
  const now = new Date()
  return {
    id: DRAFT_ID,
    texto: '',
    fecha: now.toISOString().slice(0, 10),
    hora: now.toTimeString().slice(0, 5),
    destino,
    origen: destino,
    estado: destino === 'misiones' ? 'pendiente' : null,
    currentFurniture: DESTINO_TO_FURNITURE[destino],
    history: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    pendingSync: true,
  }
}
