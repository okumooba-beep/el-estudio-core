import { useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { MUEBLES } from '@world/studio/muebles'
import type { Idea } from '@/types/idea'

/** Sprint 006: nunca configurable, nunca un contador — el número vive únicamente acá. */
const MAX_ACTIVAS = 5

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

  const misiones = ideas.filter((idea) => idea.destino === 'misiones')
  const pendientes = misiones.filter((m) => m.estado !== 'terminada' && m.estado !== 'completada')
  const activas = [...pendientes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, MAX_ACTIVAS)

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
    await add(texto, { destino: 'misiones', origen: 'misiones' })
  }

  function handleDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  if (!ready) return null

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10" data-mueble={MUEBLES.misiones}>
      {activas.length === 0 ? (
        <EmptyState title="Nada que hacer todavía." description="Agregá lo primero que dependa solo de vos." />
      ) : (
        <ul className="mision-lista">
          {activas.map((mision) => (
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
          ))}
        </ul>
      )}

      {draftTexto !== null ? (
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
      ) : (
        <button type="button" className="mision-nuevo-boton" onClick={handleNuevaMision}>
          + Nueva misión
        </button>
      )}
    </div>
  )
}
