import { FURNITURE_TO_DESTINO } from './destinoFurniture'
import type { Idea } from '@/types/idea'
import type { FurnitureId } from '@world/studio/furniture'

/**
 * Calcula el patch de mover una hoja de lugar (Sprint 3.6, parte 5) — la
 * única función que lo hace; toda otra forma de cambiar destino quedó
 * eliminada. Una hoja nunca cambia de identidad, solo de lugar (parte
 * 11): el historial nunca se borra, solo se agrega (parte 4).
 *
 * Pura (sin I/O) a propósito: useIdeas.moveSheet la usa para aplicar el
 * cambio al estado en memoria de inmediato y persistirlo en paralelo,
 * sin que la UI espere a IndexedDB.
 */
export function buildMovePatch(idea: Idea, to: FurnitureId) {
  const destino = FURNITURE_TO_DESTINO[to] ?? idea.destino
  return {
    destino,
    estado: destino === 'misiones' ? ('pendiente' as const) : null,
    currentFurniture: to,
    history: [...idea.history, { evento: 'movida' as const, furniture: to, fecha: new Date().toISOString() }],
  }
}
