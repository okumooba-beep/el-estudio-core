import { useCallback, useSyncExternalStore } from 'react'
import { ideaRepository, type AddOptions } from './ideaRepository'
import { buildMovePatch } from './moveSheet'
import type { Idea } from '@/types/idea'
import type { FurnitureId } from '@world/studio/furniture'

/**
 * Core V3 — "El Estudio deja de reportar, empieza a responder": antes
 * cada pantalla que llamaba useIdeas() tenía su propia copia de estado,
 * leída una sola vez de IndexedDB al montar (ver historial de este
 * archivo) — escribir una Idea en el Umbral no se reflejaba en Seguir
 * con esto ni en Misión Principal hasta salir de Hoy y volver a entrar.
 * Ahora todas las instancias de useIdeas() comparten una única fuente
 * de verdad a nivel de módulo: cualquier add/update/moveSheet, sin
 * importar qué componente lo llamó, notifica a todos los suscriptores
 * montados en el mismo tick. `useSyncExternalStore` es la primitiva de
 * React pensada exactamente para esto (ya en el proyecto desde React
 * 19) — ningún store global nuevo tipo Redux/Zustand, ninguna
 * dependencia agregada. `ideaRepository` sigue siendo el único punto de
 * persistencia (ver grep: nada fuera de este archivo lo llama), así que
 * este módulo sigue siendo la única fuente de verdad de Ideas.
 */
let cache: Idea[] = []
let ready = false
let loadPromise: Promise<void> | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function load(): void {
  if (loadPromise) return
  loadPromise = ideaRepository.list().then((loaded) => {
    cache = loaded
    ready = true
    notify()
  })
}

function setCache(next: Idea[]): void {
  cache = next
  notify()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  load()
  return () => listeners.delete(listener)
}

function getSnapshot(): Idea[] {
  return cache
}

export function useIdeas() {
  const ideas = useSyncExternalStore(subscribe, getSnapshot)

  const add = useCallback(async (texto: string, options?: AddOptions) => {
    const created = await ideaRepository.add(texto, options)
    setCache([created, ...cache])
    return created
  }, [])

  /**
   * Optimista a propósito (Sprint "Perceived Performance"): el estado se
   * actualiza en el mismo tick, antes de que IndexedDB confirme nada —
   * el patch ya determina el resultado final, no hace falta esperar la
   * lectura de vuelta que hacía `ideaRepository.update` para saberlo.
   */
  const moveSheet = useCallback((idea: Idea, to: FurnitureId): Promise<void> => {
    const patch = buildMovePatch(idea, to)
    const updatedAt = new Date().toISOString()
    setCache(cache.map((i) => (i.id === idea.id ? { ...i, ...patch, updatedAt, pendingSync: true } : i)))
    return ideaRepository.update(idea.id, patch).then(() => undefined)
  }, [])

  const update = useCallback((id: string, patch: Partial<Omit<Idea, 'id' | 'createdAt'>>): Promise<void> => {
    const updatedAt = new Date().toISOString()
    setCache(cache.map((idea) => (idea.id === id ? { ...idea, ...patch, updatedAt, pendingSync: true } : idea)))
    return ideaRepository.update(id, patch).then(() => undefined)
  }, [])

  return { ideas, ready, add, moveSheet, update }
}
