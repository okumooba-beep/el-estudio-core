export type MaterialId = 'paper' | 'cork' | 'wood' | 'metal' | 'leather'

/**
 * Todo lo que un material debe poder responder antes de que cualquier
 * objeto pueda usarlo (Sprint 2.4, punto 01). No son animaciones ni
 * lógica — son las seis preguntas obligatorias sobre cómo existe una
 * superficie físicamente. TypeScript obliga a responder las seis: un
 * material que no puede contestar alguna todavía no está terminado.
 *
 * Dos son honestas sobre lo que falta ("todavía no") en vez de
 * inventar una respuesta — mismo criterio que Finanzas en
 * ./muebles.ts: mejor un hueco documentado que una mentira prolija.
 */
export interface MaterialProfile {
  readonly id: MaterialId
  /** Clase CSS que implementa este material hoy (ver src/index.css). */
  readonly className: string
  /** Cómo refleja la luz: mate, con brillo, con dirección. */
  readonly light: string
  /** Cómo envejece con el tiempo real compartido. */
  readonly aging: string
  /** Cómo proyecta sombra sobre lo que tiene debajo. */
  readonly shadow: string
  /** Cómo responde al foco — hover, tacto, teclado. */
  readonly focus: string
  /** Cómo responde al motor de luz de la habitación (hora del día). */
  readonly time: string
  /** Cómo responde al uso real (ver src/lib/room/objectUsage.ts). */
  readonly use: string
}

/**
 * Los materiales existen antes que los objetos (Sprint 2.4, regla del
 * mundo "los materiales definen los objetos, no al revés"). Un mueble
 * nuevo nunca debería inventar su propia superficie — debería elegir
 * uno de estos, o si ninguno alcanza, ese es el momento de agregar un
 * material nuevo acá, nunca CSS suelto dentro de un feature.
 *
 * Los materiales son agnósticos a `position`: nunca fijan cómo se
 * ubica el objeto que los usa (eso es del mueble — ver .libreta,
 * .tablero, .chincheta), solo cómo se ve y se comporta la superficie.
 */
export const MATERIALS: Record<MaterialId, MaterialProfile> = {
  paper: {
    id: 'paper',
    className: 'material-paper',
    light: 'Mate, sin brillo especular. Solo una variación tonal suave de esquina a esquina, como luz difusa de ventana, nunca un reflejo puntual.',
    aging: 'Todavía no envejece de forma visible. El eje de uso existe (ver objectUsage.ts) pero ninguna hoja lo consulta todavía — sería la primera candidata cuando eso llegue.',
    shadow: 'Corta y difusa, de contacto — el papel es liviano y nunca flota. Cada mueble define el offset exacto según cómo la hoja se apoya ahí (plana, apilada, clavada).',
    focus: 'No reacciona al foco por sí sola: es la propuesta o el botón que vive sobre ella lo que responde, nunca la hoja.',
    time: 'No consulta el motor de luz todavía — su tono es fijo. Pendiente para cuando haya evidencia de que vale la pena.',
    use: 'Sin conexión todavía al eje de uso — ver "aging".',
  },
  cork: {
    id: 'cork',
    className: 'material-cork',
    light: 'Mate y opaco, sin ningún punto de brillo — el corcho absorbe la luz, no la devuelve. La variación tonal es amplia y difusa, nunca un degradado limpio.',
    aging: 'Todavía no tiene marcas propias. Un corcho real se agujerea donde entran y salen las chinchetas con los años — reservado, no inventado sin evidencia de cómo se vería.',
    shadow: 'No proyecta sombra propia — es superficie de fondo, siempre detrás de lo que se apoya sobre ella.',
    focus: 'No responde al foco: nunca es interactivo por sí mismo, solo lo que está clavado encima.',
    time: 'No consulta el motor de luz todavía.',
    use: 'Sin conexión todavía al eje de uso.',
  },
  wood: {
    id: 'wood',
    className: 'material-wood',
    light: 'Mate y callado a propósito (punto 04: "madera tranquila, no bonita") — sin barniz, sin brillo direccional fuerte. La veta se nota por textura, nunca por un highlight.',
    aging: 'Todavía sin marcas propias. Reservado hasta que un mueble real lo use y haya evidencia de cómo envejece una superficie que nadie toca directamente.',
    shadow: 'No proyecta sombra propia — igual que el corcho, es superficie de fondo.',
    focus: 'No responde al foco por sí sola.',
    time: 'No consulta el motor de luz todavía.',
    use: 'Sin conexión todavía al eje de uso — este material todavía no tiene ningún mueble real que lo consuma (Escritorio, Mesa de Análisis y Biblioteca lo usarán más adelante, no en este sprint).',
  },
  metal: {
    id: 'metal',
    className: 'material-metal',
    light: 'Con brillo direccional real: una veta clara donde pega la luz y una zona fría hacia el borde opuesto — nunca un brillo centrado y simétrico, eso se ve a botón, no a metal.',
    aging: 'Todavía no se opaca ni se raya con el tiempo. Reservado — un metal que lleva años de uso real debería perder un poco de brillo, pero eso necesita evidencia real de uso antes de inventarse.',
    shadow: 'Sombra de contacto corta y dura (nunca difusa como el papel): el metal es denso y su sombra tiene un borde más definido.',
    focus: 'No responde al foco todavía — la chincheta no es interactiva hoy, solo decorativa-con-sentido (ver .chincheta).',
    time: 'No consulta el motor de luz todavía.',
    use: 'Sin conexión todavía al eje de uso.',
  },
  leather: {
    id: 'leather',
    className: 'material-leather',
    light: 'Un único gradiente direccional (luz de un solo origen, nunca varias fuentes fabricadas) más el grano natural — la simplificación central de Sprint 2.4, punto 05: menos capas, mejores capas.',
    aging: 'Ya envejece de verdad, pero por objeto, no por material — ver getHistoryMarks/historyMarks.ts, todavía atado a Libreta y no generalizado a cualquier objeto de cuero.',
    shadow: 'Sombra de contacto profunda y algo dura — el cuero es denso y pesado, nunca liviano como el papel.',
    focus: 'Responde con un brillo leve (filter: brightness) — ver .libreta:hover, todavía específico del objeto, no del material.',
    time: 'No consulta el motor de luz todavía, aunque sería el candidato más natural: el cuero real cambia mucho de aspecto entre luz de mañana y de noche.',
    use: 'Se registra desde Sprint 2.2 (recordUse en Libreta.tsx) pero todavía no mueve ninguna marca visual — el eje existe, la mezcla con el envejecimiento queda pendiente.',
  },
}

/** Materiales con una clase CSS real hoy — los cinco, desde Sprint 2.4. */
export const IMPLEMENTED_MATERIALS: readonly MaterialId[] = ['paper', 'cork', 'wood', 'metal', 'leather']
