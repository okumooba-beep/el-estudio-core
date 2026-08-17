import { useEffect, useMemo, useRef, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFinance } from './useFinance'
import { AnilloCategorias } from './AnilloCategorias'
import { EntroDetalle } from './EntroDetalle'
import { SeFueDetalle } from './SeFueDetalle'
import { MovimientoRow } from './MovimientoRow'
import { NuevoMovimiento } from './NuevoMovimiento'
import { CATEGORIAS, CATEGORIA_COLOR, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
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
import type { FinanceMovimiento } from '@/types/finance'
import type { NuevaFinanceMovimiento } from './financeRepository'

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
  const { movimientos, ready, addMovimiento, updateMovimiento } = useFinance()
  const { ideas, moveSheet } = useIdeas()
  const [mes] = useState(() => mesDe(new Date()))
  const [moneda, setMoneda] = useState<Moneda>('ars')
  const [vista, setVista] = useState<Vista>('semana')
  const [corrigiendo, setCorrigiendo] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<Detalle>(null)
  const [categoriaDetalle, setCategoriaDetalle] = useState<FinanceCategoria | null>(null)

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
        void addMovimiento({
          tipo: extraido.tipo,
          monto: montoExtraido.monto,
          moneda: montoExtraido.moneda,
          medio: extraido.medio,
          concepto: idea.texto,
          categoria: extraido.categoriaSegura ? extraido.categoria : null,
          ideaId: idea.id,
          fecha: idea.fecha,
        })
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
  const ahorroPct = resumen.ingresado > 0 ? Math.round((resumen.balance / resumen.ingresado) * 100) : 0

  /** El selector de moneda solo aparece si de verdad hay dólares: nada sobra por si acaso. */
  const hayDolares = useMemo(
    () => movimientos.some((movimiento) => movimiento.fecha.startsWith(mes) && monedaDe(movimiento) === 'usd'),
    [movimientos, mes],
  )

  function corregirCategoria(movimiento: FinanceMovimiento, categoria: FinanceCategoria) {
    void updateMovimiento(movimiento.id, { categoria })
    setCorrigiendo(null)
  }

  if (!ready) return null

  function cerrarDetalle() {
    setDetalle(null)
    setCategoriaDetalle(null)
  }

  /**
   * Sprint 019: registrar un movimiento no depende de que ya exista
   * algo en Finanzas — tiene que poder abrirse incluso desde el estado
   * vacío (ver más abajo, botón "+ Movimiento" junto al EmptyState), así
   * que este chequeo va antes de `sinNada`, no después.
   */
  async function guardarMovimiento(input: NuevaFinanceMovimiento) {
    await addMovimiento(input)
    cerrarDetalle()
  }

  if (detalle === 'nuevo') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
        <NuevoMovimiento monedaDefault={moneda} onGuardar={guardarMovimiento} onCerrar={cerrarDetalle} />
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
        <button type="button" className="idea-destino" onClick={() => setDetalle('nuevo')}>
          + Movimiento
        </button>
      </div>
    )
  }

  const entro = vista === 'semana' ? semanal.entro : resumen.ingresado
  const seFue = vista === 'semana' ? semanal.seFue : resumen.gastado
  const teQuedo = vista === 'semana' ? semanal.teQuedo : resumen.balance
  const movimientosDelPeriodo = vista === 'semana' ? semanal.movimientos : resumen.movimientos
  const gruposDelPeriodo = vista === 'semana' ? semanal.grupos : resumen.grupos
  const registradoHastaHoy = estaEnCurso(mes)

  if (detalle === 'entro') {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
        <EntroDetalle
          vista={vista}
          mes={mes}
          moneda={moneda}
          periodoLabel={periodoLabel}
          total={entro}
          movimientos={movimientosDelPeriodo}
          onCerrar={cerrarDetalle}
        />
      </div>
    )
  }

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
          <span className="text-[15px] text-ink-dim">Entró</span>
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
            {resumen.porRevisar.map((movimiento) => {
              const abierto = corrigiendo === movimiento.id
              return (
                <li key={movimiento.id} className="border-b border-border/40 py-3 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] leading-snug text-ink">{movimiento.concepto}</span>
                    <span className="shrink-0 font-mono text-[13.5px] text-ink-faint">
                      {formatearMonto(movimiento.monto, moneda)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="idea-destino mt-1"
                    onClick={() => setCorrigiendo(abierto ? null : movimiento.id)}
                  >
                    Elegir categoría
                  </button>
                  {abierto ? (
                    <div className="idea-destinos mt-2" role="group" aria-label="Elegir categoría">
                      {CATEGORIAS.map((categoria) => (
                        <button
                          key={categoria}
                          type="button"
                          className="idea-destino"
                          onClick={() => corregirCategoria(movimiento, categoria)}
                        >
                          {CATEGORIA_LABEL[categoria]}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </li>
              )
            })}
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

      {movimientosDelPeriodo.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Movimientos recientes</h2>
          <ul className="flex flex-col">
            {movimientosDelPeriodo.slice(0, 5).map((movimiento) => (
              <MovimientoRow
                key={movimiento.id}
                movimiento={movimiento}
                moneda={moneda}
                signo={movimiento.tipo === 'ingreso' ? '+' : ''}
              />
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
