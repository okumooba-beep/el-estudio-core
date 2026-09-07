import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import { formatearHora12 } from '@shared-kernel/text/interpretarTexto'
import type { Repository } from '@shared-kernel/persistence/Repository'
import type { AgendaEvento, AgendaBloque, AgendaPrioridad } from '@/types/agenda'
import { calcularDisparo, minutosDeAviso } from '@/lib/reminders/calcularDisparo'
import { activarRecordatorio, cancelarRecordatorio } from '@/lib/reminders/recordatorios'

/**
 * Mismo patrón que financeRepository.ts: una tabla Dexie por entidad,
 * mismo contrato Repository<T> (list), add/update con la forma real de
 * cada una.
 *
 * Fase 3 (push real): cada `add`/`update` de Evento o Bloque termina
 * recalculando su recordatorio a partir del estado YA fusionado (nunca
 * del patch parcial) — así cualquier combinación de campos que cambien
 * en el mismo llamado (alarma, fecha, hora, aviso) queda resuelta con una
 * sola regla, sin tener que acordarse de wirear cada handler de
 * AgendaScreen.tsx por separado.
 */
async function sincronizarRecordatorioEvento(evento: AgendaEvento): Promise<void> {
  const dispararEn = evento.alarma ? calcularDisparo(evento.fecha, evento.hora, minutosDeAviso(evento.aviso)) : null
  if (!dispararEn) {
    await cancelarRecordatorio('agenda_evento', evento.id)
    return
  }
  await activarRecordatorio({
    origenTipo: 'agenda_evento',
    origenId: evento.id,
    titulo: evento.texto,
    cuerpo: evento.hora ? `Agenda · ${formatearHora12(evento.hora)}` : 'Agenda',
    dispararEn,
  })
}

async function sincronizarRecordatorioBloque(bloque: AgendaBloque): Promise<void> {
  const dispararEn = bloque.alarma ? calcularDisparo(bloque.dia, bloque.hora) : null
  if (!dispararEn) {
    await cancelarRecordatorio('agenda_bloque', bloque.id)
    return
  }
  await activarRecordatorio({
    origenTipo: 'agenda_bloque',
    origenId: bloque.id,
    titulo: bloque.texto,
    cuerpo: bloque.hora ? `Bloque · ${formatearHora12(bloque.hora)}` : 'Bloque',
    dispararEn,
  })
}

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
  /**
   * Fase 3.1 (push real): mismo patrón que `AgendaBloqueRepository.remove` —
   * soft-delete vía `deletedAt` (ver types/agenda.ts) más cancelación del
   * recordatorio asociado, para que un Evento borrado nunca dispare una
   * notificación de algo que el usuario ya eliminó.
   */
  remove(id: string): Promise<void>
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
    await sincronizarRecordatorioEvento(evento)
    return evento
  }

  async update(id: string, patch: Partial<Omit<AgendaEvento, 'id' | 'createdAt'>>): Promise<AgendaEvento> {
    await db.agendaEventos.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.agendaEventos.get(id)
    if (!updated) throw new Error(`Evento ${id} no encontrado`)
    await sincronizarRecordatorioEvento(updated)
    return updated
  }

  async remove(id: string): Promise<void> {
    await db.agendaEventos.update(id, { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), pendingSync: true })
    await cancelarRecordatorio('agenda_evento', id)
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
   * Sprint 012, punto 3: "Eliminar bloque" resuelve un conflicto de
   * horario, distinto del archivado suave del Sprint 010. Fase 4 (sync
   * Supabase): dejó de ser un borrado físico — sin tombstone un borrado
   * local nunca llega a Supabase ni a otro dispositivo, así que ahora es
   * un soft-delete vía `deletedAt` (ver types/agenda.ts), igual que el
   * resto de las entidades sincronizadas.
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
    await sincronizarRecordatorioBloque(bloque)
    return bloque
  }

  async update(id: string, patch: Partial<Omit<AgendaBloque, 'id' | 'createdAt'>>): Promise<AgendaBloque> {
    await db.agendaBloques.update(id, { ...patch, updatedAt: new Date().toISOString(), pendingSync: true })
    const updated = await db.agendaBloques.get(id)
    if (!updated) throw new Error(`Bloque ${id} no encontrado`)
    await sincronizarRecordatorioBloque(updated)
    return updated
  }

  async remove(id: string): Promise<void> {
    await db.agendaBloques.update(id, { deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), pendingSync: true })
    await cancelarRecordatorio('agenda_bloque', id)
  }
}

export const agendaEventoRepository: AgendaEventoRepository = new DexieAgendaEventoRepository()
export const agendaBloqueRepository: AgendaBloqueRepository = new DexieAgendaBloqueRepository()
