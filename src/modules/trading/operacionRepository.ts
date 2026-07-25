import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import { buildChecklistFromTemplate } from './checklistTemplate'
import type { Operacion, OperacionLado } from '@/types/operacion'

export interface NuevaOperacion {
  instrumento: string
  setup: string
  lado: OperacionLado
  resultadoPuntos: number
  resultadoUSD: number
}

export interface OperacionRepository extends Repository<Operacion> {
  add(input: NuevaOperacion): Promise<Operacion>
  update(id: string, patch: Partial<Omit<Operacion, 'id' | 'createdAt'>>): Promise<Operacion>
}

/**
 * Persistencia local de la Mesa de Análisis — misma base que ideaRepository
 * (ver src/lib/db/db.ts), mismo contrato (list/add/update), pero una tabla
 * propia: una operación nunca pasa por `ideas` (Sprint 3.5, parte 1).
 */
class DexieOperacionRepository implements OperacionRepository {
  async list(): Promise<Operacion[]> {
    const operaciones = await db.operaciones.toArray()
    return operaciones.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevaOperacion): Promise<Operacion> {
    const now = new Date()
    const operacion: Operacion = {
      id: generateId(),
      fecha: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 5),
      instrumento: input.instrumento.trim(),
      setup: input.setup.trim(),
      lado: input.lado,
      resultadoPuntos: input.resultadoPuntos,
      resultadoUSD: input.resultadoUSD,
      imagen: null,
      resumen: '',
      emociones: '',
      aprendizajes: '',
      checklist: buildChecklistFromTemplate(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      pendingSync: true,
    }
    await db.operaciones.add(operacion)
    return operacion
  }

  async update(id: string, patch: Partial<Omit<Operacion, 'id' | 'createdAt'>>): Promise<Operacion> {
    await db.operaciones.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.operaciones.get(id)
    if (!updated) throw new Error(`Operación ${id} no encontrada`)
    return updated
  }
}

export const operacionRepository: OperacionRepository = new DexieOperacionRepository()
