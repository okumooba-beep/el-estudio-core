import { Spaces } from './components/Spaces'

/**
 * Sprint 015.4 ("Navegación global de El Estudio Core"): pantalla propia
 * para `Spaces` (components/Spaces.tsx) — el mismo componente que Sprint
 * 015.1 dejó de mostrar dentro de Home, ahora alcanzable desde su propia
 * ruta (`/espacios`, nav inferior/sidebar) en vez de forzarlo de vuelta
 * al contenido de Home.
 */
export function EspaciosScreen() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-10">
      <Spaces />
    </div>
  )
}
