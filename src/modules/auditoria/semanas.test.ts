import { describe, expect, it } from 'vitest'
import { mondayOf, weekDays, semanaDesplazada } from './semanas'

describe('mondayOf', () => {
  it('devuelve el mismo lunes cuando la fecha ya es lunes', () => {
    expect(mondayOf('2026-08-17')).toBe('2026-08-17')
  })

  it('retrocede hasta el lunes cuando la fecha cae a mitad de semana', () => {
    expect(mondayOf('2026-08-20')).toBe('2026-08-17')
  })

  it('retrocede hasta el lunes cuando la fecha es domingo', () => {
    expect(mondayOf('2026-08-23')).toBe('2026-08-17')
  })
})

describe('weekDays', () => {
  it('devuelve los 7 días de lunes a domingo a partir del lunes', () => {
    expect(weekDays('2026-08-17')).toEqual([
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
      '2026-08-21',
      '2026-08-22',
      '2026-08-23',
    ])
  })
})

describe('semanaDesplazada', () => {
  it('retrocede una semana entera con desplazamiento -1', () => {
    expect(semanaDesplazada('2026-08-17', -1)).toBe('2026-08-10')
  })

  it('avanza una semana entera con desplazamiento 1', () => {
    expect(semanaDesplazada('2026-08-17', 1)).toBe('2026-08-24')
  })

  it('desplazamiento 0 devuelve la misma semana', () => {
    expect(semanaDesplazada('2026-08-17', 0)).toBe('2026-08-17')
  })
})
