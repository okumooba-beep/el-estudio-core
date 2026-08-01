import { describe, expect, it } from 'vitest'
import { selectContinueWorking } from './ContinueWorking'
import type { Idea } from '@/types/idea'
import type { HistoryEntry } from '@world/studio/furniture'

/**
 * El historial de estos fixtures replica el que arma
 * `ideaRepository.create()`: toda hoja nace con DOS entradas 'creada',
 * porque el diario registra cada hoja al nacer además del mueble donde
 * aterriza. La primera versión de estos tests las armaba con una sola y
 * por eso pasaban en verde mientras la app real fallaba — los fixtures
 * codificaban la suposición en vez del dato. Si `create()` cambia el
 * shape, `nace()` es el único lugar que hay que tocar.
 */
const nace = (): HistoryEntry[] => [
  { evento: 'creada', furniture: 'diario', fecha: '2026-07-31T12:00:00.000Z' },
  { evento: 'creada', furniture: 'escritorio', fecha: '2026-07-31T12:00:00.000Z' },
]

const mudanza = (fecha: string): HistoryEntry => ({ evento: 'movida', furniture: 'finanzas', fecha })

function idea(over: Partial<Idea> & { history: readonly HistoryEntry[] }): Idea {
  return {
    id: 'x', texto: 't', fecha: '2026-07-31', hora: '12:00',
    destino: 'finanzas', origen: 'hoy', estado: null, currentFurniture: 'finanzas',
    createdAt: '2026-07-31T12:00:00.000Z', updatedAt: '2026-07-31T12:00:00.000Z',
    pendingSync: false, ...over,
  }
}

const archivada = () => idea({ history: [...nace(), mudanza('2026-07-31T12:00:01.000Z')] })
const trabajada = (id = 'trabajada') =>
  idea({ id, history: [...nace(), mudanza('2026-07-31T12:00:01.000Z'), mudanza('2026-07-31T15:00:00.000Z')] })

/**
 * Contrato del Umbral §7 aplicado al Escritorio: archivar una captura no
 * es haberla trabajado, así que no puede volver como "¿Continuamos?".
 */
describe('selectContinueWorking', () => {
  it('no ofrece continuar con una hoja que el Umbral acaba de archivar', () => {
    expect(selectContinueWorking([archivada()])).toBeNull()
  })

  it('ofrece una hoja que se movió otra vez después de aterrizar', () => {
    expect(selectContinueWorking([trabajada()])?.id).toBe('trabajada')
  })

  it('ignora una hoja nacida dentro de un Espacio, sin mudanzas', () => {
    expect(selectContinueWorking([idea({ history: nace() })])).toBeNull()
  })

  it('cuenta mudanzas, no entradas: sumar una "creada" no la hace elegible', () => {
    const conTerceraCreada = idea({
      history: [
        ...nace(),
        { evento: 'creada', furniture: 'biblioteca', fecha: '2026-07-31T12:00:00.000Z' },
        mudanza('2026-07-31T12:00:01.000Z'),
      ],
    })
    expect(selectContinueWorking([conTerceraCreada])).toBeNull()
  })

  it('sigue ignorando el Escritorio, el Archivo y lo terminado', () => {
    expect(selectContinueWorking([{ ...trabajada(), destino: 'hoy' }])).toBeNull()
    expect(selectContinueWorking([{ ...trabajada(), destino: 'archivo' }])).toBeNull()
    expect(selectContinueWorking([{ ...trabajada(), estado: 'terminada' }])).toBeNull()
  })

  it('entre varias trabajadas, elige la más reciente', () => {
    const vieja = idea({
      id: 'vieja',
      updatedAt: '2026-07-30T09:00:00.000Z',
      history: [...nace(), mudanza('2026-07-29T10:00:00.000Z'), mudanza('2026-07-30T09:00:00.000Z')],
    })
    const nueva = { ...trabajada('nueva'), updatedAt: '2026-07-31T15:00:00.000Z' }
    expect(selectContinueWorking([vieja, nueva])?.id).toBe('nueva')
  })
})
