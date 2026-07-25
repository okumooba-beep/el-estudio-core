import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { ideaRepository } from './ideaRepository'

describe('ideaRepository (Repository<Idea> contract)', () => {
  it('an idea added is returned by list() with the SyncableEntity shape', async () => {
    const texto = `idea de prueba ${crypto.randomUUID()}`

    const added = await ideaRepository.add(texto)
    const ideas = await ideaRepository.list()
    const found = ideas.find((idea) => idea.id === added.id)

    expect(found).toBeDefined()
    expect(found?.texto).toBe(texto)
    expect(found?.pendingSync).toBe(true)
    expect(typeof found?.updatedAt).toBe('string')
  })
})
