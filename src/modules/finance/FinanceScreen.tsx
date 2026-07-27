import { useMemo, useState, type FormEvent } from 'react'
import { useFinance } from './useFinance'
import { EmptyState } from '@/components/ui/EmptyState'
import type { FinanceAccountTipo, FinanceMovimientoTipo } from '@/types/finance'

const TIPO_LABEL: Record<FinanceAccountTipo, string> = {
  liquidez: 'Liquidez',
  inversion: 'Inversión',
  deuda: 'Deuda',
}

const MONEY = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function formatMoney(valor: number): string {
  return MONEY.format(valor)
}

function sumaPorTipo(cuentas: readonly { tipo: FinanceAccountTipo; saldo: number }[], tipo: FinanceAccountTipo): number {
  return cuentas.filter((c) => c.tipo === tipo).reduce((total, c) => total + c.saldo, 0)
}

/**
 * Threshold Experience V1 — "Finanzas empieza, no una planilla": lo
 * único que hace esta pantalla es sumar lo que ya está guardado. Nunca
 * un gráfico, nunca una barra de progreso decorativa (Regla 7): cada
 * número se lee como una frase, igual que el resto del Estudio.
 * Patrimonio Neto/Liquidez/Inversiones/Deudas se derivan de una sola
 * lista de cuentas agrupada por `tipo` — nunca se guardan por separado,
 * así que nunca pueden desincronizarse entre sí.
 */
