import { HoyHeader } from './components/HoyHeader'
import { PhraseSlot } from './components/PhraseSlot'
import { IdeaCapture } from '@modules/work-table/IdeaCapture'
import { ContinueWorking } from './components/ContinueWorking'
import { MisionPrincipal } from './components/MisionPrincipal'
import { HabitsGlance } from './components/HabitsGlance'
import { RecentActivity } from './components/RecentActivity'
import { Spaces } from './components/Spaces'

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
 * ahora con más aire y una línea real donde escribir) → Seguir con
 * esto (lo último que se tocó, cualquier destino) → Misión principal
 * (lo que más tiempo espera) → Hábitos de hoy (vistazo, nunca la
 * grilla completa) → Actividad reciente (Idea.history leído desde
 * afuera por primera vez) → Espacios (los 6 lugares reales — Diario,
 * Misiones, Hábitos, Trading, Finanzas, Biblioteca; el brief sugería
 * también "Planning" y "AI", ninguno de los dos existe como destino,
 * mueble o pantalla en el Estudio, así que no se fabrican — ver
 * spaceRegistry.ts y el reporte de este sprint).
 *
 * El sistema de cámara/habitación que ocupaba este lugar en "Build V1"
 * (features/room, features/workspace, features/memoria,
 * components/room/{RoomObjects,objects/*}) ya no existe en el árbol:
 * este sprint sí lo borra (a diferencia de "Build V1", que lo dejó
 * documentado como bloqueo) porque el brief lo autoriza explícitamente
 * ("delete obsolete presentation code... never preserve something
 * because it already exists") y `npx tsc -b` confirmó cero imports
 * rotos tras borrarlo.
 */
export function HoyScreen() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8 pb-10">
      <div>
        <HoyHeader />
        <PhraseSlot />
      </div>
      <IdeaCapture />
      <ContinueWorking />
      <MisionPrincipal />
      <HabitsGlance />
      <RecentActivity />
      <Spaces />
    </div>
  )
}
