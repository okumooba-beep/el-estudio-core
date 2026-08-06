import { describe, expect, it } from 'vitest'
import { extraerCategoria, extraerMedio, extraerMonto, extraerMontos, extraerMovimiento, extraerTipo } from './extraccion'

describe('extraerMonto', () => {
  it.each([
    ['Gasté 80k en gasolina', 80_000],
    ['Gasté $35.000 en el súper', 35_000],
    ['Pagué 12 mil de expensas', 12_000],
    ['Me costó 2 lucas', 2_000],
    ['Compré proteína $48.000', 48_000],
    ['Descontar a César 17k de su factura', 17_000],
    ['Invertí 1.5 palos', 1_500_000],
    ['Salió 1.250,50', 1_250.5],
    ['Pagué 300 dólares', 300],
  ])('%s → %i', (texto, esperado) => {
    expect(extraerMonto(texto)).toBe(esperado)
  })

  it('nunca inventa un monto cuando el texto no trae número', () => {
    expect(extraerMonto('Gasté plata en el súper')).toBeNull()
  })
})

describe('extraerTipo', () => {
  it.each([
    ['Cobré el trabajo de Juan', 'ingreso'],
    ['Me pagaron la factura', 'ingreso'],
    ['Gasté 80k en gasolina', 'egreso'],
    ['Pagué internet', 'egreso'],
  ])('%s → %s', (texto, esperado) => {
    expect(extraerTipo(texto)).toBe(esperado)
  })
})

describe('extraerCategoria', () => {
  it.each([
    ['Gasté 80k en gasolina', 'auto'],
    ['Cambio de aceite del Jeep', 'auto'],
    ['Compré en el súper', 'comida'],
    ['Pagué la farmacia', 'salud'],
    ['Pagué internet', 'servicios'],
    ['Renové Netflix', 'suscripciones'],
    ['Pagué el alquiler', 'alquiler'],
    ['Salida al cine', 'ocio'],
    ['Invertí en cedears', 'inversion'],
    ['Guardé para el ahorro', 'ahorro'],
  ])('%s → %s', (texto, esperado) => {
    expect(extraerCategoria(texto).categoria).toBe(esperado)
  })

  it('lo que no reconoce pasa a "Por revisar" (null), marcado como inseguro', () => {
    const resultado = extraerCategoria('Le di plata a mi primo')
    expect(resultado.categoria).toBeNull()
    expect(resultado.segura).toBe(false)
  })
})

describe('extraerMovimiento', () => {
  it('resuelve todo de una sola pasada', () => {
    expect(extraerMovimiento('Gasté 80k en gasolina en efectivo')).toEqual({
      montos: [{ monto: 80_000, moneda: 'ars' }],
      tipo: 'egreso', medio: 'efectivo', categoria: 'auto', categoriaSegura: true,
    })
  })

  it('un ingreso sin categoría reconocible sigue siendo un movimiento válido', () => {
    expect(extraerMovimiento('Cobré 250k del trabajo de Juan')).toMatchObject({
      montos: [{ monto: 250_000, moneda: 'ars' }], tipo: 'ingreso', categoria: null,
    })
  })
})

/**
 * Monedas y medios (Sprint 006). El caso que lo motivó: una sola línea
 * con pesos y dólares mezclados.
 */
describe('monedas', () => {
  it('separa pesos de dólares en la misma línea', () => {
    expect(extraerMontos('Ingreso de agosto = 1.090.000 + 200 usd')).toEqual([
      { monto: 1_090_000, moneda: 'ars' },
      { monto: 200, moneda: 'usd' },
    ])
  })

  it('un $ suelto es peso, no dólar', () => {
    expect(extraerMontos('Gasté 5.000$')[0]).toEqual({ monto: 5_000, moneda: 'ars' })
  })

  it.each([['u$s 300'], ['300 dólares'], ['US$ 300']])('%s es dólar', (texto) => {
    expect(extraerMontos(texto)[0]?.moneda).toBe('usd')
  })
})

describe('extraerMedio', () => {
  it.each([
    ['Pagué 5k en efectivo', 'efectivo'],
    ['Transferencia de 20k a Juan', 'transferencia'],
    ['Pagué con Mercado Pago', 'transferencia'],
    ['Gasté 10k en el súper', 'transferencia'],
  ])('%s → %s', (texto, esperado) => {
    expect(extraerMedio(texto)).toBe(esperado)
  })
})

/**
 * Casos traídos del uso real, no inventados: cada uno es una captura
 * que quedó varada en el Umbral por no tener una señal reconocible.
 */
describe('formas de escribir plata que aparecieron usándolo', () => {
  it('miles con puntos y sin moneda', () => {
    expect(extraerMonto('Ingreso primera semana de agosto = 1.090.000')).toBe(1_090_000)
  })

  it('el signo pospuesto', () => {
    expect(extraerMonto('Me quedaron 200$ en efectivo')).toBe(200)
  })

  it('"Ingreso" sin verbo conjugado sigue siendo dinero que entra', () => {
    expect(extraerTipo('Ingreso primera semana de agosto = 1.090.000')).toBe('ingreso')
  })

  it('un sueldo es un ingreso aunque no diga "cobré"', () => {
    expect(extraerTipo('Sueldo de agosto 900.000')).toBe('ingreso')
  })
})
