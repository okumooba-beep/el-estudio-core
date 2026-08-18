import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Sprint 027 — prueba la migración v13 (backfill de Finanzas) contra una
 * base real que ya tiene datos "de antes de Sprint 025", sin inventar el
 * escenario: arma la base a mano en una versión previa (como si fuera un
 * usuario real) y recién ahí abre `db.ts`, para que Dexie dispare
 * `.upgrade()` de verdad — no alcanza con importar el módulo en una base
 * vacía, ahí nunca cruza la versión y el upgrade no corre.
 */
describe('migración v13: backfill de categoría en financeMovimientos', () => {
  afterEach(async () => {
    await Dexie.delete('lifeos')
  })

  it('corrige lo mal categorizado, deja intacto lo correcto y lo no reconocible, y es idempotente', async () => {
    const previa = new Dexie('lifeos')
    previa.version(10).stores({
      financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio',
    })
    await previa.open()
    const ahora = new Date().toISOString()
    await previa.table('financeMovimientos').bulkAdd([
      {
        id: 'ropa-1',
        tipo: 'egreso',
        monto: 87_000,
        concepto: 'Gaste 87k en Ropa (le uthe) - 3 cuotas sin intereses',
        categoria: 'servicios',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-01-10',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: false,
      },
      {
        id: 'auto-1',
        tipo: 'egreso',
        monto: 30_000,
        concepto: 'Gaste 30k en arreglo de focos delantero auto',
        categoria: 'servicios',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-01-11',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: false,
      },
      {
        // Sin palabra reconocible por el léxico: debe quedar sin tocar, no adivinar.
        id: 'sin-lexico-1',
        tipo: 'egreso',
        monto: 33_000,
        concepto: 'Gaste 33k en merienda',
        categoria: 'servicios',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-01-12',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: false,
      },
      {
        // Servicios real: no debe cambiar.
        id: 'servicios-real-1',
        tipo: 'egreso',
        monto: 15_000,
        concepto: 'Pagué el gas',
        categoria: 'servicios',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-01-13',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: false,
      },
      {
        // Sprint 026: corrección manual previa a 'ropa' desde un concepto
        // que el léxico no reconocería — nunca debe pisarse, ya no dice 'servicios'.
        id: 'corregido-manual-1',
        tipo: 'egreso',
        monto: 50_000,
        concepto: 'Gasto varios de la semana',
        categoria: 'ropa',
        moneda: 'ars',
        medio: 'transferencia',
        fecha: '2026-01-14',
        createdAt: ahora,
        updatedAt: ahora,
        pendingSync: false,
      },
    ])
    previa.close()

    const { db } = await import('./db')
    await db.open()

    const ropa = await db.financeMovimientos.get('ropa-1')
    const auto = await db.financeMovimientos.get('auto-1')
    const sinLexico = await db.financeMovimientos.get('sin-lexico-1')
    const servicioReal = await db.financeMovimientos.get('servicios-real-1')
    const corregidoManual = await db.financeMovimientos.get('corregido-manual-1')

    expect(ropa?.categoria).toBe('ropa')
    expect(auto?.categoria).toBe('auto')
    // 'merienda' SÍ está en el léxico actual (Sprint 027) → se corrige a 'comida'.
    expect(sinLexico?.categoria).toBe('comida')
    expect(servicioReal?.categoria).toBe('servicios')
    expect(corregidoManual?.categoria).toBe('ropa')

    // Nada de monto/fecha/concepto/moneda/id se tocó.
    expect(ropa?.monto).toBe(87_000)
    expect(ropa?.fecha).toBe('2026-01-10')
    expect(ropa?.concepto).toBe('Gaste 87k en Ropa (le uthe) - 3 cuotas sin intereses')
    expect(ropa?.moneda).toBe('ars')

    const totalAntes = await db.financeMovimientos.count()

    // Idempotencia: cerrar y volver a abrir no debe re-modificar ni duplicar nada.
    db.close()
    await db.open()
    const totalDespues = await db.financeMovimientos.count()
    const ropaReabierta = await db.financeMovimientos.get('ropa-1')

    expect(totalDespues).toBe(totalAntes)
    expect(ropaReabierta?.categoria).toBe('ropa')
  })
})
