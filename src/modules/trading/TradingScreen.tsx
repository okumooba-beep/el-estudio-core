import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useOperaciones } from './useOperaciones'
import {
  getChecklistTemplate,
  saveChecklistTemplate,
  newTemplateItem,
  type ChecklistTemplateItem,
} from './checklistTemplate'
import { generateId } from '@shared-kernel/id'
import type { NuevaOperacion } from './operacionRepository'
import { EmptyState } from '@/components/ui/EmptyState'
import { MUEBLES } from '@world/studio/muebles'
import { getSheetPlacement, type SheetPhysics } from '@world/studio/sheetPhysics'
import type { ChecklistItem, Operacion, OperacionLado } from '@/types/operacion'

const LADO_LABEL: Record<OperacionLado, string> = { long: 'Long', short: 'Short' }
const INSTRUMENTOS = ['NQ', 'MNQ', 'ES', 'MES'] as const

const FECHA_CORTA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })

function formatFechaCorta(fecha: string): string {
  return FECHA_CORTA.format(new Date(`${fecha}T00:00:00`))
}

function formatSignedPts(valor: number): string {
  const signo = valor > 0 ? '+' : valor < 0 ? '-' : ''
  return `${signo}${Math.abs(valor)} pts`
}

function formatSignedUSD(valor: number): string {
  const signo = valor > 0 ? '+' : valor < 0 ? '-' : ''
  return `${signo}$${Math.abs(valor)}`
}

/**
 * Sprint 3.6.1, parte 10: un solo editor de checklist, genérico sobre
 * cualquier ítem con {id, texto} — lo usa tanto el expediente (sus
 * propias reglas, con `checked`) como la plantilla global (sin
 * `checked`). No hace falta un segundo sistema de edición.
 */
function ChecklistEditor<T extends { id: string; texto: string }>({
  items,
  onChange,
  makeNew,
}: {
  items: readonly T[]
  onChange: (items: T[]) => void
  makeNew: () => T
}) {
  return (
    <div className="checklist-editor">
      {items.map((item) => (
        <div key={item.id} className="checklist-editor-fila">
          <input
            value={item.texto}
            onChange={(event) =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, texto: event.target.value } : i)))
            }
            className="checklist-editor-input"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
            className="expediente-faint text-[13px]"
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, makeNew()])}
        className="expediente-faint self-start text-[13px]"
      >
        Agregar regla
      </button>
    </div>
  )
}

/**
 * La única imagen local del expediente (Sprint 3.5, parte 5): el Blob
 * vive en IndexedDB tal cual se subió, sin optimizar y sin salir nunca
 * de la máquina. El object URL es del navegador, no del dato — se crea
 * y se libera acá, nunca se guarda.
 */
function ExpedienteCaptura({ imagen, onUpload }: { imagen: Blob | null; onUpload: (file: File) => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!imagen) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(imagen)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imagen])

  return (
    <div className="flex flex-col gap-2">
      {url ? (
        <img src={url} alt="Captura de la operación" className="expediente-imagen" />
      ) : (
        <p className="expediente-faint text-[13px]">Todavía no hay captura.</p>
      )}
      <label className="expediente-faint self-start text-[13px] cursor-pointer">
        {url ? 'Reemplazar captura' : 'Subir captura'}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onUpload(file)
            event.target.value = ''
          }}
        />
      </label>
    </div>
  )
}

/**
 * Nace en blanco sobre la misma mesa, sin `--rotation` de dispersión
 * todavía (parte 2: la física llega recién cuando la operación tiene
 * un índice real en la lista). Solo instrumento, setup y lado — el
 * resto del expediente (captura, resumen, checklist, emociones,
 * aprendizajes) se completa después de guardar, ya como operación real.
 *
 * Sprint 3.6.1, parte 1: instrumento y lado dejaban de poder elegirse
 * con claridad (texto libre, colores sin marca de selección). Ahora
 * son un selector real: instrumento de una lista fija, lado con una
 * sola marca activa — nunca ambos, nunca ninguno.
 */
function NuevaOperacionForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: NuevaOperacion) => void
  onCancel: () => void
}) {
  const [instrumento, setInstrumento] = useState<string>(INSTRUMENTOS[0])
  const [setup, setSetup] = useState('')
  const [lado, setLado] = useState<OperacionLado>('long')
  const [puntos, setPuntos] = useState('')
  const [usd, setUsd] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCreate({
      instrumento,
      setup,
      lado,
      resultadoPuntos: Number(puntos) || 0,
      resultadoUSD: Number(usd) || 0,
    })
  }

  return (
    <li className="expediente-wrap" style={{ '--rotation': '0deg' } as CSSProperties}>
      <form onSubmit={handleSubmit} className="expediente expediente-open material-paper flex flex-col gap-3">
        <div className="expediente-chips" role="group" aria-label="Instrumento">
          {INSTRUMENTOS.map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setInstrumento(valor)}
              className={`expediente-chip${instrumento === valor ? ' expediente-chip-activo' : ''}`}
            >
              {valor}
            </button>
          ))}
        </div>
        <input
          value={setup}
          onChange={(event) => setSetup(event.target.value)}
          placeholder="Setup"
          className="border-b border-[var(--paper-border)] bg-transparent pb-1 text-[14px] outline-none"
        />
        <div className="expediente-radios" role="radiogroup" aria-label="Dirección">
          {(['long', 'short'] as const).map((valor) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={lado === valor}
              onClick={() => setLado(valor)}
              className="expediente-radio"
            >
              <span
                className={`expediente-radio-marca${lado === valor ? ' expediente-radio-marca-activa' : ''}`}
                aria-hidden="true"
              />
              {LADO_LABEL[valor]}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            step="any"
            value={puntos}
            onChange={(event) => setPuntos(event.target.value)}
            placeholder="Puntos (+32 o -15)"
            className="w-1/2 border-b border-[var(--paper-border)] bg-transparent pb-1 text-[14px] outline-none"
          />
          <input
            type="number"
            step="any"
            value={usd}
            onChange={(event) => setUsd(event.target.value)}
            placeholder="USD (+640 o -220)"
            className="w-1/2 border-b border-[var(--paper-border)] bg-transparent pb-1 text-[14px] outline-none"
          />
        </div>
        <div className="flex gap-4">
          <button type="submit" className="self-start text-[13.5px]">
            Guardar
          </button>
          <button type="button" onClick={onCancel} className="expediente-faint self-start text-[13.5px]">
            Cancelar
          </button>
        </div>
      </form>
    </li>
  )
}

/**
 * El expediente (Sprint 3.5, partes 2 y 3): cerrado, solo muestra lo
 * mínimo para reconocerlo — instrumento, lado, resultado, fecha. Nunca
 * emociones ni resumen ahí. Al tocarlo se abre en la misma hoja, en
 * lectura vertical, sin tabs ni modal — Captura, Resumen, Checklist,
 * Emociones y Aprendizajes separados únicamente por una línea
 * (.expediente-bloque), nunca mezclados entre sí (parte 7).
 *
 * Sprint 3.6.1, partes 2-4: el checklist ya vive como datos propios de
 * la operación (ChecklistItem[]), se lee como una lista escrita — la
 * fila entera es clickeable, no solo el cuadrado — y puede editarse
 * (agregar/quitar/renombrar reglas) sin salir del expediente.
 */
