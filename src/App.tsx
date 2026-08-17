import { useEffect } from 'react'
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
import { FrasesScreen } from '@modules/frases/public'
import { MaterialInspector } from '@/dev-tools/material-inspector/MaterialInspector'
import { DesignSystemGallery } from '@/features/dev/DesignSystemGallery'
import { useAmbientLight } from '@world/light/useAmbientLight'

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

function App() {
  useAmbientLight()
  useRouteAttribute()

  return (
    <>
      <RoomBackground />
      <Routes>
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
          <Route path="espacios" element={<EspaciosScreen />} />
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
