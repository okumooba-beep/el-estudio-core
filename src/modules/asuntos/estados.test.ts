import { describe, expect, it } from 'vitest'
import { describirEspera, diasEsperando, estadoDe } from './estados'
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

  it('respeta los cuatro estados del documento', () => {
    expect(estadoDe(asunto({ estado: 'en-espera' }))).toBe('en-espera')
    expect(estadoDe(asunto({ estado: 'completado' }))).toBe('completado')
  })

  it('ignora estados de otros muebles: "terminada" es de Misiones', () => {
    // `Idea.estado` es un string compartido; sin normalizar, una hoja
    // que pasó por Misiones llegaría acá con un estado que no existe.
    expect(estadoDe(asunto({ estado: 'terminada' }))).toBe('pendiente')
  })
})

describe('diasEsperando', () => {
  it('cuenta desde el último cambio de estado, no desde la creación', () => {
    const a = asunto({ createdAt: '2026-07-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' })
    expect(diasEsperando(a, new Date('2026-08-04T10:00:00.000Z'))).toBe(3)
  })
})

describe('describirEspera', () => {
  it.each([
    [0, 'Hoy'], [1, 'Ayer'], [3, 'Hace 3 días'],
    [8, 'Hace una semana'], [21, 'Hace 3 semanas'], [40, 'Hace un mes'], [95, 'Hace 3 meses'],
  ])('%i días → %s', (dias, esperado) => {
    expect(describirEspera(dias)).toBe(esperado)
  })
})
