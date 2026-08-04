import { describe, expect, it } from 'vitest'
import { RuleBasedClassifier } from '@cognitive-engine/providers/rule-based/RuleBasedClassifier'
import { extraerMovimiento } from './extraccion'

/**
 * La captura exacta que quedó varada en el Umbral durante el uso real,
 * de punta a punta: el clasificador tiene que mandarla a Finanzas y el
 * motor tiene que sacarle el monto. Las dos mitades fallaban.
 */
describe('el ingreso semanal, de punta a punta', () => {
  const texto = 'Ingreso primera semana de agosto = 1.090.000 + 200$ Efectivo'

  it('el Umbral lo manda a Finanzas con confianza alta', () => {
    const resultado = new RuleBasedClassifier().classify(texto)
    expect(resultado.destino).toBe('finanzas')
    expect(resultado.nivel).toBe('alta')
  })

  it('el motor lo lee como un ingreso de 1.090.000', () => {
    expect(extraerMovimiento(texto)).toMatchObject({ monto: 1_090_000, tipo: 'ingreso' })
  })
})
