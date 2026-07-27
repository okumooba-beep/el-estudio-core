/**
 * Threshold Experience V1 — Biblioteca de Sabiduría: la colección
 * curada de frases propias del usuario, distinta de las 50 frases
 * genéricas del Manifiesto (ver src/packages/world/phrases/phrases.ts,
 * que sí son del Estudio, no de la persona). Arranca vacía a propósito
 * — ninguna frase fabricada acá; el Estudio nunca inventa sabiduría
 * ajena. Agregar una frase real es sumar un objeto a este array, en el
 * mismo formato que el comentario de abajo muestra: ningún otro
 * archivo necesita cambiar cuando esta lista crece.
 */
export interface Quote {
  readonly text: string
  readonly author?: string
}

// Pega tus frases reales acá, una por línea, en este formato exacto:
// { text: 'La disciplina es el puente entre metas y logros.', author: 'Jim Rohn' },
export const QUOTES: readonly Quote[] = []
