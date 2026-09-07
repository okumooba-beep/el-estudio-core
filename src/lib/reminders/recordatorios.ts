import { db } from '@/lib/db/db'
import { generateId } from '@shared-kernel/id'
import type { Recordatorio, RecordatorioOrigen } from '@/types/recordatorio'

/**
 * Fase 3 (push real) — puente entre Agenda/Misiones y `recordatorios`
 * (tabla que dispatch-reminders lee por cron, ver recordatoriosSync.ts).
 * Cada alarma real (AgendaEvento/AgendaBloque/Misión) tiene a lo sumo un
 * recordatorio propio, ubicado por (origenTipo, origenId) — nunca por su
 * `id` propio, que ni Agenda ni Misiones conocen.
 */
async function buscarPorOrigen(origenTipo: RecordatorioOrigen, origenId: string): Promise<Recordatorio | undefined> {
  return db.recordatorios.where('origenId').equals(origenId).filter((r) => r.origenTipo === origenTipo).first()
}

export interface ActivarRecordatorioInput {
  origenTipo: RecordatorioOrigen
  origenId: string
  titulo: string
  cuerpo: string
  dispararEn: string
}

/**
 * Crea el recordatorio de un origen, o lo actualiza si ya existía (p. ej.
 * se editó la hora, o ya se había disparado antes y la alarma se volvió a
 * activar — `enviado`/`enviadoEn` se resetean para que dispatch-reminders
 * lo vuelva a tomar).
 */
export async function activarRecordatorio(input: ActivarRecordatorioInput): Promise<void> {
  const now = new Date().toISOString()
  const existente = await buscarPorOrigen(input.origenTipo, input.origenId)

  if (existente) {
    await db.recordatorios.update(existente.id, {
      titulo: input.titulo,
      cuerpo: input.cuerpo,
      dispararEn: input.dispararEn,
      enviado: false,
      enviadoEn: null,
      updatedAt: now,
      pendingSync: true,
    })
    return
  }

  const nuevo: Recordatorio = {
    id: generateId(),
    origenTipo: input.origenTipo,
    origenId: input.origenId,
    titulo: input.titulo,
    cuerpo: input.cuerpo,
    dispararEn: input.dispararEn,
    enviado: false,
    enviadoEn: null,
    createdAt: now,
    updatedAt: now,
    pendingSync: true,
  }
  await db.recordatorios.add(nuevo)
}

/**
 * Apaga el recordatorio de un origen sin borrar la fila local: se usa
 * tanto al desactivar el toggle de alarma como al soft-deletar el
 * evento/bloque/misión asociado. `recordatoriosSync.ts` nunca propaga
 * borrados a Supabase (mismo límite documentado ahí, igual que Trading)
 * — un `delete()` acá dejaría la fila viva del lado del servidor y
 * dispatch-reminders igual la dispararía. Marcar `enviado: true` viaja en
 * el próximo push (upsert por id) y el cron la ve resuelta, sin mandar
 * nada. No-op si nunca existió, o si ya estaba enviada.
 */
export async function cancelarRecordatorio(origenTipo: RecordatorioOrigen, origenId: string): Promise<void> {
  const existente = await buscarPorOrigen(origenTipo, origenId)
  if (!existente || existente.enviado) return
  await db.recordatorios.update(existente.id, {
    enviado: true,
    updatedAt: new Date().toISOString(),
    pendingSync: true,
  })
}
