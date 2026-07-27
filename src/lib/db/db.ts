import Dexie, { type EntityTable } from 'dexie'
import type { Idea } from '@/types/idea'
import type { Operacion } from '@/types/operacion'
import type { HabitCheck } from '@/types/habitCheck'
import type { FinanceAccount, FinanceMovimiento, FinanceGoal } from '@/types/finance'

interface LegacyNota {
  id: string
  fecha: string
  hora: string
  contenido: string
  categoria: string | null
  createdAt: string
  updatedAt: string
}

/**
 * La base local del proyecto (Implementación 08). IndexedDB vía Dexie,
 * nunca localStorage: sobrevive reinicios, no tiene el límite de ~5MB
 * de localStorage, y es lo que Safari trata de forma más duradera en
 * una PWA instalada. Cuando exista un proyecto Supabase real, ese
 * backend sincroniza esta base — nunca la reemplaza.
 *
 * Versión 2 (Sprint 2.0): Nota se convierte en Idea. `notas` queda
 * declarada pero en desuso — nunca se borra, para no perder ni una
 * fila real que alguien ya haya escrito; simplemente el código deja de
 * leerla. La migración copia cada fila una sola vez, con destino 'hoy'
 * (donde ya vivían) y origen 'hoy' (el único punto de captura que
 * existía cuando se escribieron).
 */
class LifeosDB extends Dexie {
  ideas!: EntityTable<Idea, 'id'>
  operaciones!: EntityTable<Operacion, 'id'>
  habitChecks!: EntityTable<HabitCheck, 'id'>
  financeAccounts!: EntityTable<FinanceAccount, 'id'>
  financeMovimientos!: EntityTable<FinanceMovimiento, 'id'>
  financeGoals!: EntityTable<FinanceGoal, 'id'>

