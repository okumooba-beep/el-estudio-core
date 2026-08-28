import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { MODULES } from '@/app/modules'
import { ESPACIOS_MODULE } from '@modules/today/public'
import { MODULE_ICONS } from '@design-system/icons/ModuleIcons'

function linkClass(isActive: boolean): string {
  return [
    'flex items-center gap-2.5 rounded-(--radius-sm) px-3 py-2 text-[14px] transition-colors active:opacity-70 motion-reduce:transition-none',
    isActive ? 'text-ink font-medium' : 'text-ink-faint hover:text-ink-dim',
  ].join(' ')
}

const TOP_LEVEL_PATHS = new Set(MODULES.map((mod) => mod.path))

/**
 * iOS Safari: al abrir el teclado, `visualViewport` se achica pero
 * `position: fixed` sigue anclado al layout viewport completo (el que
 * incluye el área tapada por el teclado) — la barra inferior queda
 * desplazada hacia arriba con un espacio vacío debajo, en vez de pegada
 * al borde inferior real y visible. Se corrige empujándola con
 * `transform` la diferencia exacta entre ambos viewports, recalculada
 * en cada resize/scroll de `visualViewport` (Safari dispara `scroll`
 * ahí, no en `window`, cuando el teclado sube/baja).
 */
function useNavAncladaAlViewportVisual<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport) return

    function reanclar() {
      const nav = ref.current
      if (!nav || !visualViewport) return
      const tapadoPorTeclado = window.innerHeight - visualViewport.height - visualViewport.offsetTop
      nav.style.transform = tapadoPorTeclado > 0 ? `translateY(-${tapadoPorTeclado}px)` : ''
    }

    reanclar()
    visualViewport.addEventListener('resize', reanclar)
    visualViewport.addEventListener('scroll', reanclar)
    return () => {
      visualViewport.removeEventListener('resize', reanclar)
      visualViewport.removeEventListener('scroll', reanclar)
    }
  }, [])

  return ref
}

export function AppShell() {
  // Sprint 036: rutas como /auditoria viven dentro de Espacios pero no
  // tienen ítem propio en el nav — cualquier ruta que no sea de primer
  // nivel se considera "absorbida" por Espacios a efectos del ítem activo.
  // Fuente única de verdad: la ruta actual (useLocation), nunca un
  // booleano local duplicado.
  const { pathname } = useLocation()
  const espaciosAbsorbeRuta = pathname !== '/' && !TOP_LEVEL_PATHS.has(pathname)
  const navInferiorRef = useNavAncladaAlViewportVisual<HTMLElement>()

  function isModuleActive(mod: (typeof MODULES)[number], routerActive: boolean): boolean {
    if (mod.path === ESPACIOS_MODULE.path && espaciosAbsorbeRuta) return true
    return routerActive
  }

  return (
    <div className="mx-auto flex h-dvh max-w-6xl overflow-hidden md:gap-6">
      <aside className="hidden shrink-0 flex-col justify-between border-r border-border/40 px-4 py-6 md:flex md:w-52">
        <div>
          <p className="mb-8 px-3 font-mono text-[11px] tracking-[0.15em] text-ink-faint">EL ESTUDIO</p>
          <nav className="flex flex-col gap-1">
            {MODULES.map((mod) => {
              const Icon = MODULE_ICONS[mod.path]
              return (
                <NavLink
                  key={mod.path}
                  to={mod.path}
                  end={mod.path === '/'}
                  className={({ isActive }) => linkClass(isModuleActive(mod, isActive))}
                >
                  {Icon ? <Icon width={16} height={16} className="shrink-0" /> : null}
                  {mod.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </aside>

      {/*
        Sprint 036: el scroll pasa a vivir acá adentro (h-dvh + overflow-y-auto),
        nunca en <body>. Antes <main> crecía con el contenido (min-h-dvh) y el
        documento entero scrolleaba — con contenido largo como Auditoría eso
        dispara más ciclos de ocultamiento de la barra del navegador que módulos
        cortos, y la habitación (fixed inset-0 + background-size:cover en
        index.html) recalcula su "cover" contra ese viewport visual cambiante,
        el mismo mecanismo ya diagnosticado en el comentario de body:has(...)
        más arriba y en el Sprint 031 (ver index.html). Con <body>/#root fijos
        en 100dvh y el scroll contenido acá, ese viewport visual nunca cambia
        por navegar contenido — la foto nunca se re-ancla.
      */}
      <main className="h-dvh flex-1 overflow-y-auto pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[calc(1.25rem+env(safe-area-inset-right))] pb-28 pl-[calc(1.25rem+env(safe-area-inset-left))] md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      <nav
        ref={navInferiorRef}
        className="nav-inferior fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:hidden"
      >
        {MODULES.map((mod) => {
          const Icon = MODULE_ICONS[mod.path]
          return (
            <NavLink
              key={mod.path}
              to={mod.path}
              end={mod.path === '/'}
              className={({ isActive }) =>
                [
                  'mx-1 my-1.5 flex min-h-14 min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-2 pb-1 pt-1.5 text-[11px] transition-colors active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100',
                  isModuleActive(mod, isActive) ? 'nav-inferior-item-activo font-medium text-accent' : 'text-ink-faint',
                ].join(' ')
              }
            >
              {Icon ? <Icon width={20} height={20} /> : null}
              {mod.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
