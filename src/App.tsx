import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RoomBackground } from '@/components/room/RoomBackground'
import { HoyScreen } from '@modules/today/HoyScreen'
import { EspaciosScreen } from '@modules/today/EspaciosScreen'
import { AsuntosScreen } from '@modules/asuntos/public'
import { MisionesScreen } from '@modules/missions/MisionesScreen'
import { HabitosScreen } from '@modules/habits/HabitosScreen'
import { TradingScreen } from '@modules/trading/TradingScreen'
import { DiarioScreen } from '@modules/journal/DiarioScreen'
import { FinanceScreen } from '@modules/finance/FinanceScreen'
import { AgendaScreen } from '@modules/agenda/AgendaScreen'
import { AuditoriaScreen } from '@modules/auditoria/AuditoriaScreen'
import { NotesScreen } from '@modules/notes/NotesScreen'
import { AjustesScreen } from '@modules/settings/AjustesScreen'
import { FrasesScreen } from '@modules/frases/public'
import { MaterialInspector } from '@/dev-tools/material-inspector/MaterialInspector'
import { DesignSystemGallery } from '@/features/dev/DesignSystemGallery'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { RegisterScreen } from '@/features/auth/RegisterScreen'
import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen'
import { ResetPasswordScreen } from '@/features/auth/ResetPasswordScreen'
import { RequireAuth } from '@/lib/auth/RequireAuth'
import { useAuth } from '@/lib/auth/AuthContext'
import { forceNotesResync } from '@/lib/sync/bootstrap'
import { isPushSupported, subscribeToPush, sendTestPush } from '@/lib/push/pushClient'
import { useAmbientLight } from '@world/light/useAmbientLight'
import {
  FONDOS,
  aplicarFondo,
  leerFondoGuardado,
  aplicarPosicionX,
  leerPosicionXGuardada,
  type PosicionX,
} from '@/lib/room/roomBackgrounds'
import {
  obtenerFondoSeleccionado,
  setFondoSeleccionado,
  obtenerPosicionXSeleccionada,
  setPosicionXSeleccionada,
} from '@/lib/room/roomBackgroundClient'

/**
 * Sprint 018 ("Home: recuperar el lugar"): RoomBackground se monta una
 * sola vez fuera de las rutas (ver abajo), así que la ventana/lámpara
 * son un único mecanismo global sin forma de reaccionar por pantalla.
 * En vez de tocar ese motor compartido (afectaría a Misiones, Agenda,
 * etc.) o reescribirlo, se refleja la ruta activa en el DOM — mismo
 * mecanismo ya usado por setGaze() (html[data-gaze], ver
 * packages/world/world/gaze.ts) — para que src/index.css pueda acotar
 * un ajuste solo a Home (html[data-route="hoy"]) sin cambiar nada del
 * resto de la app.
 */
function useRouteAttribute() {
  const location = useLocation()
  useEffect(() => {
    const route = location.pathname === '/' ? 'hoy' : null
    if (route) {
      document.documentElement.dataset.route = route
    } else {
      delete document.documentElement.dataset.route
    }
    return () => {
      delete document.documentElement.dataset.route
    }
  }, [location.pathname])
}

/**
 * Sprint ROOM: el fondo elegido ya pintó antes del primer paint desde
 * localStorage (ver src/light-bootstrap.ts) — esto solo lo reconcilia
 * contra Supabase una vez que la sesión resuelve, para que un usuario que
 * cambió de fondo en otro dispositivo lo vea acá también. Mismo patrón
 * que forceNotesResync/hydrateNotesFromSupabase (src/lib/sync/bootstrap.ts),
 * pero sin Dexie: una sola lectura, no una cola offline.
 */