  constructor() {
    super('lifeos')
    this.version(1).stores({
      notas: 'id, createdAt',
    })
    this.version(2)
      .stores({
        notas: 'id, createdAt',
        ideas: 'id, createdAt, destino',
      })
      .upgrade(async (tx) => {
        const notasAntiguas = await tx.table<LegacyNota, string>('notas').toArray()
        const ideas: Idea[] = notasAntiguas.map((n) => ({
          id: n.id,
          texto: n.contenido,
          fecha: n.fecha,
          hora: n.hora,
          destino: 'hoy',
          origen: 'hoy',
          estado: null,
          currentFurniture: 'escritorio',
          history: [
            { evento: 'creada', furniture: 'diario', fecha: n.createdAt },
            { evento: 'creada', furniture: 'escritorio', fecha: n.createdAt },
          ],
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          pendingSync: true,
        }))
        if (ideas.length > 0) await tx.table('ideas').bulkAdd(ideas)
      })
    // `operaciones` se declaró en la versión 3 sin ningún mueble que la
    // usara todavía. Sprint 3.5 la ocupa por primera vez — el schema no
    // cambia, así que no hace falta una versión nueva.
    this.version(3).stores({
      notas: 'id, createdAt',
      ideas: 'id, createdAt, destino',
      operaciones: 'id, createdAt',
    })
    // Sprint 3.6 — "El Sistema de Muebles": cada Idea ahora sabe dónde
    // vive físicamente (currentFurniture) y guarda un historial que
    // nunca se borra (history). El índice no cambia; las filas que ya
    // existían se completan una sola vez con el mueble que ya les
    // correspondía por destino, congelado acá mismo como en la v2.
    this.version(4)
      .stores({
        notas: 'id, createdAt',
        ideas: 'id, createdAt, destino',
        operaciones: 'id, createdAt',
      })
      .upgrade(async (tx) => {
        const destinoAMueble: Record<string, string> = {
          hoy: 'escritorio',
          misiones: 'tablero',
          habitos: 'habitos',
          trading: 'mesa-analisis',
          finanzas: 'finanzas',
          biblioteca: 'biblioteca',
          archivo: 'archivador',
        }
        const ideasAntiguas = await tx.table<Idea, string>('ideas').toArray()
        await Promise.all(
          ideasAntiguas.map((idea) => {
            const furniture = destinoAMueble[idea.destino] ?? 'escritorio'
            return tx.table('ideas').update(idea.id, {
              currentFurniture: furniture,
              history: [
                { evento: 'creada', furniture: 'diario', fecha: idea.createdAt },
                { evento: 'creada', furniture, fecha: idea.createdAt },
              ],
            })
          }),
        )
      })
    // Sprint 3.6.1 — el checklist de una operación pasa de claves fijas
    // a datos propios (id, texto, checked), y Hábitos gana su propia
    // tabla de círculos semanales (habitId, fecha, checked). Las
    // operaciones ya existentes se congelan con las mismas cinco
    // etiquetas que tenían fijas hasta ahora.
    this.version(5)
      .stores({
        notas: 'id, createdAt',
        ideas: 'id, createdAt, destino',
        operaciones: 'id, createdAt',
        habitChecks: 'id, habitId, fecha, [habitId+fecha]',
      })
      .upgrade(async (tx) => {
        const legacyLabels: Record<string, string> = {
          esperoSetup: 'Esperé mi setup',
          respeteRiesgo: 'Respeté el riesgo',
          noMoviStop: 'No moví el stop',
          ejecutePlan: 'Ejecuté mi plan',
          saliDondeDebia: 'Salí donde debía',
        }
        const operacionesAntiguas = await tx.table('operaciones').toArray()
        await Promise.all(
          operacionesAntiguas.map((op: { id: string; checklist: unknown }) => {
            if (Array.isArray(op.checklist)) return undefined
            const legacyChecklist = (op.checklist ?? {}) as Record<string, boolean>
            const checklist = Object.entries(legacyLabels).map(([id, texto]) => ({
              id,
              texto,
              checked: Boolean(legacyChecklist[id]),
            }))
            return tx.table('operaciones').update(op.id, { checklist })
          }),
        )
      })
    // F4 (ARCHITECTURE_RATIFIED.md) — HabitCheck gana `updatedAt`, el
    // mismo campo que ya tienen Idea y Operacion, para poder implementar
    // el contrato Repository<T> de shared-kernel. El índice no cambia
    // (no se necesita ordenar ni buscar por esta columna); las filas que
    // ya existían se completan una sola vez con `fecha` (el único dato
    // real de tiempo que tenían) en vez de inventar un instante que
    // nunca ocurrió.
    this.version(6)
      .stores({
        notas: 'id, createdAt',
        ideas: 'id, createdAt, destino',
        operaciones: 'id, createdAt',
        habitChecks: 'id, habitId, fecha, [habitId+fecha]',
      })
      .upgrade(async (tx) => {
        const checksAntiguos = await tx.table<HabitCheck, string>('habitChecks').toArray()
        await Promise.all(
          checksAntiguos
            .filter((check) => !check.updatedAt)
            .map((check) =>
              tx.table('habitChecks').update(check.id, { updatedAt: new Date(check.fecha).toISOString() }),
            ),
        )
      })
    // F5 (ARCHITECTURE_RATIFIED.md) — marcado inerte `pendingSync` en las
    // tres tablas de contenido. Nada lo lee ni lo limpia todavía (eso es
    // F6+); las filas que ya existían se congelan en `true` porque es lo
    // único cierto que se puede decir de ellas: ninguna se sincronizó
    // nunca, porque el motor de sync todavía no existe.
    this.version(7)
      .stores({
        notas: 'id, createdAt',
        ideas: 'id, createdAt, destino',
        operaciones: 'id, createdAt',
        habitChecks: 'id, habitId, fecha, [habitId+fecha]',
      })
      .upgrade(async (tx) => {
        await Promise.all([
          tx
            .table('ideas')
            .toCollection()
            .modify({ pendingSync: true }),
          tx
            .table('operaciones')
            .toCollection()
            .modify({ pendingSync: true }),
          tx
            .table('habitChecks')
            .toCollection()
            .modify({ pendingSync: true }),
        ])
      })
    // Threshold Experience V1 — Finanzas gana persistencia real. Tres
    // tablas nuevas, mismo índice mínimo ('id, createdAt') que ya usa
    // `operaciones`: nada las consulta todavía por otro campo, así que
    // agregar más índices ahora sería especulativo (Regla 4/8).
    this.version(8).stores({
      notas: 'id, createdAt',
      ideas: 'id, createdAt, destino',
      operaciones: 'id, createdAt',
      habitChecks: 'id, habitId, fecha, [habitId+fecha]',
      financeAccounts: 'id, createdAt',
      financeMovimientos: 'id, createdAt',
      financeGoals: 'id, createdAt',
    })
  }
}

export const db = new LifeosDB()
