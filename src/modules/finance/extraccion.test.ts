import { describe, expect, it } from 'vitest'
import { extraerCategoria, extraerMonto, extraerMovimiento, extraerTipo } from './extraccion'

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

  it('lo que no reconoce cae en otros, marcado como inseguro', () => {
    const resultado = extraerCategoria('Le di plata a mi primo')
    expect(resultado.categoria).toBe('otros')
    expect(resultado.segura).toBe(false)
  })
})

describe('extraerMovimiento', () => {
  it('resuelve las tres cosas de una sola pasada', () => {
    expect(extraerMovimiento('Gasté 80k en gasolina')).toEqual({
      monto: 80_000, tipo: 'egreso', categoria: 'auto', categoriaSegura: true,
    })
  })

  it('un ingreso sin categoría reconocible sigue siendo un movimiento válido', () => {
    const resultado = extraerMovimiento('Cobré 250k del trabajo de Juan')
    expect(resultado).toEqual({ monto: 250_000, tipo: 'ingreso', categoria: 'otros', categoriaSegura: false })
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
