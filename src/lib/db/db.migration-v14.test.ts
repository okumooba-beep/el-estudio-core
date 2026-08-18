import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Sprint 028 — v14 solo agrega el índice `compraId` a financeMovimientos,
 * sin `.upgrade()`: no hay datos que migrar (§14 del brief — "las cuotas
 * se aplican únicamente a operaciones nuevas"). Esta prueba confirma las
 * dos mitades de esa promesa: (1) un movimiento de antes de este sprint
 * cruza la versión intacto, sin que nadie le invente un `compraId`, y
 * (2) el índice nuevo funciona de verdad para una compra en cuotas real.
 */
describe('migración v14: índice compraId en financeMovimientos', () => {
  afterEach(async () => {
    await Dexie.delete('lifeos')
  })

  it('un movimiento histórico sin compraId cruza intacto, y el índice nuevo sirve para agrupar cuotas', async () => {
    const previa = new Dexie('lifeos')
    previa.version(13).stores({
      financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio',
    })
    await previa.open()
    const ahora = new Date().toISOString()
    await previa.table('financeMovimientos').add({
      id: 'historico-1',
      tipo: 'egreso',
      monto: 45_000,
      concepto: 'Gasté 45k en supermercado',
      categoria: 'comida',
      moneda: 'ars',
      medio: 'transferencia',
      fecha: '2026-06-01',
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    previa.close()

    const { db } = await import('./db')
    await db.open()

    const historico = await db.financeMovimientos.get('historico-1')
    expect(historico?.categoria).toBe('comida')
    expect(historico?.monto).toBe(45_000)
    expect(historico?.compraId).toBeUndefined()

    // El índice nuevo: tres cuotas de la misma compra, encontrables por compraId.
    await db.financeMovimientos.bulkAdd([
      {
        id: 'cuota-1',
        tipo: 'egreso',
        monto: 29_000,
        concepto: 'Gaste 87k en Ropa - 3 cuotas sin intereses',
        categoria: 'ropa',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-08-17',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: true,
        compraId: 'compra-1',
        cuotaNumero: 1,
        cuotaTotal: 3,
        montoOriginal: 87_000,
      },
      {
        id: 'cuota-2',
        tipo: 'egreso',
        monto: 29_000,
        concepto: 'Gaste 87k en Ropa - 3 cuotas sin intereses',
        categoria: 'ropa',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-09-17',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: true,
        compraId: 'compra-1',
        cuotaNumero: 2,
        cuotaTotal: 3,
        montoOriginal: 87_000,
      },
      {
        id: 'cuota-3',
        tipo: 'egreso',
        monto: 29_000,
        concepto: 'Gaste 87k en Ropa - 3 cuotas sin intereses',
        categoria: 'ropa',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-10-17',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: true,
        compraId: 'compra-1',
        cuotaNumero: 3,
        cuotaTotal: 3,
        montoOriginal: 87_000,
      },
    ])

    const hermanas = await db.financeMovimientos.where('compraId').equals('compra-1').toArray()
    expect(hermanas).toHaveLength(3)
    expect(hermanas.reduce((suma, cuota) => suma + cuota.monto, 0)).toBe(87_000)

    // Idempotencia: cerrar y reabrir no toca lo histórico ni duplica nada.
    const totalAntes = await db.financeMovimientos.count()
    db.close()
    await db.open()
    const totalDespues = await db.financeMovimientos.count()
    expect(totalDespues).toBe(totalAntes)
    expect((await db.financeMovimientos.get('historico-1'))?.compraId).toBeUndefined()
  })
})
