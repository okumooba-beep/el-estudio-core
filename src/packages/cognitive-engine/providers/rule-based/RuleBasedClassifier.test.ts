import { describe, expect, it } from 'vitest'
import { RuleBasedClassifier } from './RuleBasedClassifier'

describe('RuleBasedClassifier', () => {
  const classifier = new RuleBasedClassifier()

  it('classifies a known keyword to its rule destino', () => {
    const result = classifier.classify('Tengo que ir a Tribunales mañana')
    expect(result.destino).toBe('misiones')
    expect(result.reason).toEqual({ kind: 'regla', ruleId: 'mision-tribunales', keyword: 'tribunales' })
  })

  it('defaults to "hoy" with sin-coincidencia when nothing matches', () => {
    const result = classifier.classify('una idea cualquiera sin palabra clave')
    expect(result.destino).toBe('hoy')
    expect(result.reason).toEqual({ kind: 'sin-coincidencia' })
  })
})
