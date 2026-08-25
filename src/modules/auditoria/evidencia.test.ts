import { describe, expect, it } from 'vitest'
import { calcularEvidencia } from './evidencia'
import type { AgendaBloque } from '@/types/agenda'
import type { AuditConfig } from '@/types/auditoria'
import type { Idea } from '@/types/idea'

const AHORA = '2026-08-17T00:00:00.000Z'

function bloque(overrides: Partial<AgendaBloque> & Pick<AgendaBloque, 'id' | 'dia'>): AgendaBloque {
  return {
    texto: 'Bloque',
    hora: null,
    alarma: false,
    completado: false,
    archivado: false,
    createdAt: AHORA,
    updatedAt: AHORA,
    pendingSync: false,
    ...overrides,
  }
}

function idea(overrides: Partial<Idea> & Pick<Idea, 'id'>): Idea {
  return {
    texto: 'Idea',
    fecha: '2026-08-17',
    hora: '',
    destino: 'misiones',
    origen: 'misiones',
    estado: 'pendiente',
    currentFurniture: 'tablero',
    history: [],
    createdAt: AHORA,
    updatedAt: AHORA,
    pendingSync: false,
    ...overrides,
  }
}

const CONFIG: AuditConfig = {
  id: 'config',
  resultadoDominante: 'Construir evidencia de mi sistema de trading',
  rutinasReconocidas: [
    { etiqueta: 'NY SESSION', patron: 'sesión ny' },
    { etiqueta: 'BACKTESTING', patron: 'backtesting' },
  ],
  señalRoja: { condicion: 'x', respuesta: 'y' },
  createdAt: AHORA,
  updatedAt: AHORA,
  pendingSync: false,
}

const DIAS = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23']

describe('calcularEvidencia', () => {
  it('nunca es "cuán ocupado estuve": ignora bloques no protegidos por completo', () => {
    const bloques = [bloque({ id: 'b1', dia: '2026-08-17', texto: 'Sesión NY 9 a 11', completado: true })]
    const evidencia = calcularEvidencia(DIAS, bloques, [], CONFIG, '2026-08-20')
    expect(evidencia.porRutina).toEqual([
      { etiqueta: 'NY SESSION', ejecutados: 0, planificados: 0 },
      { etiqueta: 'BACKTESTING', ejecutados: 0, planificados: 0 },
    ])
    expect(evidencia.horasProtegidas).toBe(0)
  })

  it('cuenta planificado-vs-ejecutado solo sobre bloques protegidos que matchean el patrón', () => {
    const bloques = [
      bloque({ id: 'b1', dia: '2026-08-17', texto: 'Sesión NY 9:00 a 11:00', protegido: true, completado: true }),
      bloque({ id: 'b2', dia: '2026-08-18', texto: 'Sesión NY 9:00 a 11:00', protegido: true, completado: false }),
      bloque({ id: 'b3', dia: '2026-08-19', texto: 'Backtesting 21:00 a 22:00', protegido: true, completado: true }),
      bloque({ id: 'b4', dia: '2026-08-20', texto: 'Gimnasio 7:00 a 8:00', protegido: true, completado: true }),
    ]
    const evidencia = calcularEvidencia(DIAS, bloques, [], CONFIG, '2026-08-20')
    expect(evidencia.porRutina).toEqual([
      { etiqueta: 'NY SESSION', ejecutados: 1, planificados: 2 },
      { etiqueta: 'BACKTESTING', ejecutados: 1, planificados: 1 },
    ])
    expect(evidencia.horasProtegidas).toBe(6)
    expect(evidencia.horasEjecutadas).toBe(4)
  })

  it('ignora bloques archivados y bloques fuera de los días pedidos', () => {
    const bloques = [
      bloque({ id: 'b1', dia: '2026-08-17', texto: 'Sesión NY 9:00 a 11:00', protegido: true, archivado: true }),
      bloque({ id: 'b2', dia: '2026-09-01', texto: 'Sesión NY 9:00 a 11:00', protegido: true }),
    ]
    const evidencia = calcularEvidencia(DIAS, bloques, [], CONFIG, '2026-08-20')
    expect(evidencia.porRutina[0]).toEqual({ etiqueta: 'NY SESSION', ejecutados: 0, planificados: 0 })
  })

  it('cuenta misiones programadas en la semana usando estado completada/terminada, nunca actividad cruda', () => {
    const ideas = [
      idea({ id: 'm1', destino: 'misiones', programadaFecha: '2026-08-18', estado: 'completada' }),
      idea({ id: 'm2', destino: 'misiones', programadaFecha: '2026-08-19', estado: 'terminada' }),
      idea({ id: 'm3', destino: 'misiones', programadaFecha: '2026-08-20', estado: 'pendiente' }),
      idea({ id: 'm4', destino: 'misiones', programadaFecha: '2026-09-01', estado: 'completada' }),
      idea({ id: 'm5', destino: 'agenda', programadaFecha: '2026-08-18', estado: 'completada' }),
    ]
    const evidencia = calcularEvidencia(DIAS, [], ideas, CONFIG, '2026-08-20')
    expect(evidencia.misionesProgramadas).toBe(3)
    expect(evidencia.misionesCompletadas).toBe(2)
  })

  it('cuenta como omitido un bloque protegido de un día ya pasado que nunca se completó', () => {
    const bloques = [
      bloque({ id: 'b1', dia: '2026-08-17', protegido: true, completado: false }),
      bloque({ id: 'b2', dia: '2026-08-18', protegido: true, completado: true }),
      bloque({ id: 'b3', dia: '2026-08-23', protegido: true, completado: false }),
    ]
    const evidencia = calcularEvidencia(DIAS, bloques, [], CONFIG, '2026-08-20')
    expect(evidencia.bloquesOmitidos).toBe(1)
  })
})
