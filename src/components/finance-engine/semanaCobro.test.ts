import { describe, expect, it } from 'vitest'
import { etiquetaSemanaCobro, fechaEnSemana, mondayOf, normalizarSemana, sundayOf } from './semanaCobro'

describe('mondayOf / sundayOf', () => {
  it('un lunes es el lunes de su propia semana', () => {
    expect(mondayOf('2026-08-24')).toBe('2026-08-24')
    expect(sundayOf('2026-08-24')).toBe('2026-08-30')
  })

  it('un domingo pertenece a la semana que empezó el lunes anterior', () => {
    expect(mondayOf('2026-08-30')).toBe('2026-08-24')
    expect(sundayOf('2026-08-30')).toBe('2026-08-30')
  })

  it('un día cualquiera en el medio de la semana se normaliza igual', () => {
    expect(mondayOf('2026-08-27')).toBe('2026-08-24')
    expect(sundayOf('2026-08-27')).toBe('2026-08-30')
  })

  it('una semana que cruza de mes (27 jul → 2 ago) sigue siendo una sola semana', () => {
    expect(mondayOf('2026-07-30')).toBe('2026-07-27')
    expect(sundayOf('2026-07-30')).toBe('2026-08-02')
    expect(mondayOf('2026-08-01')).toBe('2026-07-27')
    expect(sundayOf('2026-08-01')).toBe('2026-08-02')
  })

  it('una semana que cruza de año se calcula igual', () => {
    expect(mondayOf('2026-01-01')).toBe('2025-12-29')
    expect(sundayOf('2026-01-01')).toBe('2026-01-04')
  })
})

describe('normalizarSemana', () => {
  it('cualquier fecha elegida se normaliza al lunes→domingo real que la contiene', () => {
    expect(normalizarSemana('2026-08-27')).toEqual({ fechaInicio: '2026-08-24', fechaFin: '2026-08-30' })
  })

  it('elegir cualquier día de una misma semana da siempre el mismo resultado (una semana = una identidad)', () => {
    const lunes = normalizarSemana('2026-08-24')
    const miercoles = normalizarSemana('2026-08-26')
    const domingo = normalizarSemana('2026-08-30')
    expect(lunes).toEqual(miercoles)
    expect(miercoles).toEqual(domingo)
  })
})

describe('etiquetaSemanaCobro', () => {
  it('semana dentro de un mismo mes: "24 → 30 ago"', () => {
    expect(etiquetaSemanaCobro('2026-08-24', '2026-08-30')).toBe('24 → 30 ago')
  })

  it('semana que cruza de mes: "27 jul → 2 ago"', () => {
    expect(etiquetaSemanaCobro('2026-07-27', '2026-08-02')).toBe('27 jul → 2 ago')
  })
})

describe('fechaEnSemana', () => {
  it('es true para fechas dentro del rango, incluyendo los bordes', () => {
    expect(fechaEnSemana('2026-08-24', '2026-08-24', '2026-08-30')).toBe(true)
    expect(fechaEnSemana('2026-08-27', '2026-08-24', '2026-08-30')).toBe(true)
    expect(fechaEnSemana('2026-08-30', '2026-08-24', '2026-08-30')).toBe(true)
  })

  it('es false para fechas fuera del rango', () => {
    expect(fechaEnSemana('2026-08-23', '2026-08-24', '2026-08-30')).toBe(false)
    expect(fechaEnSemana('2026-08-31', '2026-08-24', '2026-08-30')).toBe(false)
  })
})
