/**
 * Memoria espacial de la habitación (Sprint "Room Memory v1.0"): hoy cada
 * estación vuelve a su estado original al cerrarse — eso es lo que hace
 * que el cuarto se sienta software, no un lugar. Esto no es memoria de
 * negocio (Misiones/Hábitos/Ideas ya tienen la suya, con su propio
 * storage) — es memoria de POSICIÓN: qué pose tenía cada objeto la
 * última vez que alguien estuvo ahí.
 *
 * Mismo patrón que gaze.ts: un singleton de módulo, nunca localStorage.
 * Es estado real del cuarto durante esta visita, no una preferencia que
 * deba sobrevivir a cerrar la pestaña — un lugar real tampoco "recuerda"
 * después de que se apaga la luz.
 *
 * Deliberadamente sin decaimiento ni timers: cada rastro es una marca
 * binaria que aparece la primera vez que se usa el objeto y se mantiene
 * el resto de la sesión — "nada dramático, nada que distraiga" (brief
 * del sprint). Un reloj de desvanecimiento hubiera sido una segunda
 * arquitectura entera para un sprint que pide sumar lo mínimo.
 */
interface RoomMemory {
  journalAjar: boolean
  librarySelection: { fila: string; indice: number } | null
  planningBoardTab: string | null
  workspaceActive: boolean
}

const memory: RoomMemory = {
  journalAjar: false,
  librarySelection: null,
  planningBoardTab: null,
  workspaceActive: false,
}

export function setJournalAjar(ajar: boolean): void {
  memory.journalAjar = ajar
}

export function getJournalAjar(): boolean {
  return memory.journalAjar
}

export function setLibrarySelection(selection: { fila: string; indice: number } | null): void {
  memory.librarySelection = selection
}

export function getLibrarySelection(): { fila: string; indice: number } | null {
  return memory.librarySelection
}

export function setPlanningBoardTab(tab: string): void {
  memory.planningBoardTab = tab
}

export function getPlanningBoardTab(): string | null {
  return memory.planningBoardTab
}

/** Marca el escritorio como usado y devuelve si YA lo estaba antes de esta visita — la pregunta que le importa a la pantalla del monitor ("¿llego frío o ya venía tibio?"), no si está en uso ahora mismo. */
export function markWorkspaceActiveAndWasActive(): boolean {
  const wasActive = memory.workspaceActive
  memory.workspaceActive = true
  return wasActive
}
