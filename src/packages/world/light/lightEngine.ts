export interface LightState {
  canvas: string
  surface: string
  surfaceAlt: string
  ink: string
  inkDim: string
  inkFaint: string
  border: string
  accent: string
  accentSoft: string
  good: string
  warn: string
  critical: string
  windowOpacity: number
  lampOpacity: number
}

type Rgb = readonly [number, number, number]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpRgb(a: Rgb, b: Rgb, t: number): string {
  const r = Math.round(lerp(a[0], b[0], t))
  const g = Math.round(lerp(a[1], b[1], t))
  const bl = Math.round(lerp(a[2], b[2], t))
  return `rgb(${r} ${g} ${bl})`
}

function lerpRgba(a: Rgb, b: Rgb, t: number, alphaA: number, alphaB: number): string {
  const r = Math.round(lerp(a[0], b[0], t))
  const g = Math.round(lerp(a[1], b[1], t))
  const bl = Math.round(lerp(a[2], b[2], t))
  const alpha = lerp(alphaA, alphaB, t)
  return `rgba(${r}, ${g}, ${bl}, ${alpha.toFixed(2)})`
}

/**
 * Extremos de la habitación: madrugada profunda vs. mediodía.
 * Todo color intermedio es una interpolación continua de estos dos,
 * nunca un salto entre estados discretos.
 */
/*
 * La identidad de El Estudio es cálida: madera, cuero, luz de lámpara —
 * nunca el azul frío de una app corporativa (Sprint 3, "Finding the
 * Studio"). NIGHT ya no es una noche digital (azul-negro) sino una
 * noche de estudio (carbón cálido, casi marrón): el mismo tono que ya
 * tienen .material-wood/.material-leather, para que la habitación y
 * los objetos que contiene compartan una sola temperatura de color.
 * accent deja de ser azul (DAY y NIGHT) y pasa a cobre — el color de
 * la lámpara, nunca el de un botón de SaaS.
 */
/*
 * Sprint "Visual Refinement" — inkFaint medía ~3.78:1 (NIGHT) y ~3.09:1
 * (DAY) contra canvas: por debajo del mínimo AA (4.5:1) en los dos
 * extremos del ciclo, no solo en el arranque nocturno estático que
 * documentaba el comentario de index.css. Ambos valores suben de
 * luminancia relativa (NIGHT: texto claro más claro; DAY: texto oscuro
 * más oscuro — canvas es casi blanco a mediodía) hasta despejar AA con
 * margen (~4.87:1 y ~4.90:1), sin tocar el resto de la paleta ni el
 * propio canvas — la habitación no se ilumina más, solo el texto que
 * menos contraste tenía. accent se corre al dorado más saturado del
 * mockup de referencia (#D8A24A en NIGHT — coincide exacto), que de
 * paso mejora su propio contraste (7.40:1 → 8.36:1); DAY.accent baja de
 * luminancia en la misma dirección de tono para seguir despejando AA
 * (4.01:1 → 4.82:1) contra el canvas casi blanco del mediodía.
 */
const NIGHT = {
  canvas: [18, 15, 12],
  surface: [27, 22, 18],
  surfaceAlt: [36, 29, 23],
  ink: [237, 229, 218],
  inkDim: [176, 163, 149],
  inkFaint: [138, 127, 112],
  border: [46, 38, 31],
  accent: [216, 162, 74],
  good: [111, 174, 133],
  warn: [201, 154, 85],
  critical: [201, 122, 115],
} satisfies Record<string, Rgb>

const DAY = {
  canvas: [246, 244, 241],
  surface: [255, 255, 255],
  surfaceAlt: [232, 229, 225],
  ink: [27, 26, 31],
  inkDim: [99, 96, 107],
  inkFaint: [108, 105, 115],
  border: [219, 215, 209],
  accent: [140, 100, 42],
  good: [62, 122, 84],
  warn: [162, 115, 46],
  critical: [168, 67, 61],
} satisfies Record<string, Rgb>

/** 0 = noche cerrada, 1 = luz de día plena. Un solo ciclo suave por día. */
function daylightAt(date: Date): number {
  const t = date.getHours() + date.getMinutes() / 60
  const phase = ((t - 13) / 24) * Math.PI * 2
  return (Math.cos(phase) + 1) / 2
}

export function computeLight(date: Date = new Date()): LightState {
  const daylight = daylightAt(date)
  const lamp = Math.min(0.92, Math.max(0.18, 1 - daylight * 0.75))

  return {
    canvas: lerpRgb(NIGHT.canvas, DAY.canvas, daylight),
    surface: lerpRgb(NIGHT.surface, DAY.surface, daylight),
    surfaceAlt: lerpRgb(NIGHT.surfaceAlt, DAY.surfaceAlt, daylight),
    ink: lerpRgb(NIGHT.ink, DAY.ink, daylight),
    inkDim: lerpRgb(NIGHT.inkDim, DAY.inkDim, daylight),
    inkFaint: lerpRgb(NIGHT.inkFaint, DAY.inkFaint, daylight),
    border: lerpRgb(NIGHT.border, DAY.border, daylight),
    accent: lerpRgb(NIGHT.accent, DAY.accent, daylight),
    accentSoft: lerpRgba(NIGHT.accent, DAY.accent, daylight, 0.12, 0.1),
    good: lerpRgb(NIGHT.good, DAY.good, daylight),
    warn: lerpRgb(NIGHT.warn, DAY.warn, daylight),
    critical: lerpRgb(NIGHT.critical, DAY.critical, daylight),
    windowOpacity: 0.08 + daylight * 0.55,
    lampOpacity: lamp * 0.42,
  }
}
