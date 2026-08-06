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
  alarma: boolean
  completado: boolean
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}
