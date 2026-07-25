import { useEffect } from 'react'
import { notifyAmbientAnimation } from '@world/world/ambientEvents'

/**
 * No pinta nada: escucha, en toda la habitación, cuándo termina o repite
 * cualquiera de las animaciones ambiente ya declaradas en index.css
 * (ventana, lámpara, monitores, hojas del diario, lomos de la
 * biblioteca) y las traduce a eventos de mundo (ver ambientEvents.ts).
 * Un solo listener delegado en vez de que cada objeto dispare el suyo —
 * sumar una animación ambiente nueva no requiere tocar este archivo,
 * solo agregar su nombre al mapa.
 */
export function AmbientEventBridge() {
  useEffect(() => {
    function handleAnimationEvent(event: AnimationEvent) {
      notifyAmbientAnimation(event.animationName)
    }
    document.addEventListener('animationiteration', handleAnimationEvent)
    document.addEventListener('animationend', handleAnimationEvent)
    return () => {
      document.removeEventListener('animationiteration', handleAnimationEvent)
      document.removeEventListener('animationend', handleAnimationEvent)
    }
  }, [])

  return null
}
