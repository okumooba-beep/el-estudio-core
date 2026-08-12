import { HoyHeader } from './components/HoyHeader'
import { PhraseSlot } from './components/PhraseSlot'
import { FraseHoy } from './components/FraseHoy'
import { Proximo } from './components/Proximo'
import { MisionesPrincipales } from './components/MisionesPrincipales'
import { IdeaCapture } from '@modules/work-table/IdeaCapture'
import { AttentionSummary } from './components/AttentionSummary'
import { useAgendaHoy } from '@modules/agenda/public'
import { useMisionesPrincipales } from '@modules/missions/public'

/**
 * EL ESTUDIO CORE (Build Core V1): esta pantalla deja de llamarse "Hoy"
 * puertas afuera — es el lugar donde empieza y vuelve cada día, no un
 * dashboard ni la lista de módulos que era en "Build V1". El fondo
 * (RoomBackground, montado en App.tsx) ya no es un cuarto que se
 * recorre — es solo atmósfera detrás de esta aplicación real (ver
 * ajustes de src/index.css: blur en ambas luces, viñeta superior sutil
 * para que el saludo nunca compita con el brillo de la ventana).
 *
 * Orden (un flujo, no una grilla de tarjetas — Bible cap. 11):
 * Saludo + fecha + voz ambiental → Umbral (única puerta de entrada,
 * ahora con más aire y una línea real donde escribir) → Espacios (los 6
 * lugares reales — Diario, Misiones, Hábitos, Trading, Finanzas,
 * Biblioteca; el brief sugería también "Planning" y "AI", ninguno de
 * los dos existe como destino, mueble o pantalla en el Estudio, así
 * que no se fabrican — ver spaceRegistry.ts y el reporte de este
 * sprint).
 *
 * Sprint "Product Refocus" — Misión principal, Hábitos de hoy y
 * Actividad reciente se quitan de Hoy: el brief pide que Home sea "a
 * place to begin, never a summary screen", y las tres eran vistazos de
 * estado de otros muebles (Misiones, Hábitos, historial), exactamente
 * lo que el propio test anti-dashboard de la Biblia (cap. 4: "si dos
 * señales compiten por atención al mismo tiempo, Today está mal
 * diseñado") ya prohibía en espíritu. No se borran los componentes
 * (`MisionPrincipal.tsx`, `HabitsGlance.tsx`, `RecentActivity.tsx`
 * siguen en el árbol, sin importar de acá) — Home deja de mostrarlos,
 * no deja de existir la función; un sprint futuro puede reusarlos en
 * otro lugar si corresponde (Regla 4).
 *
 * Sprint "Home como puerta de entrada": por el mismo motivo, "Seguir
 * con esto" (`ContinueWorking`) también deja de mostrarse acá — es un
 * resumen de dónde se quedó el usuario en otro mueble, y Home responde
 * "¿qué querés hacer ahora?", nunca "¿qué estabas haciendo?". El
 * componente sigue existiendo en components/ContinueWorking.tsx, solo
 * sin importar de esta pantalla.
 *
 * El sistema de cámara/habitación que ocupaba este lugar en "Build V1"
 * (features/room, features/workspace, features/memoria,
 * components/room/{RoomObjects,objects/*}) ya no existe en el árbol:
 * este sprint sí lo borra (a diferencia de "Build V1", que lo dejó
 * documentado como bloqueo) porque el brief lo autoriza explícitamente
 * ("delete obsolete presentation code... never preserve something
 * because it already exists") y `npx tsc -b` confirmó cero imports
 * rotos tras borrarlo.
 *
 * Core V2 — jerarquía visual: el grupo "hoy" (saludo, voz, Umbral,
 * Seguir con esto) respira junto porque es un solo momento; Espacios
 * cierra con más distancia porque es la salida, no parte del flujo del
 * día.
 *
 * Core V3 — `HoyScreen` decide qué Idea es "Seguir con esto"
 * (`selectContinueWorking`) porque `useIdeas()` ya comparte una sola
 * carga y un solo estado reactivo entre instancias (ver useIdeas.ts,
 * Core V3), así que calcularla acá y pasarla por prop es gratis.
 *
 * Sprint 015 ("Home como eje del día"): jerarquía nueva HOY → PRÓXIMO →
 * MISIÓN PRINCIPAL → ATENCIÓN, todas leyendo el mismo estado real de
 * Agenda/Misiones (nunca datos nuevos, nunca una copia). `useAgendaHoy()`
 * se llama una única vez acá (useAgenda no es un singleton compartido —
 * ver agenda/useAgenda.ts) y baja como props a FraseHoy/Proximo/
 * AttentionSummary para no repetir la carga de IndexedDB.
 *
 * Sprint 015.1 ("Recuperar el alma de Home"): Sprint 015 acertó en la
 * información pero la presentación se sentía como un dashboard.
 * `PhraseSlot` (voz ambiental de Ideas, `voiceEngine`) vuelve a esta
 * pantalla en una posición secundaria, debajo del saludo — es identidad
 * del lugar, no información funcional, y por eso nunca reemplaza a
 * `FraseHoy` (que sigue siendo la lectura determinista del día): las dos
 * conviven porque responden preguntas distintas ("¿qué es este lugar?"
 * vs. "¿cómo está mi día?"), punto 1/2. La lista de "Espacios" (todos
 * los módulos con ícono y navegación) se deja de mostrar acá — ya están
 * a un toque de distancia por la navegación existente y repetirlos
 * convertía a Home en un menú (punto 10); `Spaces.tsx` sigue existiendo
 * sin importar de acá, mismo criterio que MisionPrincipal/HabitsGlance/
 * RecentActivity/ContinueWorking. Cada sección se oculta sola cuando no
 * hay nada relevante (punto 2, punto 10) — Home nunca fuerza un bloque
 * vacío.
 */
export function HoyScreen() {
  const { ahora, proximo, atencion, resumen, ready } = useAgendaHoy()
  const misionesPrincipales = useMisionesPrincipales()

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-10 pb-10">
      <div className="flex flex-col gap-6">
        <div>
          <HoyHeader />
          <div className="mt-4">
            <PhraseSlot />
          </div>
          <FraseHoy atencion={atencion} resumen={resumen} ready={ready} />
        </div>
        <IdeaCapture />
      </div>
      <Proximo ahora={ahora} proximo={proximo} ready={ready} />
      <MisionesPrincipales misiones={misionesPrincipales} />
      <AttentionSummary atencion={atencion} />
    </div>
  )
}
