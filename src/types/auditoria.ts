/**
 * Módulo Auditoría — "Comprender si el sistema se está corrigiendo", no un
 * calendario ni un sistema de misiones nuevo (ver brief del sprint). Estas
 * cuatro entidades son lo único que Auditoría necesita persistir por su
 * cuenta: todo lo demás (bloques protegidos, misión actual, conflictos,
 * evidencia cuantitativa) se deriva en vivo de Agenda/Misiones, nunca se
 * copia acá (ver auditoria/evidencia.ts, agenda/public.ts).
 */

/**
 * En qué capa del sistema apareció una desviación — no todo lo que se
 * rompe es lo mismo: una sesión saltada por trabajo urgente (Ejecución)
 * no pide la misma corrección que un objetivo mal elegido (Dirección).
 */
export type RupturaTipo = 'direccion' | 'sistema' | 'ejecucion' | 'correccion'

export interface AuditRuptura {
  id: string
  /** YYYY-MM-DD: el día en que se detectó/registró, no necesariamente el día del bloque afectado. */
  fecha: string
  texto: string
  tipo: RupturaTipo
  /** El AgendaBloque o AgendaEvento del que nació esta ruptura, cuando aplica — nunca copia sus datos, solo referencia. */
  origenId?: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

export interface AuditPremortem {
  id: string
  /** Lunes ISO de la semana para la que se registra este riesgo (ver auditoria/semanas.ts). */
  semanaId: string
  patron: string
  primeraSeñal: string
  cuando: string
  respuesta: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

/**
 * Corrección Semanal — las 7 preguntas fijas del brief (§13), verbatim.
 * Una fila por semana: `semanaId` es único (auditoriaRepository hace
 * check-before-insert, nunca dos filas para la misma semana).
 */
export interface AuditCorreccionSemanal {
  id: string
  /** Lunes ISO de la semana que esta corrección cierra. */
  semanaId: string
  /** 1. ¿Qué prometí ejecutar esta semana? */
  promesa: string
  /** 2. ¿Qué hice realmente? */
  ejecutadoReal: string
  /** 3. ¿Qué evidencia produje? */
  evidenciaProducida: string
  /** 4. ¿En qué capa apareció la ruptura? */
  capaRuptura: RupturaTipo
  /** 5. ¿Qué aprendí? */
  aprendizaje: string
  /** 6. ¿Cuál es la única corrección que aplicaré? */
  correccionUnica: string
  /** 7. ¿Dónde aparece esa corrección en el calendario de la próxima semana? (descripción en palabras del usuario) */
  dondeEnCalendario: string
  /** Se llena recién cuando el usuario aprieta "Aplicar a próxima semana" — el AgendaBloque real que creó esa corrección. */
  bloqueCreadoId?: string
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}

/**
 * Fila única de configuración (`id` siempre `'config'`) — nunca una
 * lista, por eso `auditoriaRepository` la expone con `get`/`upsert` en
 * vez del contrato `Repository<T>.list()` que usan las otras tres.
 */
export interface AuditConfig {
  id: 'config'
  /** El "resultado dominante" del período — configurable, nunca acoplado a trading (§7 del brief). */
  resultadoDominante: string
  /**
   * Patrones de texto para reconocer qué bloque protegido corresponde a
   * qué "evidencia" (NY SESSION, BACKTESTING, REGISTROS...) — §17 del
   * brief: "la arquitectura debe permitir cambiar estos horarios sin
   * modificar código". `patron` es un fragmento de texto (case-insensitive,
   * sin regex) que se busca dentro de `AgendaBloque.texto`.
   */
  rutinasReconocidas: { etiqueta: string; patron: string }[]
  /** La señal roja personal (§12): condición + respuesta pre-decidida. */
  señalRoja: { condicion: string; respuesta: string }
  createdAt: string
  updatedAt: string
  pendingSync: boolean
}
