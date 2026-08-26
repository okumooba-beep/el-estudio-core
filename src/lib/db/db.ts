import Dexie, { type EntityTable } from 'dexie'
import type { Idea } from '@/types/idea'
import type { Operacion } from '@/types/operacion'
import type { HabitCheck } from '@/types/habitCheck'
import type { FinanceAccount, FinanceMovimiento, FinanceGoal, FinanceIncomePeriod } from '@/types/finance'
import type { AgendaEvento, AgendaBloque } from '@/types/agenda'
import type { AuditRuptura, AuditPremortem, AuditCorreccionSemanal, AuditConfig } from '@/types/auditoria'
import { extraerCategoria } from '@modules/finance/extraccion'

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
  financeIncomePeriods!: EntityTable<FinanceIncomePeriod, 'id'>
  agendaEventos!: EntityTable<AgendaEvento, 'id'>
  agendaBloques!: EntityTable<AgendaBloque, 'id'>
  auditRupturas!: EntityTable<AuditRuptura, 'id'>
  auditPremortems!: EntityTable<AuditPremortem, 'id'>
  auditCorrecciones!: EntityTable<AuditCorreccionSemanal, 'id'>
  auditConfig!: EntityTable<AuditConfig, 'id'>

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

    /**
     * Sprint 004 — `categoria` e `ideaId` en financeMovimientos. Dexie
     * no necesita reescribir filas para campos que no se indexan: los
     * movimientos viejos quedan sin categoría y la pantalla los lee
     * como 'otros' (ver categoriaDe). Nada se pierde ni se migra a mano.
     */
    this.version(9).stores({
      financeMovimientos: 'id, createdAt, categoria, ideaId',
    })

    /** Sprint 006 — `moneda` y `medio`. Los movimientos previos se leen como pesos/transferencia. */
    this.version(10).stores({
      financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio',
    })

    // Módulo Agenda — "qué pasa y cuándo". Dos tablas nuevas: Eventos
    // (nacen en el Umbral, `ideaId` los vincula a la Idea que los
    // originó) y Bloques (nacen directo en Planificación semanal, sin
    // Idea de por medio — por eso `dia` es su único índice de fecha).
    this.version(11).stores({
      agendaEventos: 'id, createdAt, fecha, ideaId',
      agendaBloques: 'id, createdAt, dia',
    })

    /**
     * Sprint 022 — "Misiones: principales, secundarias y futuro": ninguna
     * misión creada antes de Sprint 016.2 tiene `misionPrincipal` en su
     * fila (el campo no existía). Esto ya se lee correctamente hoy —
     * `seleccionarSecundarias` trata `misionPrincipal !== true`, así que
     * `undefined` ya cae en Secundaria, igual que `false` — así que esta
     * migración no cambia ningún resultado visible; solo hace explícito
     * en el dato lo que el código ya asumía. No toca `programadaFecha`,
     * `texto` ni ninguna otra columna, y solo escribe filas de `destino
     * === 'misiones'` que todavía tienen el campo sin definir — correr
     * esto una segunda vez no encuentra ninguna fila que cumpla el filtro,
     * así que no vuelve a escribir nada (idempotente).
     */
    this.version(12)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table<Idea, string>('ideas')
          .where('destino')
          .equals('misiones')
          .filter((idea) => idea.misionPrincipal === undefined)
          .modify({ misionPrincipal: false })
      })

    /**
     * Sprint 027 — antes de Sprint 025, `extraerCategoria` matcheaba 'gas'
     * (servicios) como substring dentro de "Gasté"/"Gasto", así que
     * cualquier egreso escrito con ese verbo caía en Servicios sin
     * importar de qué se tratara. Esos movimientos quedaron guardados así
     * para siempre — Sprint 025 corrigió el extractor pero nunca tocó lo
     * ya guardado. Esta migración reintenta la categoría, con el
     * extractor YA corregido, únicamente sobre filas que hoy dicen
     * 'servicios' — nunca las demás, así que una corrección manual previa
     * a otra categoría (Sprint 026) no se pisa. Solo escribe si el nuevo
     * resultado es `segura` y distinto de 'servicios': un concepto real
     * de servicios ("Pagué el gas") vuelve a dar 'servicios' y queda
     * intacto, y lo que el léxico no reconoce (`segura: false`) se deja
     * sin tocar en vez de adivinar. No modifica monto, fecha, moneda,
     * concepto ni ID. Correr esto de nuevo no encuentra filas 'servicios'
     * que hoy reclasifiquen distinto, así que no vuelve a escribir nada
     * (idempotente).
     */
    this.version(13)
      .stores({})
      .upgrade(async (tx) => {
        const movimientos = await tx
          .table<FinanceMovimiento, string>('financeMovimientos')
          .where('categoria')
          .equals('servicios')
          .toArray()
        await Promise.all(
          movimientos.map((movimiento) => {
            const { categoria, segura } = extraerCategoria(movimiento.concepto)
            if (!segura || !categoria || categoria === 'servicios') return undefined
            return tx.table('financeMovimientos').update(movimiento.id, { categoria })
          }),
        )
      })

    /**
     * Sprint 028 — "Sistema de cuotas": índice para `compraId`, así una
     * corrección de categoría puede encontrar las demás cuotas de la
     * misma compra sin escanear toda la tabla (ver `update` en
     * financeRepository.ts). Solo índice, sin `.upgrade()`: no hay datos
     * que migrar — las cuotas se aplican únicamente a operaciones
     * nuevas (§14 del brief), los movimientos existentes simplemente no
     * tienen `compraId` y quedan intactos.
     */
    this.version(14).stores({
      financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio, compraId',
    })

    /**
     * Sprint 036 — "Ingresos como períodos financieros reales". Auditoría
     * previa (ver §32 del sprint): `financeMovimientos` no tenía, en
     * ningún momento de su historia, un campo de período — "semana" era
     * siempre `Math.ceil(día/7)` calculado al vuelo (semanaDelMes en
     * mes.ts). Esa función no puede representar un período con fechas que
     * el usuario elige ("Semana 1: lunes 10 → domingo 16"), así que no
     * hay forma de inferir a qué período pertenecía cada ingreso ya
     * guardado — no hay dato que migrar, solo una columna que nunca
     * existió.
     *
     * `financeIncomePeriods` es la tabla nueva y mínima que hacía falta:
     * un período es `{ nombre, fechaInicio, fechaFin }`, nada más. Nace
     * vacía — los períodos los crea el usuario desde Ingresos, no un
     * migrador.
     *
     * `periodoId` se agrega como índice a `financeMovimientos` para poder
     * listar los ingresos de un período sin recorrer toda la tabla.
     *
     * Limpieza autorizada explícitamente por el usuario ("Podés borrar
     * los datos actuales de Finanzas... prefiero 0 movimientos + un
     * modelo correcto que 100 movimientos antiguos + un modelo que sigue
     * fallando"): se vacía únicamente `financeMovimientos` — la única
     * tabla de Finanzas cuyo modelo cambia en este sprint. `financeAccounts`
     * y `financeGoals` no se tocan: no forman parte de Ingresos ni tienen
     * relación con `periodoId`, y no hay necesidad conceptual de vaciarlos
     * para dejar el módulo de Ingresos limpio.
     */
    this.version(15)
      .stores({
        financeIncomePeriods: 'id, createdAt, orden',
        financeMovimientos: 'id, createdAt, categoria, ideaId, moneda, medio, compraId, periodoId',
      })
      .upgrade(async (tx) => {
        await tx.table('financeMovimientos').clear()
      })

    /**
     * Módulo Auditoría — capa de observación/corrección sobre Agenda y
     * Misiones (nunca un segundo calendario ni una segunda entidad de
     * misión, ver src/modules/auditoria/). Cuatro tablas nuevas y
     * mínimas, todas vacías: no hay dato previo que migrar porque el
     * concepto no existía. `auditConfig` guarda una única fila (`id:
     * 'config'`) con el resultado dominante configurable, los patrones
     * de "evidencia reconocible" y la señal roja — por eso no lleva
     * más índice que `id`, igual que cualquier tabla de una sola fila.
     */
    this.version(16).stores({
      auditRupturas: 'id, createdAt, fecha, tipo',
      auditPremortems: 'id, createdAt, semanaId',
      auditCorrecciones: 'id, createdAt, semanaId',
      auditConfig: 'id',
    })

    /**
     * Sprint 037 — "Reconstrucción del módulo de Ingresos de Finanzas".
     * Auditoría previa: `financeIncomePeriods` (Sprint 036) no imponía
     * ninguna regla de semana real — el usuario podía crear un "período"
     * con cualquier nombre libre y cualquier par de fechas arbitrario, sin
     * relación con lunes→domingo. Esto y el hecho de que la pantalla
     * principal de Finanzas seguía mostrando "Esta semana" con el modelo
     * viejo (`semanaDelMes`, día-del-mes puro) mientras Ingresos agrupaba
     * por esos períodos libres, hacía que los dos totales de una misma
     * semana no coincidieran — la "duplicación" reportada no eran filas
     * repetidas en la base, sino dos modelos de semana desconectados
     * operando sobre los mismos datos. No existe forma de inferir, para
     * cada período ya creado, cuál habría sido su semana lunes→domingo
     * "correcta" sin arriesgar una reconstrucción ambigua sobre datos que
     * ya sabemos inconsistentes — así que no se migra, se limpia.
     *
     * Limpieza autorizada explícitamente por el usuario, acotada
     * exactamente a lo que el brief permite:
     *   - `financeIncomePeriods` se vacía por completo (la tabla entera:
     *     el concepto de período libre desaparece, lo reemplaza la semana
     *     de cobro real que el usuario vuelve a crear desde Ingresos).
     *   - de `financeMovimientos` se borran SOLO las filas con
     *     `tipo === 'ingreso'` — los egresos, sus cuotas (`compraId`) y
     *     cualquier otro campo quedan exactamente como estaban.
     * Nada de `financeAccounts`, `financeGoals`, ni ninguna tabla de otro
     * módulo (Agenda, Misiones, Hábitos, Cuaderno, Trading, Auditoría,
     * etc.) se toca en esta migración.
     */
    this.version(17)
      .stores({
        financeIncomePeriods: 'id, createdAt, orden, fechaInicio',
      })
      .upgrade(async (tx) => {
        await tx.table('financeIncomePeriods').clear()
        // `tipo` no está indexado en `financeMovimientos` (nunca hizo falta filtrar por él a nivel de índice) — `.filter()` sobre toda la colección es correcto acá porque esto corre una única vez, no en cada carga.
        await tx
          .table<FinanceMovimiento, string>('financeMovimientos')
          .toCollection()
          .filter((movimiento) => movimiento.tipo === 'ingreso')
          .delete()
      })

    /**
     * Sprint 040 — "Reset completo de Finanzas". Decisión explícita del
     * usuario: dejar de reparar/migrar los datos actuales de Ingresos.
     * Tras los Sprints 037-039, la base real seguía teniendo una mezcla de
     * movimientos de prueba (cargados a mano mientras se verificaban
     * reportes de sprints anteriores) y capturas reales del Umbral con
     * historial inconsistente entre sí — el usuario prefiere arrancar
     * Finanzas en cero y volver a cargar todo a mano antes que seguir
     * corrigiendo caso por caso.
     *
     * Alcance exacto, verificado contra el esquema de esta clase antes de
     * escribir esta migración (no se asumió ningún nombre de tabla): las
     * únicas cuatro tablas que pertenecen exclusivamente a Finanzas son
     * `financeAccounts`, `financeMovimientos` (acá viven ingresos, egresos,
     * "Por revisar" y cuotas — son la misma tabla, distinguidos solo por
     * `tipo`/`categoria`/`compraId`, nunca tablas separadas) y `financeGoals`
     * (Sprint 8, sin store propio de "Metas" en la UI actual, pero igual
     * exclusivas del dominio Finanzas) y `financeIncomePeriods` (Sprint 036).
     * Se vacían las cuatro por completo. Ninguna otra tabla se toca:
     * `ideas` (Umbral/Cuaderno/Diario/Misiones/Biblioteca), `operaciones`
     * (Trading), `habitChecks` (Hábitos), `agendaEventos`/`agendaBloques`
     * (Agenda), `auditRupturas`/`auditPremortems`/`auditCorrecciones`/
     * `auditConfig` (Auditoría) y `notas` (legacy, en desuso) quedan
     * exactamente como estaban.
     *
     * Ningún índice cambia — el modelo de semana de cobro de Sprint
     * 037-039 ya es correcto; lo que estaba mal eran los datos arrastrados,
     * no el esquema — así que no hace falta redeclarar ningún `.stores()`
     * más que el vacío. `.clear()` sobre una tabla ya vacía no hace nada
     * (idempotente), y Dexie solo corre el `.upgrade()` de cada versión una
     * única vez por base — correr la app de nuevo tras el reset no repite
     * este borrado.
     */
    this.version(18)
      .stores({})
      .upgrade(async (tx) => {
        await Promise.all([
          tx.table('financeAccounts').clear(),
          tx.table('financeMovimientos').clear(),
          tx.table('financeGoals').clear(),
          tx.table('financeIncomePeriods').clear(),
        ])
      })
  }
}

export const db = new LifeosDB()
