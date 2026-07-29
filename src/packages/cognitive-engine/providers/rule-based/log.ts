import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import type { ClassificationReason } from '../../ports/ClassificationEngine'
import type { Destino } from './rules'

const KEY = 'comprehension-log'
const MAX_ENTRIES = 200

export interface ClassificationLogEntry {
  readonly texto: string
  readonly destinoPropuesto: Destino
  /**
   * Umbral V1: `null` cuando el usuario todavía no se pronunció — el
   * Estudio asignó por confianza alta y nadie confirmó ni corrigió.
   * Antes se escribía el destino propuesto cuando la propuesta expiraba
   * por timeout, o sea que el log guardaba como decisión del usuario
   * algo que el usuario nunca decidió. Ese historial es el que más
   * adelante va a usar la IA: contaminarlo con consentimientos falsos
   * era el peor de los errores silenciosos.
   */
  readonly destinoElegido: Destino | null
  readonly reason: ClassificationReason
  readonly fecha: string
}

/**
 * Evidencia interna, solo desarrollo (Sprint 2.1, punto 10) — nunca se
 * muestra al usuario. Registra qué propuso el Motor de Comprensión,
 * qué eligió finalmente el usuario y con qué regla, para poder
 * mejorar el motor más adelante. Vive en localStorage igual que el
 * resto de la memoria local: nunca sale del dispositivo.
 */
export function recordClassification(entry: ClassificationLogEntry): void {
  const log = readJSON<ClassificationLogEntry[]>(KEY, [])
  log.push(entry)
  writeJSON(KEY, log.slice(-MAX_ENTRIES))
}
