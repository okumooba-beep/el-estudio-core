import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RoomBackground } from '@/components/room/RoomBackground'
import { HoyScreen } from '@modules/today/HoyScreen'
import { MisionesScreen } from '@modules/missions/MisionesScreen'
import { HabitosScreen } from '@modules/habits/HabitosScreen'
import { TradingScreen } from '@modules/trading/TradingScreen'
import { DiarioScreen } from '@modules/journal/DiarioScreen'
import { ModulePlaceholder } from '@modules/library/ModulePlaceholder'
import { MaterialInspector } from '@/dev-tools/material-inspector/MaterialInspector'
import { DesignSystemGallery } from '@/features/dev/DesignSystemGallery'
import { useAmbientLight } from '@world/light/useAmbientLight'

function App() {
  useAmbientLight()

  return (
    <>
      <RoomBackground />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HoyScreen />} />
          <Route path="misiones" element={<MisionesScreen />} />
          <Route path="habitos" element={<HabitosScreen />} />
          <Route path="trading" element={<TradingScreen />} />
          <Route path="diario" element={<DiarioScreen />} />
          <Route path="frases" element={<ModulePlaceholder title="Biblioteca de frases" />} />
          <Route path="finanzas" element={<ModulePlaceholder title="Finanzas" />} />
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
