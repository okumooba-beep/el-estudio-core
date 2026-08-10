import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { AgendaEvento, AgendaBloque, AgendaPrioridad } from '@/types/agenda'

/**
 * Mismo patrón que financeRepository.ts: una tabla Dexie por entidad,
 * mismo contrato Repository<T> (list), add/update con la forma real de
 * cada una.
 */
export interface NuevoAgendaEvento {
  texto: string
  fecha: string
  hora: string | null
  alarma: boolean
  ideaId: string
  /** Sprint 014: detectada del texto libre ("urgente"/"importante"); sin señal, 'normal'. */
  prioridad?: AgendaPrioridad
}

export interface AgendaEventoRepository extends Repository<AgendaEvento> {
  add(input: NuevoAgendaEvento): Promise<AgendaEvento>
  update(id: string, patch: Partial<Omit<AgendaEvento, 'id' | 'createdAt'>>): Promise<AgendaEvento>
}

class DexieAgendaEventoRepository implements AgendaEventoRepository {
  async list(): Promise<AgendaEvento[]> {
    const eventos = await db.agendaEventos.toArray()
    return eventos.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevoAgendaEvento): Promise<AgendaEvento> {
    const now = new Date().toISOString()
    const evento: AgendaEvento = {
      id: generateId(),
      texto: input.texto.trim(),
      fecha: input.fecha,
      hora: input.hora,
      alarma: input.alarma,
      completado: false,
      prioridad: input.prioridad ?? 'normal',
      aviso: '1hora',
      ideaId: input.ideaId,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.agendaEventos.add(evento)
    return evento
  }

  async update(id: string, patch: Partial<Omit<AgendaEvento, 'id' | 'createdAt'>>): Promise<AgendaEvento> {
    await db.agendaEventos.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.agendaEventos.get(id)
    if (!updated) throw new Error(`Evento ${id} no encontrado`)
    return updated
  }
}

export interface NuevoAgendaBloque {
  texto: string
  dia: string
  hora: string | null
  alarma: boolean
}

export interface AgendaBloqueRepository extends Repository<AgendaBloque> {
  add(input: NuevoAgendaBloque): Promise<AgendaBloque>
  update(id: string, patch: Partial<Omit<AgendaBloque, 'id' | 'createdAt'>>): Promise<AgendaBloque>
  /**
   * Sprint 012, punto 3: "Eliminar bloque" es una acción real para
   * resolver un conflicto de horario, no el archivado suave del
   * Sprint 010 — un Bloque nunca pasa por el Umbral, así que el
   * contrato "nada se borra" no lo alcanza (ver types/agenda.ts).
   */
  remove(id: string): Promise<void>
}

class DexieAgendaBloqueRepository implements AgendaBloqueRepository {
  async list(): Promise<AgendaBloque[]> {
    const bloques = await db.agendaBloques.toArray()
    return bloques.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NuevoAgendaBloque): Promise<AgendaBloque> {
    const now = new Date().toISOString()
    const bloque: AgendaBloque = {
      id: generateId(),
      texto: input.texto.trim(),
      dia: input.dia,
      hora: input.hora,
      alarma: input.alarma,
      completado: false,
      archivado: false,
      createdAt: now,
      updatedAt: now,
      pendingSync: true,
    }
    await db.agendaBloques.add(bloque)
    return bloque
  }

  async update(id: string, patch: Partial<Omit<AgendaBloque, 'id' | 'createdAt'>>): Promise<AgendaBloque> {
    await db.agendaBloques.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.agendaBloques.get(id)
    if (!updated) throw new Error(`Bloque ${id} no encontrado`)
    return updated
  }

  async remove(id: string): Promise<void> {
    await db.agendaBloques.delete(id)
  }
}

export const agendaEventoRepository: AgendaEventoRepository = new DexieAgendaEventoRepository()
export const agendaBloqueRepository: AgendaBloqueRepository = new DexieAgendaBloqueRepository()
