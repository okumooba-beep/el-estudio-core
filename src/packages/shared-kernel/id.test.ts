import { describe, expect, it } from 'vitest'
import { generateId } from './id'

describe('generateId', () => {
  it('returns a UUID v4-shaped string', () => {
    expect(generateId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('returns a different value on each call', () => {
    expect(generateId()).not.toBe(generateId())
  })
})