export function FinanceScreen() {
  const { accounts, movimientos, goals, ready, addAccount, updateAccount, addMovimiento, addGoal, updateGoal } = useFinance()
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [creatingMovimiento, setCreatingMovimiento] = useState(false)
  const [creatingGoal, setCreatingGoal] = useState(false)

  const liquidez = useMemo(() => sumaPorTipo(accounts, 'liquidez'), [accounts])
  const inversion = useMemo(() => sumaPorTipo(accounts, 'inversion'), [accounts])
  const deuda = useMemo(() => sumaPorTipo(accounts, 'deuda'), [accounts])
  const patrimonioNeto = liquidez + inversion - deuda

  const cashFlow = useMemo(() => {
    const mesActual = new Date().toISOString().slice(0, 7)
    const delMes = movimientos.filter((m) => m.fecha.startsWith(mesActual))
    const ingresos = delMes.filter((m) => m.tipo === 'ingreso').reduce((total, m) => total + m.monto, 0)
    const egresos = delMes.filter((m) => m.tipo === 'egreso').reduce((total, m) => total + m.monto, 0)
    return { ingresos, egresos, neto: ingresos - egresos }
  }, [movimientos])

  if (!ready) return null

  const sinNada = accounts.length === 0 && movimientos.length === 0 && goals.length === 0

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pt-2">
      <section>
        <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Patrimonio neto</h2>
        <p className="text-[28px] text-ink">{formatMoney(patrimonioNeto)}</p>
        <p className="mt-1 text-[13.5px] text-ink-faint">
          Liquidez {formatMoney(liquidez)} · Inversiones {formatMoney(inversion)} · Deudas {formatMoney(deuda)}
        </p>
      </section>

      <section>
        <h2 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Flujo de caja de este mes</h2>
        <p className="text-[19px] text-ink-dim">{formatMoney(cashFlow.neto)}</p>
        <p className="mt-1 text-[13.5px] text-ink-faint">
          Ingresos {formatMoney(cashFlow.ingresos)} · Egresos {formatMoney(cashFlow.egresos)}
        </p>
        {creatingMovimiento ? (
          <NuevoMovimientoForm
            onCreate={(input) => {
              void addMovimiento(input)
              setCreatingMovimiento(false)
            }}
            onCancel={() => setCreatingMovimiento(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreatingMovimiento(true)}
            className="mt-2 text-[13px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
          >
            Registrar movimiento
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Cuentas</h2>
        {accounts.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center justify-between gap-3">
                <span className="text-[15px] text-ink-dim">{account.nombre}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[12px] text-ink-faint">{TIPO_LABEL[account.tipo]}</span>
                  <input
                    type="number"
                    step="any"
                    defaultValue={account.saldo}
                    onBlur={(event) => {
                      const saldo = Number(event.target.value)
                      if (!Number.isNaN(saldo) && saldo !== account.saldo) void updateAccount(account.id, { saldo })
                    }}
                    aria-label={`Saldo de ${account.nombre}`}
                    className="w-24 border-b border-border/60 bg-transparent text-right text-[14px] text-ink outline-none focus:border-accent/70"
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {creatingAccount ? (
          <NuevaCuentaForm
            onCreate={(input) => {
              void addAccount(input)
              setCreatingAccount(false)
            }}
            onCancel={() => setCreatingAccount(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreatingAccount(true)}
            className="mt-2 text-[13px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
          >
            Agregar cuenta
          </button>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-faint">Metas</h2>
        {goals.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {goals.map((goal) => (
              <li key={goal.id} className="flex items-center justify-between gap-3">
                <span className="text-[15px] text-ink-dim">{goal.texto}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    defaultValue={goal.actual}
                    onBlur={(event) => {
                      const actual = Number(event.target.value)
                      if (!Number.isNaN(actual) && actual !== goal.actual) void updateGoal(goal.id, { actual })
                    }}
                    aria-label={`Progreso de ${goal.texto}`}
                    className="w-20 border-b border-border/60 bg-transparent text-right text-[14px] text-ink outline-none focus:border-accent/70"
                  />
                  <span className="text-[12px] text-ink-faint">de {formatMoney(goal.objetivo)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {creatingGoal ? (
          <NuevaMetaForm
            onCreate={(input) => {
              void addGoal(input)
              setCreatingGoal(false)
            }}
            onCancel={() => setCreatingGoal(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreatingGoal(true)}
            className="mt-2 text-[13px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
          >
            Agregar meta
          </button>
        )}
      </section>

      {sinNada ? (
        <EmptyState
          title="Todavía no hay nada acá."
          description="Agregá una cuenta para que Patrimonio Neto empiece a significar algo."
        />
      ) : null}
    </div>
  )
}

function NuevaCuentaForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: { nombre: string; tipo: FinanceAccountTipo; saldo: number }) => void
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<FinanceAccountTipo>('liquidez')
  const [saldo, setSaldo] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nombre.trim()) return
    onCreate({ nombre, tipo, saldo: Number(saldo) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2.5">
      <input
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        placeholder="Nombre de la cuenta"
        className="border-b border-border/60 bg-transparent pb-1 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-accent/70"
      />
      <div className="flex gap-4" role="radiogroup" aria-label="Tipo de cuenta">
        {(Object.keys(TIPO_LABEL) as FinanceAccountTipo[]).map((valor) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={tipo === valor}
            onClick={() => setTipo(valor)}
            className={`text-[13px] ${tipo === valor ? 'text-ink' : 'text-ink-faint'}`}
          >
            {TIPO_LABEL[valor]}
          </button>
        ))}
      </div>
      <input
        type="number"
        step="any"
        value={saldo}
        onChange={(event) => setSaldo(event.target.value)}
        placeholder="Saldo actual"
        className="border-b border-border/60 bg-transparent pb-1 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-accent/70"
      />
      <div className="flex gap-4">
        <button type="submit" className="self-start text-[13.5px] text-accent">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="self-start text-[13.5px] text-ink-faint">
          Cancelar
        </button>
      </div>
    </form>
  )
}

function NuevoMovimientoForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: { tipo: FinanceMovimientoTipo; monto: number; concepto: string }) => void
  onCancel: () => void
}) {
  const [tipo, setTipo] = useState<FinanceMovimientoTipo>('ingreso')
  const [monto, setMonto] = useState('')
  const [concepto, setConcepto] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!monto) return
    onCreate({ tipo, monto: Number(monto) || 0, concepto })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2.5">
      <div className="flex gap-4" role="radiogroup" aria-label="Tipo de movimiento">
        <button
          type="button"
          role="radio"
          aria-checked={tipo === 'ingreso'}
          onClick={() => setTipo('ingreso')}
          className={`text-[13px] ${tipo === 'ingreso' ? 'text-ink' : 'text-ink-faint'}`}
        >
          Ingreso
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={tipo === 'egreso'}
          onClick={() => setTipo('egreso')}
          className={`text-[13px] ${tipo === 'egreso' ? 'text-ink' : 'text-ink-faint'}`}
        >
          Egreso
        </button>
      </div>
      <input
        type="number"
        step="any"
        value={monto}
        onChange={(event) => setMonto(event.target.value)}
        placeholder="Monto"
        className="border-b border-border/60 bg-transparent pb-1 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-accent/70"
      />
      <input
        value={concepto}
        onChange={(event) => setConcepto(event.target.value)}
        placeholder="Concepto (opcional)"
        className="border-b border-border/60 bg-transparent pb-1 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-accent/70"
      />
      <div className="flex gap-4">
        <button type="submit" className="self-start text-[13.5px] text-accent">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="self-start text-[13.5px] text-ink-faint">
          Cancelar
        </button>
      </div>
    </form>
  )
}

function NuevaMetaForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: { texto: string; objetivo: number }) => void
  onCancel: () => void
}) {
  const [texto, setTexto] = useState('')
  const [objetivo, setObjetivo] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!texto.trim() || !objetivo) return
    onCreate({ texto, objetivo: Number(objetivo) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2.5">
      <input
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="¿Qué querés lograr?"
        className="border-b border-border/60 bg-transparent pb-1 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-accent/70"
      />
      <input
        type="number"
        step="any"
        value={objetivo}
        onChange={(event) => setObjetivo(event.target.value)}
        placeholder="Objetivo"
        className="border-b border-border/60 bg-transparent pb-1 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-accent/70"
      />
      <div className="flex gap-4">
        <button type="submit" className="self-start text-[13.5px] text-accent">
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="self-start text-[13.5px] text-ink-faint">
          Cancelar
        </button>
      </div>
    </form>
  )
}
