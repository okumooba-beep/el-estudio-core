import type { ReactNode } from 'react'

/** Chrome compartido por las 4 pantallas de auth — mismo lenguaje visual que AjustesScreen (font-mono uppercase para el título, tarjeta centrada, nada nuevo). */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="font-mono text-[11px] uppercase tracking-wide text-accent">{title}</h1>
        {children}
      </div>
    </div>
  )
}

export const authInputClass =
  'border-b border-border/60 bg-transparent px-1 py-2 text-[15px] text-ink outline-none placeholder:text-ink-dim'
