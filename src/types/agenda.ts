/**
 * Agenda — "Comprender qué pasa y cuándo" (mismo patrón que Finanzas):
 * un Evento nace en el Umbral como cualquier Idea, pero necesita su
 * propio `fecha`/`hora` — CUÁNDO OCURRE, no cuándo se escribió (`Idea.fecha`
 * es la fecha de captura, ver ideaRepository.ts). Por eso es una
 * entidad propia, vinculada por `ideaId`, igual que FinanceMovimiento.
 *
 * Un Bloque nunca pasa por el Umbral (spec: "Agenda no tiene botón de
 * Nuevo evento ni formulario... para Eventos" — pero los Bloques nacen
 * directo en Planificación semanal). Por eso no tiene `ideaId`.
 */
/** Sprint 012, punto 5: prioridad — solo Eventos la usan, nunca Bloques. */
export type AgendaPrioridad = 'normal' | 'importante' | 'urgente'

/**
 * Sprint 012, punto 7: estructura de aviso por Evento, preparada para
 * el motor de notificaciones de un sprint futuro — todavía no dispara
 * nada, solo guarda la preferencia. Los Bloques no la usan ("Bloques →
 * Sin alarma": siguen con su `alarma: boolean` existente, sin cambios).
 */
export type AgendaAviso = 'ninguno' | 'hora' | '5min' | '10min' | '15min' | '30min' | '1hora' | 'personalizado'

export interface AgendaEvento {
  id: string
  texto: string
  /** YYYY-MM-DD: cuándo ocurre, extraído del texto (ver extraccionFecha.ts). */
  fecha: string
  /** HH:MM, o null si el texto no traía una hora concreta. */
  hora: string | null
  /**
   * Alarma simple y opcional, sin niveles de anticipación (spec).
   * Todavía no dispara nada: el motor de notificaciones real es un
   * sprint aparte, compartido por todo El Estudio — este campo deja a
   * Agenda lista para consumirlo cuando exista.
   */
  alarma: boolean
  /** Completar y archivar a mano son el mismo gesto (spec). */
  completado: boolean
  /** Sprint 012, punto 5. Por defecto 'normal'. */
  prioridad: AgendaPrioridad
  /** Sprint 012, punto 7. Por defecto '1hora'. */
  aviso: AgendaAviso
  /** La hoja del Umbral de la que nació. */
  ideaId: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

export interface AgendaBloque {
  id: string
  texto: string
  /** YYYY-MM-DD: el día del lienzo semanal donde el usuario lo ubicó. */
  dia: string
  /** HH:MM extraída del texto libre (extraerHora), o null si no trae una — Sprint 010, punto 7. */
  hora: string | null
  alarma: boolean
  completado: boolean
  /**
   * Sprint 010 — Auditoría UX v1, punto 5: un Bloque archivado deja de
   * aparecer en la vista diaria y en Planificación semanal, pero el
   * registro sigue existiendo — nunca un borrado real (ese queda fuera
   * de este sprint). No usa el Archivador de Ideas: un Bloque nunca
   * pasa por el Umbral, su ciclo de vida es propio de Agenda.
   */
  archivado: boolean
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}
