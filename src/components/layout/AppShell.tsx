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

export function AppShell() {
  // Sprint 036: rutas como /auditoria viven dentro de Espacios pero no
  // tienen ítem propio en el nav — cualquier ruta que no sea de primer
  // nivel se considera "absorbida" por Espacios a efectos del ítem activo.
  // Fuente única de verdad: la ruta actual (useLocation), nunca un
  // booleano local duplicado.
  const { pathname } = useLocation()
  const espaciosAbsorbeRuta = pathname !== '/' && !TOP_LEVEL_PATHS.has(pathname)

  function isModuleActive(mod: (typeof MODULES)[number], routerActive: boolean): boolean {
    if (mod.path === ESPACIOS_MODULE.path && espaciosAbsorbeRuta) return true
    return routerActive
  }

  return (
    <div className="h-dvh-safe relative mx-auto flex max-w-6xl flex-col overflow-hidden md:flex-row md:gap-6">
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
        Sprint 036: el scroll pasa a vivir acá adentro (min-h-0 + flex-1 +
        overflow-y-auto), nunca en <body>. Antes <main> crecía con el
        contenido (min-h-dvh) y el documento entero scrolleaba — con
        contenido largo como Auditoría eso dispara más ciclos de
        ocultamiento de la barra del navegador que módulos cortos, y la
        habitación (fixed inset-0 + background-size:cover en index.html)
        recalcula su "cover" contra ese viewport visual cambiante, el mismo
        mecanismo ya diagnosticado en el comentario de body:has(...) más
        arriba y en el Sprint 031 (ver index.html). Con <body>/#root fijos
        en 100dvh y el scroll contenido acá, ese viewport visual nunca
        cambia por navegar contenido — la foto nunca se re-ancla.

        `min-h-0` es necesario porque este <main> es un hijo flex dentro de
        un padre flex-column de altura fija (ver arriba): sin él, un hijo
        flex no baja de su min-height de contenido por default y el propio
        <main> crece más allá de la altura fija de la columna en vez de
        scrollear puertas adentro.

        `pb-28` (mobile): el nav pasó a ser una pill flotante en overlay
        (position:absolute, ver .nav-inferior en index.css) — ya no es un
        hijo flex que reserva su propio espacio, así que el <main> no lo
        "sabe" y el contenido scrolleable necesita este colchón propio
        para no terminar tapado detrás de la pill al hacer scroll hasta
        el final.
      */}
      <main className="min-h-0 flex-1 overflow-y-auto pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[calc(1.25rem+env(safe-area-inset-right))] pb-28 pl-[calc(1.25rem+env(safe-area-inset-left))] md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      {/*
        Pill flotante: position:absolute (ver .nav-inferior en index.css)
        contra el propio div raíz de AppShell (`relative`, 100dvh/100vh
        vía .h-dvh-safe) — nunca contra el viewport crudo con
        position:fixed, para no reintroducir el desfasaje
        visualViewport/innerHeight que ya se había resuelto sacando el
        JS de useNavAncladaAlViewportVisual. Al ser absolute, deja de
        participar del flex del padre — por eso ya no lleva `shrink-0` ni
        el padding de safe-area que antes tenía (ahora vive en
        .nav-inferior como margin-bottom/left/right).
      */}
      <nav className="nav-inferior z-10 flex items-stretch justify-around md:hidden">
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
