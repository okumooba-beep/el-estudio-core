import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'
import type { ClassificationReason } from '../../ports/ClassificationEngine'
import type { Destino } from './rules'

const KEY = 'comprehension-log'
const MAX_ENTRIES = 200

export interface ClassificationLogEntry {
  readonly texto: string
  readonly destinoPropuesto: Destino
  readonly destinoElegido: Destino
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
