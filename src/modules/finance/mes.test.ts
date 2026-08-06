import { describe, expect, it } from 'vitest'
import { categoriaDe, formatearMonto, resumirMes } from './mes'
import type { FinanceMovimiento } from '@/types/finance'

function mov(over: Partial<FinanceMovimiento>): FinanceMovimiento {
  return {
    id: Math.random().toString(36), tipo: 'egreso', monto: 1000, concepto: 'x',
    categoria: null, moneda: 'ars', medio: 'transferencia', fecha: '2026-08-03', createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z', pendingSync: false, ...over,
  }
}

describe('resumirMes', () => {
  const agosto = [
    mov({ monto: 80_000, categoria: 'auto' }),
    mov({ monto: 20_000, categoria: 'auto' }),
    mov({ monto: 50_000, categoria: 'comida' }),
    mov({ monto: 300_000, tipo: 'ingreso' }),
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

describe('separación por moneda', () => {
  it('los dólares nunca se suman con los pesos', () => {
    const mezcla = [
      mov({ monto: 1_090_000, moneda: 'ars' }),
      mov({ monto: 200, moneda: 'usd' }),
    ]
    expect(resumirMes(mezcla, '2026-08', 'ars').gastado).toBe(1_090_000)
    expect(resumirMes(mezcla, '2026-08', 'usd').gastado).toBe(200)
  })

  it('separa efectivo de transferencia', () => {
    const resumen = resumirMes(
      [mov({ monto: 5000, medio: 'efectivo' }), mov({ monto: 3000, medio: 'transferencia' })],
      '2026-08',
    )
    expect(resumen.porMedio).toEqual({ efectivo: 5000, transferencia: 3000 })
  })
})

describe('categoriaDe', () => {
  it('un movimiento sin categoría reconocida es "Por revisar", nunca "otros"', () => {
    const viejo = { ...mov({}), categoria: undefined } as unknown as FinanceMovimiento
    expect(categoriaDe(viejo)).toBeNull()
  })

  it('migra el valor heredado "otros" (Sprint 004) a "Por revisar"', () => {
    const heredado = { ...mov({}), categoria: 'otros' } as unknown as FinanceMovimiento
    expect(categoriaDe(heredado)).toBeNull()
  })
})

describe('formatearMonto', () => {
  it('redondea a pesos enteros', () => {
    expect(formatearMonto(1250.5)).toBe('$1.251')
  })
})
