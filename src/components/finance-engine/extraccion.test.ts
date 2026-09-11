import { describe, expect, it } from 'vitest'
import {
  dividirEnCuotas,
  extraerCategoria,
  extraerCuotas,
  extraerMedio,
  extraerMonto,
  extraerMontos,
  extraerMovimiento,
  extraerTipo,
  fechaCuota,
} from './extraccion'

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

  /**
   * Sprint 025: "gasté"/"gasto" contienen la substring 'gas' (palabra
   * clave de servicios) — antes de la coincidencia por borde de palabra
   * esto ganaba de mano a la categoría real en cualquier frase que
   * empezara con ese verbo, sin importar de qué se tratara el gasto.
   */
  it.each([
    ['Gasté 30k en arreglo de focos delanteros del auto', 'auto'],
    ['Gasté 87k en ropa', 'ropa'],
    ['Gasto de zapatillas nuevas', 'ropa'],
    ['Gasté 15k en el cine', 'ocio'],
    ['Gasté 20k en el gimnasio', 'ocio'],
  ])('%s → %s (no cae en servicios por "gas")', (texto, esperado) => {
    expect(extraerCategoria(texto).categoria).toBe(esperado)
  })

  it('"gas" como palabra real sigue siendo servicios', () => {
    expect(extraerCategoria('Pagué el gas').categoria).toBe('servicios')
  })

  it('café no se rompe por el borde de palabra con tilde', () => {
    expect(extraerCategoria('Un café con amigos').categoria).toBe('comida')
  })

  /**
   * Sprint 027: casos reales de producción que quedaban en "Por revisar"
   * (o, antes de Sprint 025, en Servicios por la colisión de "gas") porque
   * 'merienda' faltaba en el léxico pese a estar las otras tres comidas.
   */
  it.each([
    ['Gaste 33k en merienda', 'comida'],
    ['Gaste 17k merienda', 'comida'],
  ])('%s → %s', (texto, esperado) => {
    expect(extraerCategoria(texto).categoria).toBe(esperado)
  })
})

describe('extraerMovimiento', () => {
  it('resuelve todo de una sola pasada', () => {
    expect(extraerMovimiento('Gasté 80k en gasolina en efectivo')).toEqual({
      montos: [{ monto: 80_000, moneda: 'ars', medio: 'efectivo' }],
      tipo: 'egreso', medio: 'efectivo', categoria: 'auto', categoriaSegura: true, cuotas: null,
    })
  })

  it('un ingreso sin categoría reconocible sigue siendo un movimiento válido', () => {
    expect(extraerMovimiento('Cobré 250k del trabajo de Juan')).toMatchObject({
      montos: [{ monto: 250_000, moneda: 'ars' }], tipo: 'ingreso', categoria: null,
    })
  })

  it('reconoce las cuotas de una compra financiada', () => {
    expect(extraerMovimiento('Gaste 87k en Ropa - 3 cuotas sin intereses')).toMatchObject({
      montos: [{ monto: 87_000, moneda: 'ars' }], categoria: 'ropa', cuotas: 3,
    })
  })

  it('un ingreso nunca reconoce cuotas, aunque el texto las mencione', () => {
    expect(extraerMovimiento('Cobré 3 cuotas de un préstamo que hice')).toMatchObject({ tipo: 'ingreso', cuotas: null })
  })
})

/** Sprint 028 — "N cuotas" (§5 del brief). */
describe('extraerCuotas', () => {
  it.each([
    ['3 cuotas', 3],
    ['3 cuotas sin intereses', 3],
    ['en 3 cuotas', 3],
    ['3 cuotas s/i', 3],
    ['12 cuotas', 12],
  ])('%s → %i', (texto, esperado) => {
    expect(extraerCuotas(texto)).toBe(esperado)
  })

  it('sin mención de cuotas, no hay serie', () => {
    expect(extraerCuotas('Gasté 80k en gasolina')).toBeNull()
  })

  it('"una cuota" no arma una serie: es un movimiento normal', () => {
    expect(extraerCuotas('Gaste 20k en una cuota del gimnasio')).toBeNull()
  })

  it('no toma un número arbitrario del concepto como cantidad de cuotas', () => {
    expect(extraerCuotas('Compré 3 remeras por 20k')).toBeNull()
  })
})

/** Sprint 028 — dividir el total sin perder centavos (§6 del brief). */
describe('dividirEnCuotas', () => {
  it('87.000 en 3 cuotas da tres cuotas iguales que suman el total exacto', () => {
    const cuotas = dividirEnCuotas(87_000, 3)
    expect(cuotas).toEqual([29_000, 29_000, 29_000])
    expect(cuotas.reduce((suma, cuota) => suma + cuota, 0)).toBe(87_000)
  })

  it('cuando no divide exacto, el resto se reparte sin perder ni sumar de más', () => {
    const cuotas = dividirEnCuotas(100, 3)
    expect(cuotas).toEqual([33.34, 33.33, 33.33])
    expect(Math.round(cuotas.reduce((suma, cuota) => suma + cuota, 0) * 100) / 100).toBe(100)
  })
})

/** Sprint 028 — regla temporal de cuotas (§3 del brief). */
describe('fechaCuota', () => {
  it('mismo día, un mes después por cada cuota', () => {
    expect(fechaCuota('2026-08-17', 0)).toBe('2026-08-17')
    expect(fechaCuota('2026-08-17', 1)).toBe('2026-09-17')
    expect(fechaCuota('2026-08-17', 2)).toBe('2026-10-17')
  })

  it('cuando el día no existe en el mes destino, usa el último día válido', () => {
    expect(fechaCuota('2026-01-31', 0)).toBe('2026-01-31')
    expect(fechaCuota('2026-01-31', 1)).toBe('2026-02-28')
    expect(fechaCuota('2026-01-31', 2)).toBe('2026-03-31')
  })

  it('cruza el año cuando la cuota cae en enero', () => {
    expect(fechaCuota('2026-11-15', 2)).toBe('2027-01-15')
  })
})

/**
 * Monedas y medios (Sprint 006). El caso que lo motivó: una sola línea
 * con pesos y dólares mezclados.
 */
describe('monedas', () => {
  it('separa pesos de dólares en la misma línea', () => {
    expect(extraerMontos('Ingreso de agosto = 1.090.000 + 200 usd')).toEqual([
      { monto: 1_090_000, moneda: 'ars', medio: null },
      { monto: 200, moneda: 'usd', medio: null },
    ])
  })

  it('un $ suelto es peso, no dólar', () => {
    expect(extraerMontos('Gasté 5.000$')[0]).toEqual({ monto: 5_000, moneda: 'ars', medio: null })
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
