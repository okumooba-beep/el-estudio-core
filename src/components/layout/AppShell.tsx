import { NavLink, Outlet } from 'react-router-dom'
import { MODULES } from '@/app/modules'

function linkClass(isActive: boolean): string {
  return [
    'rounded-(--radius-sm) px-3 py-2 text-[14px] transition-colors active:opacity-70 motion-reduce:transition-none',
    isActive ? 'text-ink font-medium' : 'text-ink-faint hover:text-ink-dim',
  ].join(' ')
}

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl md:gap-6">
      <aside className="hidden shrink-0 flex-col justify-between border-r border-border/40 px-4 py-6 md:flex md:w-52">
        <div>
          <p className="mb-8 px-3 font-mono text-[11px] tracking-[0.15em] text-ink-faint/80">LIFEOS</p>
          <nav className="flex flex-col gap-1">
            {MODULES.map((mod) => (
              <NavLink key={mod.path} to={mod.path} end={mod.path === '/'} className={({ isActive }) => linkClass(isActive)}>
                {mod.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-h-dvh flex-1 pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[calc(1.25rem+env(safe-area-inset-right))] pb-28 pl-[calc(1.25rem+env(safe-area-inset-left))] md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border/40 bg-surface/95 pr-[env(safe-area-inset-right)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pt-1 backdrop-blur md:hidden">
        {MODULES.map((mod) => (
          <NavLink
            key={mod.path}
            to={mod.path}
            end={mod.path === '/'}
            className={({ isActive }) =>
              [
                'flex min-h-11 min-w-[3.5rem] items-center justify-center rounded-(--radius-sm) px-2 py-3 text-[12px] transition-colors active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100',
                isActive ? 'text-ink font-medium' : 'text-ink-faint',
              ].join(' ')
            }
          >
            {mod.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