function useFondoDeHabitacion(userId: string | undefined) {
  const [fondoActivo, setFondoActivo] = useState<string>(() => leerFondoGuardado())
  const [posicionXActiva, setPosicionXActiva] = useState<PosicionX>(() => leerPosicionXGuardada())

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    void obtenerFondoSeleccionado(userId).then((fondoId) => {
      if (cancelado || !fondoId) return
      aplicarFondo(fondoId)
      setFondoActivo(fondoId)
    })
    void obtenerPosicionXSeleccionada(userId).then((posicionX) => {
      if (cancelado || !posicionX) return
      if (posicionX !== 'left' && posicionX !== 'center' && posicionX !== 'right') return
      aplicarPosicionX(posicionX)
      setPosicionXActiva(posicionX)
    })
    return () => {
      cancelado = true
    }
  }, [userId])

  async function seleccionarFondo(fondoId: string): Promise<'ok' | 'sin-sesion' | 'error'> {
    aplicarFondo(fondoId)
    setFondoActivo(fondoId)
    if (!userId) return 'sin-sesion'
    return setFondoSeleccionado(userId, fondoId)
  }

  async function seleccionarPosicionX(posicionX: PosicionX): Promise<'ok' | 'sin-sesion' | 'error'> {
    aplicarPosicionX(posicionX)
    setPosicionXActiva(posicionX)
    if (!userId) return 'sin-sesion'
    return setPosicionXSeleccionada(userId, posicionX)
  }

  return { fondoActivo, seleccionarFondo, posicionXActiva, seleccionarPosicionX }
}

function App() {
  useAmbientLight()
  useRouteAttribute()
  const { user, signOut } = useAuth()
  const { fondoActivo, seleccionarFondo, posicionXActiva, seleccionarPosicionX } = useFondoDeHabitacion(user?.id)

  return (
    <>
      <RoomBackground />
      <Routes>
        <Route path="login" element={<LoginScreen />} />
        <Route path="registro" element={<RegisterScreen />} />
        <Route path="olvide-password" element={<ForgotPasswordScreen />} />
        <Route path="restablecer-password" element={<ResetPasswordScreen />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<HoyScreen />} />
            <Route path="misiones" element={<MisionesScreen />} />
            <Route path="asuntos" element={<AsuntosScreen />} />
            <Route path="habitos" element={<HabitosScreen />} />
            <Route path="trading" element={<TradingScreen />} />
            <Route path="diario" element={<DiarioScreen />} />
            <Route path="frases" element={<FrasesScreen />} />
            <Route path="finanzas" element={<FinanceScreen />} />
            <Route path="agenda" element={<AgendaScreen />} />
            <Route path="auditoria" element={<AuditoriaScreen />} />
            <Route path="notas" element={<NotesScreen />} />
            <Route
              path="ajustes"
              element={
                <AjustesScreen
                  accountEmail={user?.email ?? null}
                  onSignOut={signOut}
                  onForceNotesResync={user ? () => forceNotesResync(user.id) : null}
                  pushSupported={isPushSupported()}
                  onSubscribePush={user ? () => subscribeToPush(user.id) : null}
                  onSendTestPush={user ? () => sendTestPush() : null}
                  fondos={FONDOS}
                  fondoActivo={fondoActivo}
                  onSelectFondo={seleccionarFondo}
                  posicionXActiva={posicionXActiva}
                  onSelectPosicionX={seleccionarPosicionX}
                />
              }
            />
            <Route path="espacios" element={<EspaciosScreen />} />
          </Route>
        </Route>
        {/* Material Inspector (Sprint 2.4, punto 07): fuera de AppShell a propósito — no es un lugar del Estudio, es una herramienta de desarrollo. Nunca existe en producción. */}
        {import.meta.env.DEV ? <Route path="dev/materiales" element={<MaterialInspector />} /> : null}
        {/* Design System Gallery (Sprint F11, Parte I §2): mismo patrón que Material Inspector — fuera de AppShell, nunca en producción. */}
        {import.meta.env.DEV ? <Route path="dev/design-system" element={<DesignSystemGallery />} /> : null}
      </Routes>
    </>
  )
}

export default App
