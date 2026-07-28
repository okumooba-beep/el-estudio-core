import { useEffect, useState } from 'react'

function saludo(hora: number): string {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/**
 * Build Core V1: el título deja de ser "Hoy" fijo y pasa a saludar —
 * la apertura del Core es el primer segundo de los cinco que pide el
 * brief, así que tiene que sentirse dirigida a la persona, no a la
 * fecha. La hora sigue viniendo del mismo reloj de siempre (setInterval
 * 30s, sin cambios), solo que ahora también elige qué palabra usar.
 */
export function HoyHeader() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const date = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)

  return (
    <header>
      <h1 className="text-[28px] font-medium tracking-tight text-ink text-balance">{saludo(now.getHours())}</h1>
      <p className="mt-1.5 font-mono text-[11px] uppercase tracking-wide text-accent">{date}</p>
    </header>
  )
}
