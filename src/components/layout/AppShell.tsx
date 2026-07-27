import { NavLink, Outlet } from 'react-router-dom'
import { MODULES } from '@/app/modules'
import { MODULE_ICONS } from '@design-system/icons/ModuleIcons'

function linkClass(isActive: boolean): string {
  return [
    'flex items-center gap-2.5 rounded-(--radius-sm) px-3 py-2 text-[14px] transition-colors active:opacity-70 motion-reduce:transition-none',
    isActive ? 'text-ink font-medium' : 'text-ink-faint hover:text-ink-dim',
  ].join(' ')
}

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl md:gap-6">
      <aside className="hidden shrink-0 flex-col justify-between border-r border-border/40 px-4 py-6 md:flex md:w-52">
        <div>
          <p className="mb-8 px-3 font-mono text-[11px] tracking-[0.15em] text-ink-faint">EL ESTUDIO</p>
          <nav className="flex flex-col gap-1">
            {MODULES.map((mod) => {
              const Icon = MODULE_ICONS[mod.path]
              return (
                <NavLink key={mod.path} to={mod.path} end={mod.path === '/'} className={({ isActive }) => linkClass(isActive)}>
                  {Icon ? <Icon width={16} height={16} className="shrink-0" /> : null}
                  {mod.label}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </aside>

      <main className="min-h-dvh flex-1 pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[calc(1.25rem+env(safe-area-inset-right))] pb-28 pl-[calc(1.25rem+env(safe-area-inset-left))] md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      <nav className="nav-inferior fixed inset-x-0 bottom-0 z-10 flex items-stretch justify-around pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] md:hidden">
        {MODULES.map((mod) => {
          const Icon = MODULE_ICONS[mod.path]
          return (
            <NavLink
              key={mod.path}
              to={mod.path}
              end={mod.path === '/'}
              className={({ isActive }) =>
                [
                  'flex min-h-14 min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-2 pb-1 pt-2.5 text-[11px] transition-colors active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100',
                  isActive ? 'font-medium text-accent' : 'text-ink-faint',
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
