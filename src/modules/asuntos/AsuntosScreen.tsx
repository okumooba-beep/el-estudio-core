import { useState } from 'react'
import { useIdeas } from '@modules/work-table/public'
import { EmptyState } from '@/components/ui/EmptyState'
import { AsuntoRow } from './AsuntoRow'
import { estadoDe } from './estados'
import type { Idea } from '@/types/idea'

/** Todo lo que todavía requiere atención — pendiente y en espera son la misma cosa de cara al usuario. */
function esPendiente(asunto: Idea): boolean {
  const estado = estadoDe(asunto)
  return estado === 'pendiente' || estado === 'en-espera'
}

/**
 * Asuntos (sprint "Redefinir y reconstruir UX de Asuntos") — reemplaza
 * el concepto de Sprint 005 ("depende de otra persona") por uno más
 * amplio: una bandeja de memoria operativa para cosas que no quiero
 * olvidar y que todavía requieren algún tipo de atención. No todo
 * asunto depende de alguien más, tiene fecha, o es una misión — por eso
 * la fila ya no pide "¿de quién se espera?" sino simplemente
 * "Pendiente: qué hay que hacer o recordar".
 *
 * Mismo modelo que antes (`Idea` con destino='asuntos', sin tabla
 * propia): `texto` sigue siendo el título, `contraparte` se reinterpreta
 * como "Pendiente" (mismo campo, ningún dato viejo se pierde), y los
 * cuatro valores de `estado` (vía `estadoDe()`, sin tocar) colapsan a dos
 * grupos visuales: Pendientes arriba, Resueltos abajo y ocultos detrás
 * de "Ver historial" — nunca una pestaña ni un filtro nuevo.
 *
 * Un asunto nunca se convierte en misión, evento de Agenda ni movimiento
 * de Finanzas: cuando deja de requerir atención se resuelve, y lo que
 * sigue (si hace falta) se crea a mano en el módulo que corresponda —
 * los módulos quedan independientes, así que esta pantalla no ofrece
 * ningún botón "convertir".
 *
 * No importa `@world` (dependency-cruiser `module-no-world`): las
 * excepciones son código anterior a F16 y un módulo nuevo no las hereda.
 */
export function AsuntosScreen() {
  const { ideas, ready, add, update, remove } = useIdeas()
  const [draftTitulo, setDraftTitulo] = useState<string | null>(null)
  const [draftPendiente, setDraftPendiente] = useState('')
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const asuntos = ideas.filter((idea) => idea.destino === 'asuntos')
  const pendientes = asuntos.filter(esPendiente)
  const resueltos = asuntos.filter((asunto) => !esPendiente(asunto))

  function handleNuevoAsunto() {
    setDraftTitulo('')
    setDraftPendiente('')
  }

  function cancelarNuevo() {
    setDraftTitulo(null)
    setDraftPendiente('')
  }

  async function handleGuardarNuevo() {
    const titulo = (draftTitulo ?? '').trim()
    if (!titulo) return
    const pendiente = draftPendiente.trim()
    const creado = await add(titulo, { destino: 'asuntos', origen: 'asuntos' })
    if (pendiente) await update(creado.id, { contraparte: pendiente })
    setDraftTitulo(null)
    setDraftPendiente('')
  }

  function renderNuevo() {
    return draftTitulo !== null ? (
      <div className="flex flex-col gap-2">
        <input
          type="text"
          autoFocus
          value={draftTitulo}
          onChange={(event) => setDraftTitulo(event.target.value)}
          placeholder="Título"
          aria-label="Título"
          className="asunto-nuevo-input"
        />
        <input
          type="text"
          value={draftPendiente}
          onChange={(event) => setDraftPendiente(event.target.value)}
          placeholder="¿Qué hay que hacer o recordar?"
          aria-label="Pendiente"
          className="asunto-nuevo-input"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="idea-destino disabled:opacity-40"
            disabled={!draftTitulo.trim()}
            onClick={() => void handleGuardarNuevo()}
          >
            Guardar
          </button>
          <button type="button" className="idea-destino" onClick={cancelarNuevo}>
            Cancelar
          </button>
        </div>
      </div>
    ) : (
      <button type="button" className="asunto-nuevo-boton" onClick={handleNuevoAsunto}>
        + Nuevo asunto
      </button>
    )
  }

  if (!ready) return null

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
      {pendientes.length > 0 ? (
        <ul className="flex flex-col">
          {pendientes.map((asunto) => (
            <AsuntoRow
              key={asunto.id}
              asunto={asunto}
              cerrado={false}
              onEditar={(patch) => void update(asunto.id, patch)}
              onResolver={() => void update(asunto.id, { estado: 'resuelto' })}
              onEliminar={() => void remove(asunto.id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState title="Nada pendiente." description="No hay asuntos que requieran tu atención ahora." />
      )}

      {renderNuevo()}

      {resueltos.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="asunto-estado-boton self-start"
            onClick={() => setMostrarHistorial((actual) => !actual)}
            aria-expanded={mostrarHistorial}
          >
            Resueltos · {resueltos.length} · {mostrarHistorial ? 'Ocultar historial' : 'Ver historial →'}
          </button>
          {mostrarHistorial ? (
            <ul className="flex flex-col">
              {resueltos.map((asunto) => (
                <AsuntoRow
                  key={asunto.id}
                  asunto={asunto}
                  cerrado
                  onEditar={(patch) => void update(asunto.id, patch)}
                  onEliminar={() => void remove(asunto.id)}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
