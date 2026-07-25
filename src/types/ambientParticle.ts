export interface AmbientParticlePosition {
  x: number
  y: number
}

/**
 * Motas de polvo suspendidas en la luz de la habitación — no partículas
 * de videojuego. Prácticamente invisibles: solo se notan cuando la luz
 * de la ventana o la lámpara las atraviesa. Reservado para cuando
 * Ambient Particles se implemente (ver
 * src/components/room/AmbientParticles.tsx). No implementado todavía.
 */
export interface AmbientParticleDefinition {
  id: string
  position: AmbientParticlePosition
  driftDurationMs: number
  /** Opacidad máxima al cruzar la luz — debe mantenerse casi imperceptible. */
  maxOpacity: number
}
