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
  /** Ruta pública real del archivo — todas viven en /room/backgrounds/ salvo '33', que apunta a la North Star original (/room/estudio-hero.png, ver comentario más abajo). */
  ruta: string
}

function fondoDeBanco(id: string, label: string, archivo: string): FondoOption {
  return { id, label, archivo, ruta: `/room/backgrounds/${archivo}` }
}

export const FONDOS: FondoOption[] = [
  fondoDeBanco('brutalismo_minimalismo_1', 'Brutalismo minimalista', 'brutalismo_minimalismo_1.png'),
  fondoDeBanco('brutalismo_noche', 'Brutalismo — noche', 'brutalismo_noche.png'),
  fondoDeBanco('campo_3', 'Campo', 'campo_3.png'),
  fondoDeBanco('ciudad_1_dia', 'Ciudad — día', 'ciudad_1_dia.png'),
  fondoDeBanco('ciudad_2_noche', 'Ciudad — noche', 'ciudad_2_noche.png'),
  fondoDeBanco('ciudad_noche_3', 'Ciudad de noche', 'ciudad_noche_3.png'),
  fondoDeBanco('costa_1_dia', 'Costa — día', 'costa_1_dia.png'),
  fondoDeBanco('desierto_1', 'Desierto', 'desierto_1.png'),
  fondoDeBanco('futurista_1', 'Futurista', 'futurista_1.png'),
  fondoDeBanco('minimal_zen_1', 'Minimal zen', 'minimal_zen_1.png'),
  fondoDeBanco('montana_2', 'Montaña', 'montana_2.png'),
  fondoDeBanco('naturaleza_1', 'Naturaleza', 'naturaleza_1.png'),
  fondoDeBanco('piedra_natural_1', 'Piedra natural', 'piedra_natural_1.png'),
  fondoDeBanco('playa_1', 'Playa', 'playa_1.png'),
  /*
    Sprint "Room / Ajustes: 4 cambios puntuales" (§2) — '33' es la North
    Star original (Sprint 020, ver comentario de .room-layer-photo en
    src/index.css): apunta directo a /room/estudio-hero.png, la
    composición protegida, no a la copia que el banco de 15 fondos había
    guardado en backgrounds/33.png.
  */
  { id: '33', label: '33', archivo: '33.png', ruta: '/room/estudio-hero.png' },
]

/** North Star: el fondo por defecto cuando el usuario nunca eligió uno. */
export const FONDO_DEFAULT = '33'

const CLAVE_LOCAL = 'room.fondo'

function urlDeFondo(id: string): string {
  const fondo = FONDOS.find((f) => f.id === id) ?? FONDOS.find((f) => f.id === FONDO_DEFAULT)
  return fondo!.ruta
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
