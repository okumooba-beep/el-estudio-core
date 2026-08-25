import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * Módulo Auditoría — v16 agrega cuatro tablas nuevas y vacías
 * (auditRupturas, auditPremortems, auditCorrecciones, auditConfig), sin
 * `.upgrade()`: el concepto no existía antes, no hay nada que migrar (ver
 * db.ts). Mismo patrón de réplica acotada que db.migration-v14.test.ts —
 * encadena `.stores()` solo hasta v16, nunca abre el singleton `db` (que
 * hoy ya vacía financeMovimientos en v15, ver Sprint 036).
 *
 * Esta prueba confirma las dos mitades de esa promesa: (1) las cuatro
 * tablas nuevas están utilizables de inmediato tras abrir v16, y (2) un
 * AgendaBloque de antes de este sprint (sin el campo `protegido`, que ni
 * siquiera es un índice — ver types/agenda.ts) cruza la versión intacto.
 */
describe('migración v16: tablas de Auditoría', () => {
  afterEach(async () => {
    await Dexie.delete('lifeos')
  })

  it('crea las cuatro tablas de Auditoría vacías y utilizables', async () => {
    const previa = new Dexie('lifeos')
    previa.version(11).stores({
      agendaEventos: 'id, createdAt, fecha, ideaId',
      agendaBloques: 'id, createdAt, dia',
    })
    await previa.open()
    const ahora = new Date().toISOString()
    await previa.table('agendaBloques').add({
      id: 'bloque-historico',
      texto: 'Gimnasio 7 a 8',
      dia: '2026-08-10',
      hora: '07:00',
      alarma: false,
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: false,
    })
    previa.close()

    const acotada = new Dexie('lifeos')
    acotada.version(11).stores({
      agendaEventos: 'id, createdAt, fecha, ideaId',
      agendaBloques: 'id, createdAt, dia',
    })
    acotada.version(16).stores({
      auditRupturas: 'id, createdAt, fecha, tipo',
      auditPremortems: 'id, createdAt, semanaId',
      auditCorrecciones: 'id, createdAt, semanaId',
      auditConfig: 'id',
    })
    await acotada.open()

    // El Bloque histórico cruza intacto, sin que nadie le invente `protegido`.
    const bloqueHistorico = await acotada.table('agendaBloques').get('bloque-historico')
    expect(bloqueHistorico?.texto).toBe('Gimnasio 7 a 8')
    expect(bloqueHistorico?.protegido).toBeUndefined()

    // Las cuatro tablas nuevas: vacías, pero ya sirven para CRUD real.
    expect(await acotada.table('auditRupturas').count()).toBe(0)
    expect(await acotada.table('auditPremortems').count()).toBe(0)
    expect(await acotada.table('auditCorrecciones').count()).toBe(0)
    expect(await acotada.table('auditConfig').count()).toBe(0)

    await acotada.table('auditRupturas').add({
      id: 'ruptura-1',
      fecha: '2026-08-20',
      texto: 'Salté la sesión NY por una llamada urgente',
      tipo: 'ejecucion',
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: true,
    })
    const ruptura = await acotada.table('auditRupturas').get('ruptura-1')
    expect(ruptura?.tipo).toBe('ejecucion')

    await acotada.table('auditConfig').put({
      id: 'config',
      resultadoDominante: 'Construir evidencia de mi sistema de trading',
      rutinasReconocidas: [{ etiqueta: 'NY SESSION', patron: 'sesión ny' }],
      señalRoja: { condicion: 'Procrastinación', respuesta: 'Cortar y volver al sistema' },
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: true,
    })
    expect((await acotada.table('auditConfig').get('config'))?.resultadoDominante).toBe(
      'Construir evidencia de mi sistema de trading',
    )

    // Fila única de config: `where('semanaId')` sirve para el check-before-insert de correcciones.
    await acotada.table('auditCorrecciones').add({
      id: 'correccion-1',
      semanaId: '2026-08-17',
      promesa: 'Backtesting todas las noches',
      ejecutadoReal: '3 de 5 noches',
      evidenciaProducida: '3 registros escritos',
      capaRuptura: 'ejecucion',
      aprendizaje: 'Sin horario fijo se posterga',
      correccionUnica: 'Bloque protegido a las 21:00',
      dondeEnCalendario: 'Lunes a viernes 21:00',
      createdAt: ahora,
      updatedAt: ahora,
      pendingSync: true,
    })
    const existente = await acotada.table('auditCorrecciones').where('semanaId').equals('2026-08-17').first()
    expect(existente?.id).toBe('correccion-1')
  })
})
