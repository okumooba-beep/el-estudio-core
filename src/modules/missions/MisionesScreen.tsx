import { useMemo, useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { MUEBLES } from '@world/studio/muebles'
import { interpretarMision } from './extraccionFecha'
import { seleccionarActivas, seleccionarPrincipales, seleccionarSecundarias } from './seleccionarPrincipales'
import { etiquetaFecha } from '@shared-kernel/text/interpretarTexto'
import type { Idea } from '@/types/idea'

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function mananaISO(): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  return fecha.toISOString().slice(0, 10)
}

/**
 * Misiones (Sprint 006 — "Sistema de ejecución"), reemplaza el Tablero
 * de Corcho de Sprint 2.3: misma pregunta ("¿qué tengo que hacer yo?"),
 * experiencia deliberadamente más chica.
 *
 * El brief pide una pantalla sin ruido y sin acumulación visual — lo
 * opuesto a un corcho con hojas rotadas y chinchetas (Sprint 2.3), así
 * que esa metáfora se retira de acá (`material-cork`/`tablero-hoja`/
 * `IdeaSheet` siguen existiendo para quien los use — Desk, Trading — no
 * se tocan). Una misión ahora es una línea de texto y un círculo: nada
 * más, porque el brief solo autoriza mostrar "qué hay que hacer" y
 * "estado".
 *
 * El límite de cinco activas es real, no visual: `activas` ya viene
 * recortada antes de tocar el DOM, así que no existe ningún "hay 8,
 * mostrando 5" en ningún lado — el resto directamente no se renderiza,
 * ni siquiera oculto. Se ordenan por más antigua primero (a diferencia
 * del Tablero, que ponía lo de hoy arriba) porque acá el punto es
 * consumir en cola: al completar una, la que sigue en el tiempo ocupa
 * el lugar sola.
 *
 * Completar no dejar tachado ni gris (brief, "Experiencia"): la
 * consecuencia es que no hay nada que "des-completar" después, así que
 * completar es directamente archivar (moveSheet → archivador, Contrato
 * del Umbral §8 — nada se borra) en el mismo gesto. Nunca se persiste
 * un estado 'completada' de forma duradera: no hace falta un valor que
 * viva más que el instante en que deja de estar a la vista.
 *
 * El filtro `!== 'terminada'` es la única concesión al diseño anterior:
 * una misión ya marcada terminada bajo ese modelo (nunca archivada,
 * porque ese paso era opcional) no debe ocupar uno de los cinco lugares
 * activos como si fuera pendiente.
 */
export function MisionesScreen() {
  const { ideas, ready, add, update, moveSheet } = useIdeas()
  const [draftTexto, setDraftTexto] = useState<string | null>(null)

  /** Sprint 014, punto 3: vista previa silenciosa mientras se escribe — nunca abre diálogos. */
  const previaDraft = useMemo(() => {
    if (!draftTexto?.trim()) return null
    const { fecha, hora } = interpretarMision(draftTexto)
    if (!fecha) return null
    return hora ? `${etiquetaFecha(fecha)} · ${hora}` : etiquetaFecha(fecha)
  }, [draftTexto])

  const activas = seleccionarActivas(ideas)

  /**
   * Sprint 013, punto 6: dos grupos automáticos, sin prioridad (eso
   * sigue siendo exclusivo de Eventos) — "principal" acá es solo
   * "programada para hoy o mañana", nada más.
   */
  const hoy = hoyISO()
  const manana = mananaISO()
  const principales = seleccionarPrincipales(activas, hoy, manana)
  const secundarias = seleccionarSecundarias(activas, hoy, manana)

  function handleCompletar(mision: Idea) {
    void moveSheet(mision, 'archivador')
  }

  function handleTextoBlur(mision: Idea, event: React.FocusEvent<HTMLSpanElement>) {
    const texto = event.currentTarget.textContent?.trim() ?? ''
    if (texto && texto !== mision.texto) void update(mision.id, { texto })
    else if (!texto) event.currentTarget.textContent = mision.texto
  }

  function handleTextoKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  function handleNuevaMision() {
    setDraftTexto('')
  }

  async function handleDraftBlur() {
    const texto = (draftTexto ?? '').trim()
    setDraftTexto(null)
    if (!texto) return
    const { fecha, hora, textoLimpio } = interpretarMision(texto)
    const creada = await add(textoLimpio || texto, { destino: 'misiones', origen: 'misiones' })
    if (fecha) await update(creada.id, { programadaFecha: fecha, programadaHora: hora })
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  function renderFila(mision: Idea) {
    return (
      <li key={mision.id} className="mision-fila">
        <button type="button" className="mision-check" aria-label="Completar" onClick={() => handleCompletar(mision)}>
          <span className="mision-check-circulo" aria-hidden="true" />
        </button>
        <span
          className="mision-texto"
          contentEditable
          suppressContentEditableWarning
          onBlur={(event) => handleTextoBlur(mision, event)}
          onKeyDown={handleTextoKeyDown}
        >
          {mision.texto}
        </span>
      </li>
    )
  }

  if (!ready) return null

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10" data-mueble={MUEBLES.misiones}>
      {activas.length === 0 ? (
        <EmptyState title="Nada que hacer todavía." description="Agregá lo primero que dependa solo de vos." />
      ) : (
        <>
          {principales.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="mision-grupo-titulo">Misiones principales</h2>
              <ul className="mision-lista">{principales.map(renderFila)}</ul>
            </div>
          )}
          {secundarias.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="mision-grupo-titulo">Misiones secundarias</h2>
              <ul className="mision-lista">{secundarias.map(renderFila)}</ul>
            </div>
          )}
        </>
      )}

      {draftTexto !== null ? (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            autoFocus
            value={draftTexto}
            onChange={(event) => setDraftTexto(event.target.value)}
            onBlur={handleDraftBlur}
            onKeyDown={handleDraftKeyDown}
            placeholder="¿Qué tenés que hacer?"
            className="mision-nuevo-input"
          />
          {previaDraft && <span className="mision-previa">{previaDraft}</span>}
        </div>
      ) : (
        <button type="button" className="mision-nuevo-boton" onClick={handleNuevaMision}>
          + Nueva misión
        </button>
      )}
    </div>
  )
}
