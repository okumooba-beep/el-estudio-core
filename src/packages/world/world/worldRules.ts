export interface WorldRule {
  readonly id: string
  readonly principle: string
}

/**
 * World Rules: los principios de este lugar. No contiene UI ni lógica —
 * es la lista contra la que se puede chequear cualquier decisión futura
 * ("¿esto rompe alguna de estas reglas?"). Debe poder crecer con el
 * proyecto: agregar una regla nueva nunca debería requerir tocar nada
 * más que este arreglo.
 */
export const WORLD_RULES: readonly WorldRule[] = [
  { id: 'room-fixed', principle: 'La habitación nunca cambia de lugar.' },
  { id: 'light-gradual', principle: 'La luz nunca cambia bruscamente.' },
  {
    id: 'physical-plausibility',
    principle: 'Todo efecto visual debe existir en una habitación real, o no pertenece.',
  },
  { id: 'no-rewards', principle: 'Los objetos nunca aparecen por recompensas.' },
  { id: 'object-history', principle: 'Todo objeto tiene una historia.' },
  { id: 'reasoned-appearance', principle: 'Nada aparece sin una razón.' },
  { id: 'purposeful-persistence', principle: 'Nada permanece sin un propósito.' },
  { id: 'no-reward-collection', principle: 'La habitación no colecciona recompensas. Conserva historia.' },
  { id: 'objects-are-discovered', principle: 'Los objetos no aparecen. Se descubren.' },
  {
    id: 'physical-evidence',
    principle: 'Nada cambia sin evidencia. Si una marca existe, existe una causa. Nunca decoración, siempre historia.',
  },
  { id: 'ai-never-teaches', principle: 'La IA nunca enseña.' },
  { id: 'ai-remembers', principle: 'La IA recuerda.' },
  {
    id: 'world-precedes-user',
    principle: 'El usuario nunca crea el lugar. El lugar ya existe. El usuario simplemente entra.',
  },
  {
    id: 'aging-is-shared-time',
    principle: 'Los objetos envejecen por tiempo real compartido. Nunca por puntos, logros ni recompensas.',
  },
  {
    id: 'understanding-before-asking',
    principle: 'El Estudio primero intenta comprender. Solo pregunta cuando no comprende.',
  },
  {
    id: 'understanding-is-humble',
    principle: 'Comprender no significa tener razón. Significa hacer una propuesta humilde.',
  },
  { id: 'one-door', principle: 'Todo pensamiento entra por una sola puerta.' },
  { id: 'every-thought-deserves-a-home', principle: 'Todo pensamiento merece encontrar un hogar.' },
  {
    id: 'reduce-mental-load',
    principle: 'El Estudio reduce carga mental, no agrega decisiones.',
  },
  {
    id: 'furniture-serves-thought',
    principle: 'Los muebles existen porque ayudan a pensar mejor, no porque sean bonitos.',
  },
  { id: 'furniture-reduces-decisions', principle: 'Los muebles existen para reducir decisiones.' },
  { id: 'sheet-belongs-to-one-place', principle: 'Cada hoja pertenece a un único lugar.' },
  { id: 'sheet-never-disappears', principle: 'Una hoja nunca desaparece. Solo cambia de hogar.' },
  {
    id: 'materials-define-objects',
    principle: 'Los objetos no definen los materiales. Los materiales definen los objetos.',
  },
]
