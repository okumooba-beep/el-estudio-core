import type { FurnitureId } from '@world/studio/furniture'
import type { IdeaDestino } from '@/types/idea'

/**
 * Puente entre destino (la categoría, ver src/types/idea.ts) y mueble
 * físico (Sprint 3.6, parte 3 — "no reemplaza destino"). `diario` queda
 * afuera de FURNITURE_TO_DESTINO a propósito: no es un destino, es el
 * registro permanente de todo lo que se escribió alguna vez (parte 8).
 */
export const DESTINO_TO_FURNITURE: Record<IdeaDestino, FurnitureId> = {
  hoy: 'escritorio',
  misiones: 'tablero',
  asuntos: 'bandeja',
  habitos: 'habitos',
  trading: 'mesa-analisis',
  finanzas: 'finanzas',
  agenda: 'agenda',
  biblioteca: 'biblioteca',
  archivo: 'archivador',
}

export const FURNITURE_TO_DESTINO: Partial<Record<FurnitureId, IdeaDestino>> = {
  escritorio: 'hoy',
  tablero: 'misiones',
  bandeja: 'asuntos',
  habitos: 'habitos',
  'mesa-analisis': 'trading',
  finanzas: 'finanzas',
  agenda: 'agenda',
  biblioteca: 'biblioteca',
  archivador: 'archivo',
}
