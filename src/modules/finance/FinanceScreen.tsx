import { useEffect, useMemo, useRef, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFinance } from './useFinance'
import { AnilloCategorias } from './AnilloCategorias'
import { EntroDetalle } from './EntroDetalle'
import { SeFueDetalle } from './SeFueDetalle'
import { MovimientoRow } from './MovimientoRow'
import { NuevoMovimiento } from './NuevoMovimiento'
import { CATEGORIA_COLOR, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { extraerMovimiento, type Moneda } from './extraccion'
import {
  estaEnCurso,
  etiquetaMesEnCurso,
  etiquetaSemana,
  formatearMonto,
  mesDe,
  monedaDe,
  resumirMes,
  resumirSemana,
  semanaDelMes,
} from './mes'
import { fechaEnSemana, semanaActual as semanaCobroActual } from './semanaCobro'
import type { FinanceMovimiento } from '@/types/finance'
import type { NuevaCompraEnCuotas, NuevaFinanceMovimiento } from './financeRepository'
import type { PatchMovimiento } from './MovimientoRow'

type Vista = 'semana' | 'mes'
type Detalle = 'entro' | 'sefue' | 'nuevo' | null

/**
 * Finanzas (Sprint 007 — "Comprender el movimiento del dinero"),
 * reemplaza la versión de Sprint de Producto 004/006: misma pregunta
 * ("¿en qué se me va y de dónde me entra el dinero?"), pero el brief es
 * ahora explícito en un punto que la versión anterior no resolvía: acá
 * nadie "registra" nada a mano. Antes, cada captura del Umbral esperaba
 * en "Sin registrar" hasta que el usuario tocaba una categoría — eso es
 * exactamente el "usuario organiza" que la Filosofía rechaza. Ahora el
 * efecto de abajo registra solo, apenas hay un monto: si el léxico
 * reconoce la categoría con confianza, el movimiento nace clasificado;
 * si no, nace igual (el monto ya es real, cuenta en Entró/Se fue/Te
 * quedó) pero con `categoria: null` — "Por revisar", nunca "Otros" — y
 * se corrige con un toque, no con un formulario.
 *
 * Sprint 019 ("Finanzas como herramienta de control real"): el Umbral
 * sigue siendo la única puerta para capturar una idea o intención suelta
 * ("Tengo que comprar un destapacañerías"), y el efecto de arriba sigue
 * siendo el único camino automático — acá no se corrige nada a mano. Lo
 * que cambia es que cuando el usuario ya sabe que está registrando una
 * operación financiera ("Gasté 18.000 en supermercado"), "+ Movimiento"
 * (ver NuevoMovimiento.tsx) le permite anotarla directo, sin pasar por
 * el Umbral — mismo financeMovimientoRepository.add() que ya usa el
 * efecto de abajo, ninguna escritura paralela. Lo único que sigue
 * esperando en "Sin monto" es lo que no trae número: ahí no hay nada que
 * registrar todavía, solo pedir que se reescriba con la cifra.
 *
 * La pantalla responde primero Entró/Se fue/Te quedó (Experiencia) y
 * solo la vista mensual agrega desglose por categoría y % de ahorro —
 * nunca un listado de cada movimiento (eso es la planilla que el brief
 * rechaza).
 */
export function FinanceScreen() {
  const {
    movimientos,
    periodos,
    ready,
    addMovimiento,
    addCompra,
    updateMovimiento,
    deleteMovimiento,
    addPeriodo,
    deletePeriodo,
  } = useFinance()
  const { ideas, moveSheet } = useIdeas()
  const [mes] = useState(() => mesDe(new Date()))
  const [moneda, setMoneda] = useState<Moneda>('ars')
  const [vista, setVista] = useState<Vista>('semana')
  const [detalle, setDetalle] = useState<Detalle>(null)
  const [categoriaDetalle, setCategoriaDetalle] = useState<FinanceCategoria | null>(null)
  /**
   * Sprint 036 — período desde el que se abrió "+ Agregar ingreso", para
   * volver a Ingresos (no a Finanzas) al guardar o cancelar, y para que
   * el ingreso nuevo nazca ya asociado a ese período. `null` cuando el
   * formulario se abrió desde "+ Movimiento" general.
   */
  const [nuevoIngresoPeriodoId, setNuevoIngresoPeriodoId] = useState<string | null>(null)

  const convertidas = useMemo(
    () => new Set(movimientos.map((movimiento) => movimiento.ideaId).filter(Boolean)),
    [movimientos],
  )
  /**
   * Sprint 025: `convertidas` solo sabe de una Idea ya pasada a
   * Movimiento una vez que `addMovimiento` (async: escribe en IndexedDB
   * y recién después hace `setMovimientos`) termina y ese estado se
   * re-renderiza. Si el efecto de abajo se dispara una segunda vez ANTES
   * de que ese viaje de ida y vuelta termine (StrictMode remonta cada
   * efecto una vez en desarrollo; lo mismo puede pasar en producción con
   * dos renders seguidos por cambios independientes de `ideas`, que es
   * un store compartido a nivel de módulo), `pendientes` seguía
   * incluyendo la misma Idea y se creaba un segundo FinanceMovimiento
   * real con el mismo `ideaId` — la duplicación visible ("Gasté 87k en
   * Ropa" x2) no era de render, eran dos registros de verdad. Mismo
   * patrón ya probado en AgendaScreen.tsx (Sprint 017.1): esta ref marca
   * una Idea como "en conversión" en el mismo instante síncrono en que
   * se decide convertirla, así una segunda pasada del efecto no la
   * vuelve a tomar mientras la primera todavía está en vuelo.
   */
  const enConversion = useRef<Set<string>>(new Set())
  /** Capturas que el Umbral mandó acá y todavía no encontraron un monto. */
  const pendientes = ideas.filter(
    (idea) => idea.destino === 'finanzas' && !convertidas.has(idea.id) && !enConversion.current.has(idea.id),
  )
  const sinMonto = pendientes.filter((idea) => extraerMovimiento(idea.texto).montos.length === 0)

  useEffect(() => {
    if (!ready) return
    for (const idea of pendientes) {
      const extraido = extraerMovimiento(idea.texto)
      if (extraido.montos.length === 0) continue
      enConversion.current.add(idea.id)
      for (const montoExtraido of extraido.montos) {
        // Sprint 028: "Gasté 87k en Ropa - 3 cuotas" es una compra en
        // cuotas, no un movimiento por el total — mismo `addCompra` que
        // usa "+ Movimiento" (§13: una sola lógica para las dos puertas).
        // Mini Sprint 029.2 (§9): el medio de ESTE monto si la frase lo
        // dice cerca ("820K en efectivo + 400K transferencias"), y si no
        // lo dice, el medio global de toda la captura — mismo criterio
        // que ya regía antes de este mini-sprint.
        const medio = montoExtraido.medio ?? extraido.medio
        if (extraido.cuotas) {
          void addCompra({
            concepto: idea.texto,
            montoTotal: montoExtraido.monto,
            cantidadCuotas: extraido.cuotas,
            categoria: extraido.categoriaSegura ? extraido.categoria : null,
            moneda: montoExtraido.moneda,
            medio,
            ideaId: idea.id,
            fecha: idea.fecha,
          })
        } else {
          void addMovimiento({
            tipo: extraido.tipo,
            monto: montoExtraido.monto,
            moneda: montoExtraido.moneda,
            medio,
            concepto: idea.texto,
            categoria: extraido.categoriaSegura ? extraido.categoria : null,
            ideaId: idea.id,
            fecha: idea.fecha,
          })
        }
      }
    }
    // Se re-ejecuta cuando cambian ideas o movimientos: cada alta reduce
    // `pendientes` en el próximo render, hasta que solo quedan las que
    // de verdad no traen un monto (esas no vuelven a intentarse).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ideas, movimientos])

  const semanaActual = useMemo(() => semanaDelMes(new Date().toISOString().slice(0, 10)), [])
  const resumen = useMemo(() => resumirMes(movimientos, mes, moneda), [movimientos, mes, moneda])
  const semanal = useMemo(
    () => resumirSemana(movimientos, mes, semanaActual, moneda),
    [movimientos, mes, semanaActual, moneda],
  )
  /**
   * Sprint 037 — "Esta semana" para Ingresos ya no puede usar
   * `semanal.entro` (ese número viene de `semanaDelMes`, que resetea con
   * el mes: una semana de cobro real como 27 jul → 2 ago quedaba partida
   * en dos y el total de "Esta semana" no coincidía con lo que mostraba
   * Ingresos, que ya agrupa por semana de cobro real desde este sprint).
   * Acá se suma directo sobre `movimientos` con la semana lunes→domingo
   * real de hoy — mismo criterio que `EntroDetalle`/`semanaCobro.ts`, sin
   * tocar cómo se calculan los egresos (`semanal.seFue` sigue viniendo
   * de `resumirSemana`, que es el modelo correcto y ya probado para
   * egresos, fuera de alcance de este sprint).
   */
  const entroSemanaReal = useMemo(() => {
    const { fechaInicio, fechaFin } = semanaCobroActual()
    return movimientos
      .filter(
        (movimiento) =>
          movimiento.tipo === 'ingreso' && monedaDe(movimiento) === moneda && fechaEnSemana(movimiento.fecha, fechaInicio, fechaFin),
      )
      .reduce((total, movimiento) => total + movimiento.monto, 0)
  }, [movimientos, moneda])
  const ahorroPct = resumen.ingresado > 0 ? Math.round((resumen.balance / resumen.ingresado) * 100) : 0

  /** El selector de moneda solo aparece si de verdad hay dólares: nada sobra por si acaso. */
  const hayDolares = useMemo(
    () => movimientos.some((movimiento) => movimiento.fecha.startsWith(mes) && monedaDe(movimiento) === 'usd'),
    [movimientos, mes],
  )

  function corregirCategoria(movimiento: FinanceMovimiento, categoria: FinanceCategoria) {
    void updateMovimiento(movimiento.id, { categoria })
  }

  /**
   * Sprint 034 (§16) — "Por revisar" solo existe para egresos sin
   * categoría (ver `resumirPeriodo` en mes.ts), pero un texto viejo del
   * Umbral que no matcheó ningún verbo de ingreso ("Semana 3, 200K") cae
   * ahí como egreso aunque en realidad haya sido plata que entró. Acá se
   * corrige el dato en la raíz — tipo pasa a 'ingreso' y la categoría se
   * limpia porque un ingreso nunca tiene una — así el movimiento sale de
   * "Por revisar" y aparece en Ingresos, agrupado por su semana como
   * cualquier otro.
   */
  function convertirAIngreso(movimiento: FinanceMovimiento) {
    void updateMovimiento(movimiento.id, { tipo: 'ingreso', categoria: null })
  }

  /**
   * Mini Sprint 029.1 (§4/§5/§6) — misma `updateMovimiento` que ya usa `corregirCategoria`. Mini Sprint 032 (§7) amplió el patch a monto/fecha/moneda/medio/concepto.
   *
   * Mini Sprint 035 (§18/§21) — `resumen`/`semanal` (y todo lo que de ahí
   * cuelga: Ingresos, Se fue, Por revisar) están filtrados por la moneda
   * que esta pantalla tiene seleccionada (`moneda`, arriba). Editar un
   * movimiento a la OTRA moneda lo persiste bien (Dexie hace PATCH, no
   * reemplazo), pero si la vista se queda mirando la moneda vieja el
   * movimiento sale del filtro en el próximo render — si era el único
   * movimiento de la app, `sinNada` se vuelve `true` y la pantalla entera
   * cae al EmptyState, dando la falsa impresión de que "no se guardó".
   * Seguir a la moneda nueva es lo único que hace que el mismo movimiento
   * editado siga a la vista, tal como pide el brief.
   */
  function editarMovimiento(movimiento: FinanceMovimiento, patch: PatchMovimiento) {
    void updateMovimiento(movimiento.id, patch)
    if (patch.moneda !== moneda) setMoneda(patch.moneda)
  }

  /** Sprint 036 — abre "+ Movimiento" desde un período puntual de Ingresos: tipo fijo, ya asociado a ese período. */
  function abrirNuevoIngreso(periodoId: string) {
    setNuevoIngresoPeriodoId(periodoId)
    setDetalle('nuevo')
  }

  /** Mini Sprint 029.1 (§7). */
  function eliminarMovimiento(movimiento: FinanceMovimiento) {
    void deleteMovimiento(movimiento.id)
  }

  if (!ready) return null

  function cerrarDetalle() {
    setDetalle(null)
    setCategoriaDetalle(null)
  }

  /** Sprint 036 — cierra "+ Movimiento": si vino de un período de Ingresos vuelve ahí, no a Finanzas. */
  function cerrarNuevo() {
    if (nuevoIngresoPeriodoId !== null) {
      setNuevoIngresoPeriodoId(null)
      setDetalle('entro')
    } else {
      cerrarDetalle()
    }
  }

  /**
   * Sprint 019: registrar un movimiento no depende de que ya exista
   * algo en Finanzas — tiene que poder abrirse incluso desde el estado
   * vacío (ver más abajo, botón "+ Movimiento" junto al EmptyState), así
   * que este chequeo va antes de `sinNada`, no después.
   */
  async function guardarMovimiento(input: NuevaFinanceMovimiento) {
    await addMovimiento(input)
    cerrarNuevo()
  }

  /** Sprint 028 — mismo camino que "guardarMovimiento", para una compra en cuotas armada desde el formulario. */
  async function guardarCompra(input: NuevaCompraEnCuotas) {
    await addCompra(input)
    cerrarNuevo()
  }

  if (detalle === 'nuevo') {
    const periodoActivo = nuevoIngresoPeriodoId !== null ? periodos.find((p) => p.id === nuevoIngresoPeriodoId) : undefined
    /** exactOptionalPropertyTypes: `tipoFijo`/`fechaDefault`/`periodoIdFijo`/`fechaMin`/`fechaMax` son opcionales de verdad — solo entran en el spread cuando hay período, nunca como `undefined` explícito. */
    const propsDePeriodo = periodoActivo
      ? {
          tipoFijo: 'ingreso' as const,
          fechaDefault: periodoActivo.fechaInicio,
          periodoIdFijo: periodoActivo.id,
          fechaMin: periodoActivo.fechaInicio,
          fechaMax: periodoActivo.fechaFin,
        }
      : {}
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
        <NuevoMovimiento
          monedaDefault={moneda}
          {...propsDePeriodo}
          onGuardar={guardarMovimiento}
          onGuardarCompra={guardarCompra}
          onCerrar={cerrarNuevo}
        />
      </div>
    )
  }

  /**
   * Sprint 036 — Ingresos ya no depende de que exista algún movimiento
   * este mes: es la misma razón por la que `EntroDetalle` mira
   * `movimientos` entero y no `resumen` (filtrado por mes). Este bloque
   * tiene que resolverse ANTES del gate de `sinNada` de abajo — si no,
   * el usuario recién llegado a un Finanzas vacío (0 movimientos, el
   * estado exacto que deja la migración de este sprint) no tendría forma
   * de abrir Ingresos para crear su primer período: quedaría atrapado en
   * el EmptyState de "+ Movimiento", que exige anotar un gasto primero.
   */
  if (detalle === 'entro') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
        <EntroDetalle
          ingresos={movimientos.filter((movimiento) => movimiento.tipo === 'ingreso')}
          periodos={periodos}
          onEditar={editarMovimiento}
          onEliminar={eliminarMovimiento}
          onAgregarIngreso={abrirNuevoIngreso}
          onCrearPeriodo={(input) => void addPeriodo(input)}
          onEliminarPeriodo={(id) => void deletePeriodo(id)}
          onCerrar={cerrarDetalle}
        />
      </div>
    )
  }

  const nombreMes = new Date(`${mes}-02`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  /** Sprint 016.1, punto 15: mismo texto que ya arma el header acá abajo, para que Entró/Se fue nunca pierdan de vista qué período están mostrando al entrar en un detalle. */
  const periodoLabel = vista === 'semana' ? `Semana ${semanaActual} · ${etiquetaSemana(mes, semanaActual)}` : nombreMes
  const sinNada = resumen.movimientos.length === 0 && sinMonto.length === 0

  if (sinNada) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 pb-10">
        <EmptyState
          title="Todavía no se movió un peso."
          description="Escribí un gasto en el Umbral — “Gasté 80k en gasolina” — y el Estudio lo trae acá con su categoría."
        />
        <div className="flex gap-3">
          <button type="button" className="idea-destino" onClick={() => setDetalle('nuevo')}>
            + Movimiento
          </button>
          <button type="button" className="idea-destino" onClick={() => setDetalle('entro')}>
            Ingresos
          </button>
        </div>
      </div>
    )
  }

  const entro = vista === 'semana' ? entroSemanaReal : resumen.ingresado
  const seFue = vista === 'semana' ? semanal.seFue : resumen.gastado
  const teQuedo = vista === 'semana' ? entroSemanaReal - semanal.seFue : resumen.balance
  const movimientosDelPeriodo = vista === 'semana' ? semanal.movimientos : resumen.movimientos
  const gruposDelPeriodo = vista === 'semana' ? semanal.grupos : resumen.grupos
  const registradoHastaHoy = estaEnCurso(mes)
  /**
   * Sprint 034 (§19/§20) — "Movimientos recientes" responde "¿en qué se
   * fue?", no un timeline general: antes mostraba `movimientosDelPeriodo`
   * sin filtrar, así que un ingreso ("Ingreso Semana 3, $10") aparecía acá
   * mezclado con salidas reales. Mismo campo `tipo` que ya usa toda
   * Finanzas como fuente de verdad — nada de clasificación paralela.
   */
  const movimientosRecientes = movimientosDelPeriodo.filter((movimiento) => movimiento.tipo === 'egreso').slice(0, 5)

  if (detalle === 'sefue') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
        <SeFueDetalle
          moneda={moneda}
          periodoLabel={periodoLabel}
          total={seFue}
          grupos={gruposDelPeriodo}
          movimientos={movimientosDelPeriodo}
          categoriaInicial={categoriaDetalle}
          onCambiarCategoria={corregirCategoria}
          onEditar={editarMovimiento}
          onEliminar={eliminarMovimiento}
          onCerrar={cerrarDetalle}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <section className="flex flex-col items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">{periodoLabel}</p>
        {vista === 'mes' && registradoHastaHoy ? (
          <p className="font-mono text-[11px] text-ink-faint">{etiquetaMesEnCurso(mes)} · en curso</p>
        ) : null}
        <div className="idea-destinos" role="group" aria-label="Vista">
          {(['semana', 'mes'] as const).map((opcion) => (
            <button
              key={opcion}
              type="button"
              className="idea-destino"
              aria-pressed={vista === opcion}
              style={vista === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
              onClick={() => setVista(opcion)}
            >
              {opcion === 'semana' ? 'Esta semana' : 'Este mes'}
            </button>
          ))}
        </div>
        {hayDolares ? (
          <div className="idea-destinos" role="group" aria-label="Moneda">
            {(['ars', 'usd'] as const).map((opcion) => (
              <button
                key={opcion}
                type="button"
                className="idea-destino"
                aria-pressed={moneda === opcion}
                style={moneda === opcion ? { color: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                onClick={() => setMoneda(opcion)}
              >
                {opcion === 'ars' ? 'Pesos' : 'Dólares'}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-1.5">
        <button
          type="button"
          className="flex w-full appearance-none items-baseline justify-between gap-3 border-0 bg-transparent p-0 text-left"
          onClick={() => setDetalle('entro')}
        >
          <span className="text-[15px] text-ink-dim">Ingresos</span>
          <span className="font-mono text-[16px] text-good">{formatearMonto(entro, moneda)}</span>
        </button>
        <button
          type="button"
          className="flex w-full appearance-none items-baseline justify-between gap-3 border-0 bg-transparent p-0 text-left"
          onClick={() => setDetalle('sefue')}
        >
          <span className="text-[15px] text-ink-dim">Se fue</span>
          <span className="font-mono text-[16px] text-critical">{formatearMonto(seFue, moneda)}</span>
        </button>
        <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border/40 pt-2">
          <span className="text-[15px] text-ink">Te quedó</span>
          <span className={`font-mono text-[17px] ${teQuedo >= 0 ? 'text-good' : 'text-critical'}`}>
            {formatearMonto(teQuedo, moneda)}
          </span>
        </div>
        {registradoHastaHoy ? <p className="text-right text-[12px] text-ink-faint">Registrado hasta hoy</p> : null}
      </section>

      {resumen.porRevisar.length > 0 ? (
        <section>
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Por revisar</h2>
          <ul className="flex flex-col">
            {resumen.porRevisar.map((movimiento) => (
              <MovimientoRow
                key={movimiento.id}
                movimiento={movimiento}
                moneda={moneda}
                onCambiarCategoria={(categoria) => corregirCategoria(movimiento, categoria)}
                onConvertirAIngreso={movimiento.compraId ? undefined : () => convertirAIngreso(movimiento)}
                onEditar={movimiento.compraId ? undefined : (patch) => editarMovimiento(movimiento, patch)}
                onEliminar={movimiento.compraId ? undefined : () => eliminarMovimiento(movimiento)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {sinMonto.length > 0 ? (
        <section>
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Sin monto</h2>
          <ul className="flex flex-col">
            {sinMonto.map((idea) => (
              <li key={idea.id} className="border-b border-border/40 py-3 last:border-b-0">
                <p className="text-[15px] leading-snug text-ink-dim">{idea.texto}</p>
                <p className="mt-1 flex items-baseline gap-2 text-[13px] text-ink-faint">
                  No encontré un monto. Escribilo de nuevo con la cifra.
                  <button
                    type="button"
                    className="idea-aviso-cerrar"
                    aria-label="Descartar"
                    onClick={() => void moveSheet(idea, 'archivador')}
                  >
                    ×
                  </button>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {vista === 'mes' && resumen.grupos.length > 0 ? (
        <section className="flex flex-col items-center gap-4">
          <AnilloCategorias grupos={resumen.grupos} total={formatearMonto(resumen.gastado, moneda)} />
          <ul className="flex w-full flex-col gap-3">
            {resumen.grupos.map((grupo) => (
              <li key={grupo.categoria}>
                <button
                  type="button"
                  className="flex w-full appearance-none flex-col gap-1.5 border-0 bg-transparent p-0 text-left"
                  onClick={() => {
                    setCategoriaDetalle(grupo.categoria)
                    setDetalle('sefue')
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-[15px] text-ink">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CATEGORIA_COLOR[grupo.categoria] }}
                        aria-hidden="true"
                      />
                      {CATEGORIA_LABEL[grupo.categoria]}
                    </span>
                    <span className="font-mono text-[14px] text-ink-dim">{formatearMonto(grupo.total, moneda)}</span>
                  </div>
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${grupo.parte * 100}%`, backgroundColor: CATEGORIA_COLOR[grupo.categoria] }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {resumen.ingresado > 0 ? (
            <p className="font-mono text-[12.5px] text-ink-faint">Ahorraste el {ahorroPct}% de lo que entró este mes</p>
          ) : null}
        </section>
      ) : null}

      {movimientosRecientes.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Movimientos recientes</h2>
          <ul className="flex flex-col">
            {movimientosRecientes.map((movimiento) => (
              <MovimientoRow key={movimiento.id} movimiento={movimiento} moneda={moneda} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex justify-center pt-1">
        <button type="button" className="idea-destino" onClick={() => setDetalle('nuevo')}>
          + Movimiento
        </button>
      </section>
    </div>
  )
}