function ExpedienteCard({
  operacion,
  open,
  placement,
  onToggle,
  onUpdate,
}: {
  operacion: Operacion
  open: boolean
  placement: SheetPhysics
  onToggle: () => void
  onUpdate: (patch: Partial<Omit<Operacion, 'id' | 'createdAt'>>) => void
}) {
  const [editingChecklist, setEditingChecklist] = useState(false)

  return (
    <li
      className="expediente-wrap"
      style={
        {
          '--rotation': `${placement.rotation}deg`,
          '--offset-x': `${placement.position?.x ?? 0}px`,
          '--offset-y': `${placement.position?.y ?? 0}px`,
          zIndex: placement.depth,
        } as CSSProperties
      }
    >
      <div className={`expediente material-paper${open ? ' expediente-open' : ''}`} onClick={open ? undefined : onToggle}>
        <p className="expediente-resumen">
          <span>{operacion.instrumento}</span>
          <span className="expediente-faint">{LADO_LABEL[operacion.lado]}</span>
          <span>{formatSignedPts(operacion.resultadoPuntos)}</span>
          <span className="expediente-resultado-usd">{formatSignedUSD(operacion.resultadoUSD)}</span>
          <span className="expediente-fecha">{formatFechaCorta(operacion.fecha)}</span>
        </p>
        {open ? (
          <div className="expediente-detalle">
            <section className="expediente-bloque">
              <h3 className="expediente-bloque-label">Captura</h3>
              <ExpedienteCaptura imagen={operacion.imagen} onUpload={(file) => onUpdate({ imagen: file })} />
            </section>
            <section className="expediente-bloque">
              <h3 className="expediente-bloque-label">Resumen</h3>
              <textarea
                key={`resumen-${operacion.id}`}
                defaultValue={operacion.resumen}
                onBlur={(event) => onUpdate({ resumen: event.target.value })}
                placeholder="¿Qué pasó en esta operación?"
                className="expediente-textarea"
              />
            </section>
            <section className="expediente-bloque">
              <h3 className="expediente-bloque-label">Checklist</h3>
              {editingChecklist ? (
                <>
                  <ChecklistEditor<ChecklistItem>
                    items={operacion.checklist}
                    onChange={(checklist) => onUpdate({ checklist })}
                    makeNew={() => ({ id: generateId(), texto: '', checked: false })}
                  />
                  <button
                    type="button"
                    onClick={() => setEditingChecklist(false)}
                    className="expediente-faint self-start text-[13px]"
                  >
                    Listo
                  </button>
                </>
              ) : (
                <div className="expediente-checklist">
                  {operacion.checklist.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="checklist-fila"
                      onClick={() =>
                        onUpdate({
                          checklist: operacion.checklist.map((c) =>
                            c.id === item.id ? { ...c, checked: !c.checked } : c,
                          ),
                        })
                      }
                    >
                      <span aria-hidden="true">{item.checked ? '☑' : '☐'}</span>
                      <span>{item.texto}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEditingChecklist(true)}
                    className="expediente-faint self-start text-[13px]"
                  >
                    Editar checklist
                  </button>
                </div>
              )}
            </section>
            <section className="expediente-bloque">
              <h3 className="expediente-bloque-label">Emociones</h3>
              <textarea
                key={`emociones-${operacion.id}`}
                defaultValue={operacion.emociones}
                onBlur={(event) => onUpdate({ emociones: event.target.value })}
                placeholder="Muy ansioso. Entré antes. Tenía miedo de perder el movimiento."
                className="expediente-textarea"
              />
            </section>
            <section className="expediente-bloque">
              <h3 className="expediente-bloque-label">Aprendizajes</h3>
              <textarea
                key={`aprendizajes-${operacion.id}`}
                defaultValue={operacion.aprendizajes}
                onBlur={(event) => onUpdate({ aprendizajes: event.target.value })}
                placeholder="Esperar cinco minutos más habría evitado la entrada impulsiva."
                className="expediente-textarea"
              />
            </section>
            <button type="button" onClick={onToggle} className="expediente-faint self-start text-[13px]">
              Cerrar expediente
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )
}

/**
 * La Mesa de Análisis (Sprint 3.5): Trading deja de ser una colección
 * de hojas de Idea y pasa a tener identidad propia — Operación, no
 * Idea (parte 1). .material-wood ya estaba reservada para esta mesa
 * (ver src/packages/world/studio/materials.ts) y getSheetPlacement es la misma
 * física que ya usa el Tablero: ningún sistema nuevo, solo un mueble
 * nuevo que ocupa lo que ya existía.
 *
 * Una operación terminada nunca desaparece (parte 8): no hay acción de
 * borrar ni de archivar — la lista completa queda siempre a la vista.
 *
 * Sprint 3.6.1, partes 5-6: "Editar plantilla" cambia solo la
 * plantilla local (localStorage) que copian las próximas operaciones
 * al nacer — nunca toca las que ya existen.
 */
export function TradingScreen() {
  const { operaciones, ready, add, update } = useOperaciones()
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(false)
  const [template, setTemplate] = useState<ChecklistTemplateItem[]>(() => getChecklistTemplate())

  async function handleCreate(input: NuevaOperacion) {
    const created = await add(input)
    setCreating(false)
    setOpenId(created.id)
  }

  function handleTemplateChange(items: ChecklistTemplateItem[]) {
    setTemplate(items)
    saveChecklistTemplate(items)
  }

  return (
    <div className="flex flex-col gap-5 pt-2" data-mueble={MUEBLES.trading}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="self-start text-[13.5px] text-ink-faint transition-colors duration-150 hover:text-ink active:text-ink"
        >
          Nueva operación
        </button>
        <button
          type="button"
          onClick={() => setEditingTemplate((current) => !current)}
          className="self-start text-[12px] text-ink-faint/70 transition-colors duration-150 hover:text-ink active:text-ink"
        >
          Editar plantilla
        </button>
      </div>
      {editingTemplate ? (
        <div className="material-paper expediente-plantilla">
          <h3 className="expediente-bloque-label">Plantilla del checklist</h3>
          <ChecklistEditor<ChecklistTemplateItem> items={template} onChange={handleTemplateChange} makeNew={newTemplateItem} />
          <p className="expediente-faint text-[12px]">Solo afecta a las próximas operaciones.</p>
        </div>
      ) : null}
      {!ready ? null : operaciones.length === 0 && !creating ? (
        <EmptyState
          title="Ningún expediente vive acá todavía."
          description="Tocá 'Nueva operación' para abrir el primero."
        />
      ) : (
        <div className="material-wood mesa-analisis">
          <ul className="mesa-expedientes">
            {creating ? <NuevaOperacionForm onCreate={handleCreate} onCancel={() => setCreating(false)} /> : null}
            {operaciones.map((operacion, index) => (
              <ExpedienteCard
                key={operacion.id}
                operacion={operacion}
                open={openId === operacion.id}
                placement={getSheetPlacement(index)}
                onToggle={() => setOpenId((current) => (current === operacion.id ? null : operacion.id))}
                onUpdate={(patch) => {
                  void update(operacion.id, patch)
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
