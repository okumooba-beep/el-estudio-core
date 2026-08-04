import { describe, expect, it } from 'vitest'
import { categoriaDe, formatearMonto, resumirMes } from './mes'
import type { FinanceMovimiento } from '@/types/finance'

function mov(over: Partial<FinanceMovimiento>): FinanceMovimiento {
  return {
    id: Math.random().toString(36), tipo: 'egreso', monto: 1000, concepto: 'x',
    categoria: 'otros', fecha: '2026-08-03', createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z', pendingSync: false, ...over,
  }
}

describe('resumirMes', () => {
  const agosto = [
    mov({ monto: 80_000, categoria: 'auto' }),
    mov({ monto: 20_000, categoria: 'auto' }),
    mov({ monto: 50_000, categoria: 'comida' }),
    mov({ monto: 300_000, tipo: 'ingreso', categoria: 'otros' }),
    mov({ monto: 999_999, fecha: '2026-07-15', categoria: 'ocio' }),
  ]

  it('solo cuenta el mes pedido', () => {
    expect(resumirMes(agosto, '2026-08').gastado).toBe(150_000)
  })

  it('los ingresos no se suman al gasto', () => {
    const resumen = resumirMes(agosto, '2026-08')
    expect(resumen.ingresado).toBe(300_000)
    expect(resumen.balance).toBe(150_000)
  })

  it('agrupa por categoría y ordena por monto', () => {
    const grupos = resumirMes(agosto, '2026-08').grupos
    expect(grupos.map((g) => g.categoria)).toEqual(['auto', 'comida'])
    expect(grupos[0]).toMatchObject({ total: 100_000, cantidad: 2 })
  })

  it('las partes suman 1 para poder dibujar el anillo', () => {
    const suma = resumirMes(agosto, '2026-08').grupos.reduce((t, g) => t + g.parte, 0)
    expect(suma).toBeCloseTo(1)
  })

  it('un mes sin gastos no divide por cero', () => {
    const resumen = resumirMes([mov({ monto: 5000, tipo: 'ingreso' })], '2026-08')
    expect(resumen.gastado).toBe(0)
    expect(resumen.grupos).toEqual([])
  })
})

describe('categoriaDe', () => {
  it('un movimiento anterior al sprint, sin categoría, se lee como otros', () => {
    const viejo = { ...mov({}), categoria: undefined } as unknown as FinanceMovimiento
    expect(categoriaDe(viejo)).toBe('otros')
  })
})

describe('formatearMonto', () => {
  it('redondea a pesos enteros', () => {
    expect(formatearMonto(1250.5)).toBe('$1.251')
  })
})
