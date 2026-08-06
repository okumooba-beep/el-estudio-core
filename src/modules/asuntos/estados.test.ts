import { describe, expect, it } from 'vitest'
import { estadoDe, prioridadDe } from './estados'
import type { Idea } from '@/types/idea'

function asunto(over: Partial<Idea>): Idea {
  return {
    id: 'a', texto: 'Esperando la factura', fecha: '2026-08-01', hora: '10:00',
    destino: 'asuntos', origen: 'hoy', estado: null, currentFurniture: 'bandeja',
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z',
    history: [], pendingSync: false, ...over,
  }
}

describe('estadoDe', () => {
  it('una idea recién llegada del Umbral es un asunto pendiente, no uno sin estado', () => {
    expect(estadoDe(asunto({ estado: null }))).toBe('pendiente')
  })

  it('respeta los cuatro estados vigentes', () => {
    expect(estadoDe(asunto({ estado: 'en-espera' }))).toBe('en-espera')
    expect(estadoDe(asunto({ estado: 'resuelto' }))).toBe('resuelto')
    expect(estadoDe(asunto({ estado: 'archivado' }))).toBe('archivado')
  })

  it('migra los valores heredados del diseño anterior (Sprint 003)', () => {
    expect(estadoDe(asunto({ estado: 'completado' }))).toBe('resuelto')
    expect(estadoDe(asunto({ estado: 'en-progreso' }))).toBe('pendiente')
  })

  it('ignora estados de otros muebles: "terminada" es de Misiones', () => {
    expect(estadoDe(asunto({ estado: 'terminada' }))).toBe('pendiente')
  })
})

describe('prioridadDe', () => {
  it('un asunto recién capturado es prioridad normal', () => {
    expect(prioridadDe(asunto({}))).toBe('normal')
  })

  it('respeta "importante" cuando el usuario lo marcó', () => {
    expect(prioridadDe(asunto({ prioridad: 'importante' }))).toBe('importante')
  })
})
