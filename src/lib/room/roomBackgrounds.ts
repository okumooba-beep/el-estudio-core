import { readJSON, writeJSON } from '@shared-kernel/storage/localStorage'

/**
 * Sprint ROOM ("eliminar motor de luz + banco de fondos"): cada fondo ya
 * trae su propia luz y atmósfera — por eso el motor de luz direccional
 * (.room-layer-window/.room-layer-lamp, ver src/index.css) se eliminó por
 * completo en vez de aprender a orientarse por imagen. La foto vive en
 * --room-photo (CSS var sobre :root, mismo mecanismo que --canvas/
 * --surface en src/packages/world/light/applyLight.ts) para poder
 * cambiarla en caliente desde Ajustes sin tocar index.html — .room-layer-
 * photo (index.css) ya la usa como fallback.
 *
 * Vive en src/lib/ (no en un módulo ni en world) por la misma razón que
 * src/lib/push/pushClient.ts: `module-no-app-tree`/`module-no-world` en
 * .dependency-cruiser.cjs prohíben que src/modules/settings importe de
 * src/lib o src/packages/world directo. App.tsx importa estas funciones
 * y se las pasa a AjustesScreen como props.
 */
export interface FondoOption {
  id: string
  label: string
  archivo: string
}

export const FONDOS: FondoOption[] = [
  { id: 'brutalismo_minimalismo_1', label: 'Brutalismo minimalista', archivo: 'brutalismo_minimalismo_1.png' },
  { id: 'brutalismo_noche', label: 'Brutalismo — noche', archivo: 'brutalismo_noche.png' },
  { id: 'campo_3', label: 'Campo', archivo: 'campo_3.png' },
  { id: 'ciudad_1_dia', label: 'Ciudad — día', archivo: 'ciudad_1_dia.png' },
  { id: 'ciudad_2_noche', label: 'Ciudad — noche', archivo: 'ciudad_2_noche.png' },
  { id: 'ciudad_noche_3', label: 'Ciudad de noche', archivo: 'ciudad_noche_3.png' },
  { id: 'costa_1_dia', label: 'Costa — día', archivo: 'costa_1_dia.png' },
  { id: 'desierto_1', label: 'Desierto', archivo: 'desierto_1.png' },
  { id: 'futurista_1', label: 'Futurista', archivo: 'futurista_1.png' },
  { id: 'minimal_zen_1', label: 'Minimal zen', archivo: 'minimal_zen_1.png' },
  { id: 'montana_2', label: 'Montaña', archivo: 'montana_2.png' },
  { id: 'naturaleza_1', label: 'Naturaleza', archivo: 'naturaleza_1.png' },
  { id: 'piedra_natural_1', label: 'Piedra natural', archivo: 'piedra_natural_1.png' },
  { id: 'playa_1', label: 'Playa', archivo: 'playa_1.png' },
  { id: '33', label: '33', archivo: '33.png' },
]

/** North Star: el fondo por defecto cuando el usuario nunca eligió uno. */
export const FONDO_DEFAULT = '33'

const CLAVE_LOCAL = 'room.fondo'

function urlDeFondo(id: string): string {
  const fondo = FONDOS.find((f) => f.id === id) ?? FONDOS.find((f) => f.id === FONDO_DEFAULT)
  return `/room/backgrounds/${fondo!.archivo}`
}

/** Última elección conocida en este dispositivo — lectura síncrona, para pintar antes de que React monte (ver src/light-bootstrap.ts). */
export function leerFondoGuardado(): string {
  return readJSON(CLAVE_LOCAL, FONDO_DEFAULT)
}

/** Escribe --room-photo en :root (mismo mecanismo que applyLight) y cachea la elección en este dispositivo. */
export function aplicarFondo(id: string): void {
  document.documentElement.style.setProperty('--room-photo', `url('${urlDeFondo(id)}')`)
  writeJSON(CLAVE_LOCAL, id)
}
