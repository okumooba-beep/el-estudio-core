import { useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { useFinance } from './useFinance'
import { AnilloCategorias } from './AnilloCategorias'
import { CATEGORIAS, CATEGORIA_COLOR, CATEGORIA_LABEL, type FinanceCategoria } from './categorias'
import { extraerMovimiento } from './extraccion'
import { formatearMonto, mesDe, resumirMes } from './mes'
import type { Idea } from '@/types/idea'

/**
 * Finanzas (Sprint de Producto 004) — el motor de movimientos.
 *
 * La pantalla anterior abría con Patrimonio Neto, Liquidez, Inversiones
 * y Deudas calculados sobre saldos cargados a mano, antes de que
 * existiera un solo movimiento. EL_ESTUDIO_CORE.md rechaza exactamente
 * esa inversión: "Primero registras. Después El Estudio organiza." Y
 * también: "No queremos balances. No queremos patrimonio neto."
 *
 * Ahora la pantalla es el mes. Escribís "Gasté 80k en gasolina" en el
 * Umbral, la hoja aterriza acá, y el motor saca monto, tipo y categoría
 * sin que elijas nada. Lo que no puede resolver —un texto sin número—
 * espera, visible, hasta que lo completes: el Umbral resuelve dónde, el
 * módulo resuelve qué falta (Contrato del Umbral §10).
 *
 * Las tablas de cuentas y metas siguen existiendo intactas en Dexie;
 * simplemente ya no gobiernan la pantalla. Nada se borró.
 */
export function FinanceScreen() {
  const { movimientos, ready, addMovimiento } = useFinance()
  const { ideas } = useIdeas()
  const [mes] = useState(() => mesDe(new Date()))
  const [editando, setEditando] = useState<string | null>(null)

  const resumen = useMemo(() => resumirMes(movimientos, mes), [movimientos, mes])
  const convertidas = useMemo(
    () => new Set(movimientos.map((movimiento) => movimiento.ideaId).filter(Boolean)),
    [movimientos],
  )

  /** Capturas que el Umbral mandó acá y todavía no son un movimiento. */
  const pendientes = ideas.filter((idea) => idea.destino === 'finanzas' && !convertidas.has(idea.id))

  async function registrar(idea: Idea, categoria?: FinanceCategoria) {
    const extraido = extraerMovimiento(idea.texto)
    if (extraido.monto === null) return
    await addMovimiento({
      tipo: extraido.tipo,
      monto: extraido.monto,
      concepto: idea.texto,
      categoria: categoria ?? extraido.categoria,
      ideaId: idea.id,
      fecha: idea.fecha,
    })
    setEditando(null)
  }

  if (!ready) return null

  const nombreMes = new Date(`${mes}-02`).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const sinNada = resumen.movimientos.length === 0 && pendientes.length === 0

  if (sinNada) {
    return (
      <EmptyState
        title="Todavía no se movió un peso."
        description="Escribí un gasto en el Umbral — “Gasté 80k en gasolina” — y el Estudio lo trae acá con su categoría."
      />
    )
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <section className="flex flex-col items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent">{nombreMes}</p>
        <AnilloCategorias grupos={resumen.grupos} total={formatearMonto(resumen.gastado)} />
        {resumen.ingresado > 0 ? (
          <p className="font-mono text-[12.5px] text-ink-faint">
            Entró {formatearMonto(resumen.ingresado)} · Balance{' '}
            <span className={resumen.balance >= 0 ? 'text-good' : 'text-critical'}>
              {formatearMonto(resumen.balance)}
            </span>
          </p>
        ) : null}
      </section>

      {pendientes.length > 0 ? (
        <section>
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Sin registrar</h2>
          <ul className="flex flex-col">
            {pendientes.map((idea) => {
              const extraido = extraerMovimiento(idea.texto)
              const abierto = editando === idea.id
              return (
                <li key={idea.id} className="border-b border-border/40 py-3 last:border-b-0">
                  <p className="text-[16px] leading-snug text-ink">{idea.texto}</p>
                  {extraido.monto === null ? (
                    <p className="mt-1 text-[13px] text-ink-faint">
                      No encontré un monto. Escribilo de nuevo con la cifra.
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] text-ink-dim">{formatearMonto(extraido.monto)}</span>
                      <button type="button" className="idea-destino" onClick={() => registrar(idea)}>
                        {CATEGORIA_LABEL[extraido.categoria]}
                      </button>
                      <button
                        type="button"
                        className="idea-destino"
                        onClick={() => setEditando(abierto ? null : idea.id)}
                      >
                        Otra categoría
                      </button>
                    </div>
                  )}
                  {abierto ? (
                    <div className="idea-destinos mt-2" role="group" aria-label="Elegir categoría">
                      {CATEGORIAS.map((categoria) => (
                        <button
                          key={categoria}
                          type="button"
                          className="idea-destino"
                          onClick={() => registrar(idea, categoria)}
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

      {resumen.grupos.length > 0 ? (
        <section>
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-accent">En qué se fue</h2>
          <ul className="flex flex-col gap-3">
            {resumen.grupos.map((grupo) => (
              <li key={grupo.categoria} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex items-center gap-2 text-[15px] text-ink">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CATEGORIA_COLOR[grupo.categoria] }}
                      aria-hidden="true"
                    />
                    {CATEGORIA_LABEL[grupo.categoria]}
                  </span>
                  <span className="font-mono text-[14px] text-ink-dim">{formatearMonto(grupo.total)}</span>
                </div>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${grupo.parte * 100}%`, backgroundColor: CATEGORIA_COLOR[grupo.categoria] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {resumen.movimientos.length > 0 ? (
        <section>
          <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Movimientos</h2>
          <ul className="flex flex-col">
            {resumen.movimientos.map((movimiento) => (
              <li
                key={movimiento.id}
                className="flex items-baseline justify-between gap-3 border-b border-border/40 py-2.5 last:border-b-0"
              >
                <span className="text-[15px] leading-snug text-ink-dim">{movimiento.concepto}</span>
                <span
                  className={[
                    'shrink-0 font-mono text-[13.5px]',
                    movimiento.tipo === 'ingreso' ? 'text-good' : 'text-ink-faint',
                  ].join(' ')}
                >
                  {movimiento.tipo === 'ingreso' ? '+' : ''}
                  {formatearMonto(movimiento.monto)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
