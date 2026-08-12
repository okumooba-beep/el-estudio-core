import type { ComponentType, SVGProps } from 'react'

/**
 * Sprint "Visual Refinement", Prioridad 5 — el nav inferior y "Espacios"
 * nunca tuvieron ícono (ver AppShell.tsx/Spaces.tsx antes de este
 * sprint): "no new libraries" descarta cualquier paquete de íconos, así
 * que estos son trazo a mano, un solo lenguaje visual (24×24, trazo
 * 1.5, sin relleno, puntas redondeadas) para los 7 destinos reales del
 * Estudio. currentColor hereda el mismo --ink/--ink-faint/--accent que
 * ya usa el texto de al lado, así que un ícono activo/inactivo cambia
 * de color exactamente igual que su label, sin estado propio.
 *
 * Vive en estudio-design-system (no en src/components) porque
 * `today-app-tree-boundaries`/`module-no-app-tree` (.dependency-cruiser.cjs)
 * prohíben que un módulo de contenido dependa de src/components — un
 * paquete leaf que cualquier módulo puede importar es el lugar
 * correcto para un primitivo visual compartido como este.
 */
type IconProps = SVGProps<SVGSVGElement>

const BASE = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
} satisfies SVGProps<SVGSVGElement>

/** Hoy — el Umbral: un vano de puerta, no una casa. */
export function HoyIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M6 20V10.5a6 6 0 0 1 12 0V20" />
      <path d="M4.5 20h15" />
    </svg>
  )
}

/** Cuaderno — una sola libreta con líneas de escritura, nunca páginas apiladas (eso es Biblioteca). */
export function CuadernoIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M6.5 4.5h8.5a1.5 1.5 0 0 1 1.5 1.5v12.5a1 1 0 0 1-1 1h-9A1.5 1.5 0 0 1 5 18V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.5 9h5M8.5 12.3h5M8.5 15.6h3" />
    </svg>
  )
}

/** Misiones — un blanco. */
export function MisionesIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Asuntos — una bandeja. El resto de los muebles guardan lo que ya es
 * tuyo; la bandeja sostiene lo que todavía está en manos de otro, así
 * que el ícono es un recipiente abierto con algo apoyado encima,
 * esperando que alguien lo retire.
 */
export function AsuntosIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M3.5 13.5v4a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4" />
      <path d="M3.5 13.5h4l1.2 2h6.6l1.2-2h4" />
      <path d="M8.5 9.5 12 6l3.5 3.5" />
      <path d="M12 6v4.5" />
    </svg>
  )
}

/** Hábitos — un círculo ya marcado. */
export function HabitosIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M9 12.3l2 2 4-4.6" />
    </svg>
  )
}

/** Trading — una línea que sube. */
export function TradingIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4 16l5-5.5 3.5 3 6.5-7.5" />
      <path d="M15 6h4.5v4.5" />
    </svg>
  )
}

/** Finanzas — una billetera. */
export function FinanzasIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M4.5 8A1.5 1.5 0 0 1 6 6.5h10A2 2 0 0 1 18 8.5" />
      <path d="M4.5 8v8A1.5 1.5 0 0 0 6 17.5h12A1.5 1.5 0 0 0 19.5 16v-6A1.5 1.5 0 0 0 18 8.5H6A1.5 1.5 0 0 1 4.5 8Z" />
      <circle cx="16" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Biblioteca — dos lomos apoyados, nunca la misma libreta de Cuaderno. */
export function BibliotecaIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <path d="M5 5.5h4.5a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
      <path d="M12.4 6.2l4.2-1.1a1 1 0 0 1 1.24.73l3 11.4a1 1 0 0 1-.71 1.22l-4.2 1.1a1 1 0 0 1-1.24-.72l-3-11.41a1 1 0 0 1 .71-1.22Z" />
    </svg>
  )
}

/** Agenda — una hoja de calendario, con dos anillas arriba y la línea que separa el encabezado. */
export function AgendaIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="4.5" y="5.5" width="15" height="14" rx="1.5" />
      <path d="M8.5 4v3M15.5 4v3" />
      <path d="M4.5 9.5h15" />
    </svg>
  )
}

/**
 * Espacios (Sprint 015.4 — "Navegación global de El Estudio Core"): la
 * planta del Estudio, mismo lenguaje arquitectónico que el vano de
 * `HoyIcon` — un plano dividido en varios cuartos, nunca la grilla de
 * apps que el brief pidió explícitamente no asumir.
 */
export function EspaciosIcon(props: IconProps) {
  return (
    <svg {...BASE} {...props}>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="M10.5 5v14M10.5 12H20" />
    </svg>
  )
}

/**
 * Un solo mapa por `path` (misma llave que ya usan MODULES y SPACES):
 * AppShell y Spaces.tsx lo consultan en vez de repetir un switch cada
 * uno.
 */
export const MODULE_ICONS: Record<string, ComponentType<IconProps>> = {
  '/': HoyIcon,
  '/diario': CuadernoIcon,
  '/misiones': MisionesIcon,
  '/asuntos': AsuntosIcon,
  '/habitos': HabitosIcon,
  '/trading': TradingIcon,
  '/finanzas': FinanzasIcon,
  '/frases': BibliotecaIcon,
  '/agenda': AgendaIcon,
  '/espacios': EspaciosIcon,
}
