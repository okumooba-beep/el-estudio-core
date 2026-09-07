/**
 * Fase 2 (push real) — un recordatorio programado que dispatch-reminders
 * (Edge Function, corre por pg_cron) manda como notificación push cuando
 * llega `dispararEn`. `enviado`/`enviadoEn` los escribe el servidor, nunca
 * el cliente (ver supabase/functions/dispatch-reminders/index.ts) — Dexie
 * los recibe tal cual vienen de Supabase en la hidratación/migración
 * inicial, igual que cualquier otro campo de esta tabla.
 */
export type RecordatorioOrigen = 'agenda_evento' | 'agenda_bloque' | 'manual'

export interface Recordatorio {
  id: string
  origenTipo: RecordatorioOrigen
  origenId: string | null
  titulo: string
  cuerpo: string
  dispararEn: string
  enviado: boolean
  enviadoEn: string | null
  createdAt: string
  updatedAt: string
  /** F5 (ARCHITECTURE_RATIFIED.md): marcado inerte — ver shared-kernel/persistence/Repository. */
  pendingSync: boolean
}
