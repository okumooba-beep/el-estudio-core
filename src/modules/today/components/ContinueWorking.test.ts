import { describe, expect, it } from 'vitest'
import { selectContinueWorking } from './ContinueWorking'
import type { Idea } from '@/types/idea'
import type { HistoryEntry } from '@world/studio/furniture'

function idea(over: Partial<Idea> & { history: readonly HistoryEntry[] }): Idea {
  return {
    id: 'x', texto: 't', fecha: '2026-07-31', hora: '12:00',
    destino: 'finanzas', origen: 'hoy', estado: null, currentFurniture: 'finanzas',
    createdAt: '2026-07-31T12:00:00.000Z', updatedAt: '2026-07-31T12:00:00.000Z',
    pendingSync: false, ...over,
  }
}

const nace: HistoryEntry = { evento: 'creada', furniture: 'escritorio', fecha: '2026-07-31T12:00:00.000Z' }
const mudanza = (fecha: string): HistoryEntry => ({ evento: 'movida', furniture: 'finanzas', fecha })

/**
 * Contrato del Umbral §7 aplicado al Escritorio: archivar una captura
 * no es haberla trabajado, así que no puede volver como "¿Continuamos?".
 */
describe('selectContinueWorking', () => {
  it('no ofrece continuar con una hoja que el Umbral acaba de archivar', () => {
    expect(selectContinueWorking([idea({ history: [nace, mudanza('2026-07-31T12:00:01.000Z')] })])).toBeNull()
  })

  it('ofrece una hoja que el usuario movió después de que aterrizara', () => {
    const trabajada = idea({
      id: 'trabajada',
      history: [nace, mudanza('2026-07-31T12:00:01.000Z'), mudanza('2026-07-31T15:00:00.000Z')],
    })
    expect(selectContinueWorking([trabajada])?.id).toBe('trabajada')
  })

  it('sigue ignorando el Escritorio, el Archivo y lo terminado', () => {
    const tres = [nace, mudanza('2026-07-31T12:00:01.000Z'), mudanza('2026-07-31T15:00:00.000Z')]
    expect(selectContinueWorking([idea({ destino: 'hoy', history: tres })])).toBeNull()
    expect(selectContinueWorking([idea({ destino: 'archivo', history: tres })])).toBeNull()
    expect(selectContinueWorking([idea({ estado: 'terminada', history: tres })])).toBeNull()
  })
})
