/**
 * Superficie pública del módulo Work Table (F15, ARCHITECTURE_RATIFIED.md
 * roadmap F15 / Foundation §17.2): lo único que `habitos`, `diario` y
 * `misiones` pueden importar de este módulo. El resto (IdeaCapture,
 * DeskPaperStack, ideaRepository, destinoFurniture, moveSheet, silentSave)
 * es interno.
 */
export { useIdeas } from './useIdeas'
export { IdeaSheet } from './IdeaSheet'
export { draftIdea, DRAFT_ID } from './draftIdea'
