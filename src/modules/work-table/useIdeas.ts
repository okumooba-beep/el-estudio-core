import { useCallback, useEffect, useState } from 'react'
import { ideaRepository, type AddOptions } from './ideaRepository'
import { buildMovePatch } from './moveSheet'
import type { Idea } from '@/types/idea'
import type { FurnitureId } from '@world/studio/furniture'

/**
 * `ready` distingue "todavía no leímos IndexedDB" de "ya leímos y no hay
 * nada" — sin esto, cada pantalla mostraba su estado vacío por un
 * instante en cada montaje, incluso cuando sí había datos, porque
 * `ideas` arranca en `[]` antes de que resuelva la promesa.
 */
export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ideaRepository.list().then((loaded) => {
      setIdeas(loaded)
      setReady(true)
    })
  }, [])

  const add = useCallback(async (texto: string, options?: AddOptions) => {
    const created = await ideaRepository.add(texto, options)
    setIdeas((current) => [created, ...current])
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
    setIdeas((current) =>
      current.map((i) => (i.id === idea.id ? { ...i, ...patch, updatedAt, pendingSync: true } : i)),
    )
    return ideaRepository.update(idea.id, patch).then(() => undefined)
  }, [])

  const update = useCallback((id: string, patch: Partial<Omit<Idea, 'id' | 'createdAt'>>): Promise<void> => {
    const updatedAt = new Date().toISOString()
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? { ...idea, ...patch, updatedAt, pendingSync: true } : idea)),
    )
    return ideaRepository.update(id, patch).then(() => undefined)
  }, [])

  return { ideas, ready, add, moveSheet, update }
}
