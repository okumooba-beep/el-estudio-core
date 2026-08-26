import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Sprint 040 — "Reset completo de Finanzas". v18 vacía las cuatro tablas
 * exclusivas de Finanzas (financeAccounts, financeMovimientos,
 * financeGoals, financeIncomePeriods) sin tocar ninguna otra tabla de la
 * base (ver db.ts). Mismo patrón de réplica acotada que
 * db.migration-v14/v16.test.ts: la `previa` declara el esquema final
 * anterior a v18 en un único `.version()` (una base fresca no repite los
 * `.upgrade()` de versiones intermedias), y la `acotada` agrega v18
 * encima para forzar a Dexie a correr ese upgrade de verdad sobre datos
 * ya existentes.
 *
 * Esta prueba confirma las dos mitades de la promesa del Sprint 040:
 * (1) las cuatro tablas de Finanzas quedan vacías tras el reset, y (2)
 * una tabla ajena (`ideas`, capturada por Umbral/Cuaderno/Misiones/
 * Biblioteca) cruza la versión completamente intacta.
 */
describe('migración v18: reset completo de Finanzas', () => {
  afterEach(async () => {
    await Dexie.delete('lifeos')
  })

  it('vacía las cuatro tablas de Finanzas y deja el resto de la base intacto', async () => {
    const previa = new Dexie('lifeos')
    previa.version(17).stores({
      ideas: 'id, createdAt, destino',
      financeAccounts: 'id, createdAt',
      financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio, compraId, periodoId',
      financeGoals: 'id, createdAt',
      financeIncomePeriods: 'id, createdAt, orden, fechaInicio',
    })
    await previa.open()
    const ahora = new Date().toISOString()

    await previa.table('ideas').add({
      id: 'idea-historica',
      texto: 'Ver documental de trading',
      fecha: '2026-08-20',
      hora: '21:00',
      destino: 'biblioteca',
      origen: 'hoy',
      estado: null,
      currentFurniture: 'biblioteca',
      history: [],
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    await previa.table('financeAccounts').add({
      id: 'cuenta-1',
      nombre: 'Efectivo',
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    await previa.table('financeGoals').add({
      id: 'meta-1',
      nombre: 'Fondo de emergencia',
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    const periodoId = 'periodo-1'
    await previa.table('financeIncomePeriods').add({
      id: periodoId,
      nombre: '17 → 23 ago',
      fechaInicio: '2026-08-17',
      fechaFin: '2026-08-23',
      orden: 0,
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    await previa.table('financeMovimientos').add({
      id: 'mov-1',
      tipo: 'ingreso',
      monto: 500_000,
      moneda: 'ars',
      medio: 'efectivo',
      concepto: 'Sueldo',
      categoria: null,
      fecha: '2026-08-18',
      periodoId,
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    previa.close()

    const acotada = new Dexie('lifeos')
    acotada.version(17).stores({
      ideas: 'id, createdAt, destino',
      financeAccounts: 'id, createdAt',
      financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio, compraId, periodoId',
      financeGoals: 'id, createdAt',
      financeIncomePeriods: 'id, createdAt, orden, fechaInicio',
    })
    acotada
      .version(18)
      .stores({})
      .upgrade(async (tx) => {
        await Promise.all([
          tx.table('financeAccounts').clear(),
          tx.table('financeMovimientos').clear(),
          tx.table('financeGoals').clear(),
          tx.table('financeIncomePeriods').clear(),
        ])
      })
    await acotada.open()

    // Las cuatro tablas de Finanzas: vacías tras el reset.
    expect(await acotada.table('financeAccounts').count()).toBe(0)
    expect(await acotada.table('financeMovimientos').count()).toBe(0)
    expect(await acotada.table('financeGoals').count()).toBe(0)
    expect(await acotada.table('financeIncomePeriods').count()).toBe(0)

    // La idea histórica (tabla ajena a Finanzas) cruza intacta.
    const ideaHistorica = await acotada.table('ideas').get('idea-historica')
    expect(ideaHistorica?.texto).toBe('Ver documental de trading')
    expect(ideaHistorica?.destino).toBe('biblioteca')

    // Idempotencia: cerrar y reabrir no repite el upgrade ni revive nada.
    acotada.close()
    await acotada.open()
    expect(await acotada.table('financeMovimientos').count()).toBe(0)
    expect(await acotada.table('ideas').count()).toBe(1)
  })
})
