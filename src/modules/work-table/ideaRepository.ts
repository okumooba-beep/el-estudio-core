import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import { eventBus } from '@shared-kernel/events/AppEvents'
import { DESTINO_TO_FURNITURE } from './destinoFurniture'
import type { Idea, IdeaDestino } from '@/types/idea'

export interface AddOptions {
  /** Sprint 3.1: "Nueva hoja" desde un mueble nace ya con ese destino, sin pasar por el Escritorio. */
  destino?: IdeaDestino
  origen?: IdeaDestino
}

export interface IdeaRepository extends Repository<Idea> {
  add(texto: string, options?: AddOptions): Promise<Idea>
  update(id: string, patch: Partial<Omit<Idea, 'id' | 'createdAt'>>): Promise<Idea>
  /** Sprint Asuntos ("Redefinir y reconstruir UX") — borrado real, no un cambio de estado. Mismo patrón que `financeRepository.delete`. */
  delete(id: string): Promise<void>
}

/**
 * Persistencia local — ver src/lib/db/db.ts. La migración de `notas` a
 * `ideas` (Sprint 2.0) corre una sola vez dentro de la propia
 * actualización de versión de Dexie, nunca acá.
 */
class DexieIdeaRepository implements IdeaRepository {
  async list(): Promise<Idea[]> {
    const ideas = await db.ideas.toArray()
    return ideas.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(texto: string, options?: AddOptions): Promise<Idea> {
    const now = new Date()
    const nowISO = now.toISOString()
    const destino = options?.destino ?? 'hoy'
    const origen = options?.origen ?? 'hoy'
    const furniture = DESTINO_TO_FURNITURE[destino]
    const idea: Idea = {
      id: generateId(),
      texto: texto.trim(),
      fecha: nowISO.slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      destino,
      origen,
      estado: destino === 'misiones' ? 'pendiente' : null,
      currentFurniture: furniture,
      history: [
        { evento: 'creada', furniture: 'diario', fecha: nowISO },
        { evento: 'creada', furniture, fecha: nowISO },
      ],
      createdAt: nowISO,
      updatedAt: nowISO,
      pendingSync: true,
    }
    await db.ideas.add(idea)
    eventBus.emit('idea.captured', { id: idea.id, texto: idea.texto })
    return idea
  }

  async update(id: string, patch: Partial<Omit<Idea, 'id' | 'createdAt'>>): Promise<Idea> {
    await db.ideas.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.ideas.get(id)
    if (!updated) throw new Error(`Idea ${id} no encontrada`)
    return updated
  }

  async delete(id: string): Promise<void> {
    await db.ideas.delete(id)
  }
}

export const ideaRepository: IdeaRepository = new DexieIdeaRepository()
