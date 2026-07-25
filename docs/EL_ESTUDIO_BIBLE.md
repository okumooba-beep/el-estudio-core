# EL ESTUDIO — Project Bible

Version: 1.0
Status: OFFICIAL
Owner: Nah Rubio
Last Updated: 2026-07-23
Architecture Revision: post `ARCHITECTURE_RATIFIED.md` Sprint F1–F17 (paquetes lógicos creados, superficie pública `index.ts` aún sin sellar) + Sprint B1 (`.dependency-cruiser.cjs` activo) + Sprint "Desk Experience v1.0 → BLOCKOUT → P0" (más reciente, ver Cap. 14)
Current Sprint: ninguno abierto al momento de escribir esto — el último cerrado fue "Desk Experience P0"

Este documento es la fuente única de verdad **de lo que ya existe y de cómo se relacionan entre sí los 23 documentos que ya gobiernan El Estudio.** No reemplaza a ninguno de ellos. Los organiza, los ratifica donde aún estaban pendientes, y ocupa el único espacio que ninguno de los 23 ocupaba todavía: un estado de implementación auditado y un roadmap consolidado.

---

## Nota de autoridad — léela antes que cualquier otra cosa

El proyecto ya vivió, una vez, el error de tener varios documentos autodeclarándose "la máxima autoridad" al mismo tiempo (`SPATIAL_EXPERIENCE_MANIFESTO.md`, `libro-01-biblia-del-estudio.md`, `ESTUDIO_MASTER_CONTEXT.md` y `vision.md`, diagnosticado en `docs/RATIFIED_DECISIONS.md` §1). Ese documento propuso una jerarquía de cuatro niveles pero la dejó explícitamente **"Propuesto, pendiente de ratificación del usuario"** (Decisión #25, Open Question #1).

Este Bible no repite ese error. En vez de autodeclararse supremo por encima de `WORLD_FOUNDATIONS.md`, hace lo que le corresponde a un documento de arquitectura: **ratifica formalmente la jerarquía que `RATIFIED_DECISIONS.md` §1 ya había propuesto**, cerrando su Open Question #1 con un sí explícito del owner del proyecto. Esa jerarquía queda así:

- **Nivel 0 — Raíz.** `WORLD_FOUNDATIONS.md`. No depende de nada.
- **Nivel 1 — Árbitro.** `WORLD_DESIGN_PRINCIPLES.md`. Resuelve conflictos entre documentos de Nivel 2.
- **Nivel 2 — Leyes de dominio**, misma autoridad entre sí: `LIVING_SYSTEMS_BIBLE.md` → `WORLD_BEHAVIOR_LANGUAGE.md` → (`PRESENCE_ENGINE.md`, `ATTENTION_ENGINE.md`, `SPATIAL_EXPERIENCE_MANIFESTO.md`, `libro-01-biblia-del-estudio.md`, `vision.md`) → `EXPERIENCE_BIBLE.md` → `MOMENTS_BIBLE.md`.
- **Nivel 3 — Onboarding, sin autoridad de resolución.** `ESTUDIO_MASTER_CONTEXT.md`.
- **Categorías aparte:** `AI_DEVELOPMENT_RULES.md` (proceso, no ley del mundo); `world-map.md`/`furniture-map.md`/`future-furniture.md`/`LIVING_THE_STUDIO.md`/`experience-log.md` (inventario y evidencia, no ley).

Sobre esa jerarquía ya ratificada, **este Bible es la máxima autoridad únicamente para tres cosas que ningún documento de los 23 resolvía todavía**:

1. **El índice y las referencias cruzadas** entre los 23 documentos (Cap. 1–13 de este documento son ese puente, citando en vez de duplicar).
2. **El estado de implementación auditado** — qué existe de verdad en `src/`, contra qué es todavía intención (Cap. 14) — algo que ni `ESTUDIO_MASTER_CONTEXT.md` (demovido a resumen sin autoridad) ni ningún otro documento mantenía consolidado y actualizado.
3. **El roadmap consolidado y la Definición de Terminado** (Cap. 15–16).

Este Bible **nunca** tiene autoridad para decidir qué puede existir en El Estudio (eso sigue siendo de `WORLD_DESIGN_PRINCIPLES.md`) ni para reescribir el axioma (eso sigue siendo de `WORLD_FOUNDATIONS.md`). Si una futura IA encuentra una contradicción entre este Bible y un documento de Nivel 0–2, **gana el documento de Nivel 0–2**, y esa contradicción debe reportarse como error de este Bible, no resolverse a favor de este Bible.

---

## 1. Qué es El Estudio

> "El Estudio no organiza información. Acompaña la transformación de una persona." — `WORLD_FOUNDATIONS.md`, el Axioma (Decisión Ratificada #1, estabilidad máxima).

No es una aplicación. Es un lugar (`vision.md`: *"No estamos construyendo una aplicación. Estamos construyendo un lugar."*). La diferencia no es estética: una aplicación se opera, un lugar se habita. Todo lo demás en este documento — muebles en vez de funciones, presencia en vez de animaciones, habitabilidad en vez de productividad — es una consecuencia de esa única distinción, no una lista de preferencias de diseño independientes.

**El problema cognitivo que resuelve:** la mayoría de las herramientas de productividad generan ansiedad fabricada — urgencia, FOMO, sobrecarga, comparación, presión de mantenimiento, vergüenza por abandono (`EXPERIENCE_BIBLE.md`, lista explícita de lo que nunca debe sentirse). El Estudio existe para cultivar exactamente lo opuesto: calma, presencia, curiosidad, pertenencia, concentración, claridad, refugio — **excluyendo deliberadamente** "motivación" y "logro" como emociones de producto (Decisión #16). La `ATTENTION_ENGINE.md` formaliza esto como ley madre: en cualquier instante, como máximo un solo punto del mundo puede pesar más que el reposo (Decisión #9) — y el objetivo declarado del propio sistema de atención es **volverse innecesario con el tiempo** (Decisión #10), no maximizar el uso.

**La prueba que todo debe pasar:** no cinco años, veinte (Decisión #11, Manifiesto XIII). Usar una cifra menor habría sido la misma inconsistencia silenciosa que `RATIFIED_DECISIONS.md` existe para cazar en otros lados del proyecto.

Ver también: `docs/WORLD_FOUNDATIONS.md` (texto completo del axioma y los cuatro Libros), `docs/EXPERIENCE_BIBLE.md` (la curva emocional completa), `docs/ATTENTION_ENGINE.md` (la ley madre en detalle).

---

## 2. Core Philosophy — las leyes inmutables

Estas son las Decisiones Ratificadas de mayor estabilidad (`RATIFIED_DECISIONS.md` §2), reunidas acá para que ningún sprint futuro necesite releer 23 archivos para saber qué nunca puede romperse:

| Ley | Fuente |
|---|---|
| El espacio es la interfaz — sin menús flotantes | Manifiesto I |
| La cámara debe ser invisible | Manifiesto IV |
| La IA es habitante; nunca enseña, recuerda | Manifiesto VI, `libro-01` §10, `vision.md` |
| Todo efecto debe poder ubicarse en una habitación física real | `vision.md`, `libro-01` §03/07 |
| Cero gamificación explícita (badges, XP, rachas, tablas, confeti, notificaciones invasivas, coach motivacional, comparación social, leaderboards) | `libro-01` §11 |
| Todo objeto debe responder: ¿por qué existe?, ¿qué historia cuenta?, ¿cómo envejece?, ¿qué se siente al encontrarlo? | `libro-01` §04, `vision.md` (`reason`/`story` obligatorios en `RoomObjectDefinition`) |
| Un mueble nuevo nace ya presente — nunca se anuncia | `WORLD_DESIGN_PRINCIPLES.md` §9 |
| Ningún objeto puede iniciar algo hacia la persona | `WORLD_BEHAVIOR_LANGUAGE.md` §5 |
| Exclusividad de autoría — nada cambia por acción de otra persona | `LIVING_SYSTEMS_BIBLE.md` §11 |
| Motivación y logro excluidos como emociones de producto | `EXPERIENCE_BIBLE.md` §16 |

Prioridad operativa para cualquier decisión de diseño o ingeniería (`AI_DEVELOPMENT_RULES.md` §6):

```
Lugar         > Pantallas
Muebles       > Funciones
Presencia     > Animaciones
Habitabilidad > Productividad
```

Antes de implementar cualquier cambio, la única pregunta que importa: **"¿Hace que El Estudio sea un lugar más habitable?"** Si la respuesta es no, no se implementa (`AI_DEVELOPMENT_RULES.md` §1).

---

## 3. World Foundations — el vocabulario del mundo

Estos seis conceptos viven **únicamente** en `docs/WORLD_FOUNDATIONS.md` como vocabulario filosófico. Ninguno tiene todavía una representación en código — ningún tipo, clase ni variable de `src/` los implementa. Se documentan acá tal como el glosario los define, para que una futura IA no los busque en el código ni, al revés, invente una implementación sin antes diseñarla deliberadamente:

- **El Umbral** — el instante de cruce entre no-estar y estar en el mundo.
- **El Horizonte** — la región del mundo donde vive lo que todavía no es.
- **La Huella** — el rastro que una presencia deja incluso después de retirarse.
- **Un Estrato** — una capa de tiempo acumulado, distinta de un simple registro.
- **La Presencia Acumulada** — existir, en este mundo, es sinónimo de haber dejado presencia acumulada.
- **Un Capítulo** — una unidad de vida lo bastante larga como para tener principio y cierre propios.

**Advertencia de desambiguación explícita:** el código sí contiene la palabra literal "Threshold", pero **no se refiere a esto** — es el nombre de sprint de una funcionalidad de gaze/UI ("Crossing the Threshold", ver `src/features/workspace/Workspace.tsx`, `src/packages/world/world/gaze.ts`, `src/modules/work-table/IdeaCapture.tsx`). Son dos cosas homónimas sin relación; no fusionar.

Los otros tres Libros de `WORLD_FOUNDATIONS.md` (materia del mundo, tiempo y espacio, persona y mundo) y su capítulo "La IA como Habitante" (*"La IA no vive fuera del mundo, mirándolo. Es la capa del mundo que nota."*) se citan por referencia — leer el documento completo para su argumento, no se duplica acá.

---

## 4. Spatial Experience Manifesto

`docs/SPATIAL_EXPERIENCE_MANIFESTO.md` define trece leyes numeradas (I–XIII) sobre el espacio como lugar. Resumen de referencia rápida — el texto completo, con su argumento, vive solo en el documento original:

I. El espacio es la interfaz · II. La atención guía, nunca un menú · III. El movimiento es presencia · IV. La cámara debe ser invisible · V. Los objetos contienen la función, no la envuelven · VI. La IA es un habitante, no un asistente · VII. El lugar persiste sin el usuario · VIII. El tiempo esculpe el espacio · IX. Luz/clima/sonido son lenguaje, no decoración · X. El apego se construye por evidencia, no por recompensa · XI. Prueba anti-dashboard · XII. Calma sin vacío · XIII. La prueba de los veinte años.

`docs/WORLD_DESIGN_PRINCIPLES.md` es el árbitro de estas leyes frente a cualquier otro documento de Nivel 2, y ya resolvió ahí mismo una implementación concreta que podría parecer una violación de IV: `useCameraRig.ts` llamando indirectamente a la navegación de rutas se acepta como detalle de implementación, no como violación de la cámara invisible.

---

## 5. Presence Engine

`docs/PRESENCE_ENGINE.md` (Decisión #8, estabilidad alta) define nueve capas: **Tiempo** (raíz), cinco expresiones (Luz, Clima, Sonido, Movimiento Ambiental, Respiración del Espacio), tres soportes de memoria (Materiales, Objetos Vivos, Evidencias de Uso), y la **Atmósfera** como resultado auditado — nunca una capa que se diseña directamente.

Auditoría honesta (`docs/LIVING_SYSTEMS_BIBLE.md`, la más explícita de todo el corpus sobre qué es real):

| Estado | Capas |
|---|---|
| **Ya existen de verdad, en producción** | Tiempo/Luz — un único reloj continuo, curva de luz real (`src/packages/world/light/lightEngine.ts`) |
| **Existen en producción, pareja** | Objetos Vivos + Evidencia de Uso — el registro de RoomObjects con `historyMarks` (ver Cap. 8), aunque hoy con `historyMarks: []` en los tres objetos reales — el tiempo real todavía no pasó |
| **Solo existen como intención** | Desgaste acumulado de uso real (`src/types/deskMemory.ts` — tipo definido, cero marcas reales), crecimiento orgánico de objetos vivos |
| **Todavía no se sabe cómo construir** | Olvido con gracia (existencia y prominencia son ejes distintos, Decisión #20), balance de amplitud entre capas |
| **Conceptuales, sin motor** | Clima, Sonido, Movimiento Ambiental como sistema propio, Materiales como sistema dinámico (más allá de los tokens estáticos del Cap. 9) |

---

## 6. World Graph — qué existe de verdad y qué no

**Hallazgo honesto de este Bible:** El Estudio **no tiene hoy un único "World Graph" unificado.** Tiene tres capas de datos separadas, sin fusionar, cada una modelando un eje distinto — y eso ya está documentado como algo deliberado, no un olvido (`RATIFIED_DECISIONS.md`, nota de aclaración sobre `world-map.md` vs `furniture-map.md`):

| Capa | Eje que modela | Archivo real | Forma de los datos |
|---|---|---|---|
| Geografía del mundo | Dónde está cada lugar en el espacio físico | `src/packages/world/world/worldMap.ts` | Adyacencia no dirigida entre `WorldPlaceId` (`escritorio`, `ventana`, `rincon-lectura`, `muro-proyectos`, `biblioteca`), con coordenadas explícitamente marcadas como "nadie todavía dibuja esto" |
| Grafo de muebles | Qué alimenta a qué funcionalmente | `src/packages/world/studio/furniture.ts` | Grafo dirigido (`recibe`/`enviaA`) sobre `FurnitureId` (`escritorio`, `tablero`, `habitos`, `mesa-analisis`, `diario`, `archivador`, `finanzas`, `biblioteca`) |
| Estaciones de cámara | A qué región de la foto mira la cámara | `src/packages/world/world/stations.ts` | Array `STATIONS` de 5 entradas (id, label, subtitle, route opcional) |
| Objetos del escritorio | Qué entidad-mueble pequeña existe y con qué historia | `src/types/roomObject.ts` + `src/components/room/roomObjectsRegistry.ts` | Registro plano de `RoomObjectDefinition` (posición %, estado, `reason`/`story` obligatorios, `historyMarks`) |

Ninguna de estas cuatro estructuras conoce a las otras tres como un solo grafo de entidades con `bounds`/`depth`/`material`/`camera target`/`interaction anchors`/`state`/`behavior`/`children`/`parent` en un único nodo — esa es la forma que este Bible fue instruido a documentar como "World Graph", y **este Bible se niega a describirla como si ya existiera**, porque no existe: describirla como real induciría a una futura IA a buscar una API que no está ahí. Se documenta en cambio como ítem de Roadmap (Cap. 15) — fusionar estas cuatro capas en un solo modelo de entidad sería un rediseño arquitectónico real, no una descripción.

---

## 7. World Behavior — la gramática de once verbos

Igual que el Cap. 6: la taxonomía de clases `WorldObject` / `LivingObject` / `BurningObject` / `WearableObject` / `ScreenObject` / `LightSource` / `WritableObject` **no existe en ningún archivo del repositorio**, ni como clase ni como tipo ni como nombre de variable. No se inventa acá.

Lo que sí existe, ratificado pero sin uso real todavía (Decisión #23, estabilidad **media** — *"sin objetos construidos que la usen todavía"*), es `docs/WORLD_BEHAVIOR_LANGUAGE.md`: una gramática de once verbos —

`esperar, ofrecerse, acompañar, ceder, retirarse, persistir, guardar, envejecer, coincidir, recordar, callar`

— más cinco reglas de sintaxis: reposo por defecto, causa real obligatoria, un solo verbo dominante a la vez, proporcionalidad, reversibilidad desigual. `RoomObjectCondition` en `src/types/roomObject.ts` está tipado como `never` — explícitamente reservado para cuando esta gramática tenga una primera implementación real, todavía vacío.

Si un futuro sprint decide implementar comportamiento autónomo de objetos, el camino correcto es: primero un objeto real que hable esta gramática de once verbos (ya ratificada), no la introducción directa de una jerarquía de clases nueva y sin precedente en el proyecto — eso duplicaría un sistema de comportamiento que ya fue diseñado y ratificado, violando `AI_DEVELOPMENT_RULES.md` §5 ("no duplicar lógica").

---

## 8. Furniture System

Estado real por pieza, verificado contra `src/`:

| Mueble | Estado | Dónde vive |
|---|---|---|
| **Escritorio** (Desk/Workspace) | ✅ Real — dos monitores con jerarquía asimétrica, teclado, mouse, libreta, planta, taza | `src/features/workspace/WorkspaceTabs.tsx`, `src/components/room/roomObjectsRegistry.ts` |
| **Pizarra** (Planning Wall) | ✅ Real — estación de cámara que monta `PlanningBoard` | `src/packages/world/world/stations.ts`, `src/features/room/PlanningBoard.tsx`, `roomModules.tsx` |
| **Corcho** (Archivo/Biblioteca espacial) | ✅ Real — estación de cámara que monta `LibraryModule` | `stations.ts`, `src/features/room/LibraryModule.tsx` |
| **Archivador** (Diario/Journal) | ✅ Real — estación de cámara + ruta `/diario` propia (`DiarioScreen`) | `stations.ts`, `src/features/room/JournalModule.tsx`, `src/modules/journal/public.ts` |
| **Libreta, Planta, Taza** (objetos del escritorio) | ✅ Real, los tres únicos `RoomObjectKind` con instancia registrada | `src/components/room/roomObjectsRegistry.ts` |
| **Lámpara, Reloj, Fotografía** | ⚠️ Tipo definido (`RoomObjectKind` los incluye), **cero instancias registradas** | `src/types/roomObject.ts` |
| **Ventana, Rincón de lectura** | ⚠️ Solo geografía inerte — coordenadas "que nadie todavía dibuja", nunca una estación ni un objeto renderizado | `src/packages/world/world/worldMap.ts` |
| **Sofá, Mesa de café, Escritorio de Trading (como mueble espacial)** | ❌ No existen como estación ni como mueble — Trading es un módulo de ruta normal (`/trading`), no un lugar de la habitación | — |
| **Finanzas, Biblioteca (como mueble funcional)** | ⚠️ Reservados en el grafo de muebles (`furniture.ts`, ids `finanzas`/`biblioteca`) para que el grafo los pueda nombrar, sin que ninguna pantalla los use todavía | `src/packages/world/studio/furniture.ts` |

Todo objeto nuevo debe seguir la arquitectura RoomObject existente (registro + renderer por `kind` en `OBJECT_RENDERERS`, ver `src/components/room/RoomObjects.tsx`) — nunca un sistema paralelo. Objeto no interactivo por defecto (`aria-hidden`, `pointer-events-none`); interactivo solo si pasa la prueba de las dos preguntas de `WORLD_DESIGN_PRINCIPLES.md` §4.

---

## 9. Material System

**Tokens reales** (`src/packages/estudio-design-system/tokens/materials.ts`): `paper`, `cork`, `wood`, `metal`, `leather` — cinco materiales, cada uno un gradient CSS exacto extraído de su clase `.material-*` correspondiente. El propio archivo documenta honestamente que "concrete" nunca se implementó pese a estar en una spec temprana, y elige no fabricar ese token: *"mejor un hueco documentado que una mentira prolija."*

**Deuda de diseño detectada por este Bible:** `.material-plastic` existe y se usa en CSS (bisel de monitores, teclado, mouse — ver Cap. 10 del sprint Desk Experience) pero **no está entre los cinco tokens canónicos** de `materials.ts`. No se resuelve acá; se deja registrado como ítem de Roadmap (Cap. 15) para que un futuro sprint decida si `plastic` se suma al canon o si el bisel debería usar `metal`.

**Sistema de tinta por contexto**, la mecánica real que reemplaza a "cada material tiene su color fijo":

- `--ink` / `--ink-dim` / `--ink-faint` — tokens base (`src/index.css`, raíz).
- `--paper-ink` / `--paper-ink-faint` — el papel nunca reutiliza los tokens base; tiene su propio tono cálido.
- `--screen-ink` / `--screen-ink-faint` — un monitor no refleja la luz de la habitación, la emite; sus tokens quedan fijos sin importar la hora del día, a diferencia del resto del cuarto.

**Cómo responden los materiales:**
- **A la luz** — real, vía `lightEngine.ts` (única capa recalculable ya en producción, ver Cap. 5).
- **Al tiempo** — real solo para el reloj/luz; el resto (desgaste, envejecimiento orgánico) es intención, no motor (Cap. 5).
- **Al clima** — conceptual, sin motor.
- **A la presencia** — vía `historyMarks`, hoy vacío en los tres objetos reales (Cap. 5, 8).

---

## 10. Camera System

`src/features/room/useCameraRig.ts` — real, confirmado por lectura directa:

```ts
const TRANSITION_MS = 1050
export type CameraPhase = 'idle' | 'transitioning' | 'focused'
```

`TRANSITION_MS` gobierna cuánto tarda, en milisegundos, pasar de `'transitioning'` a `'focused'` (o volver a `'idle'`) tras iniciar un movimiento de cámara — su propio comentario exige que coincida con la duración de transición CSS real de `.scene-camera`/`[data-transition]` en `src/index.css`. **Cualquier animación gateada en `[data-transition='enter']` debe terminar cómodamente antes de este límite**, o su declaración se corta a mitad de camino (ver Cap. 14, "Desk Experience P0" para un ejemplo de presupuesto de tiempos real contra este límite).

Confirmado explícitamente: el hook **no llama a `navigate()` de react-router** para cambiar de estación — solo gestiona el estado de foco de cámara. `route` en `Station` es metadata inerte para la navegación de `AppShell`, no algo que este hook dispare (aclarado en `WORLD_DESIGN_PRINCIPLES.md` frente a una lectura anterior incorrecta de un footnote).

Cada estación puede tener su propia curva de easing sin tocar la duración compartida — por ejemplo, el Escritorio usa una curva `cubic-bezier` propia vía `.scene-camera[data-station='escritorio']`, mientras la duración base permanece intacta para todas las estaciones. La cámara nunca debe sentirse mecánica: no es instantánea, no es dramática — despierta, no aparece (principio aplicado en el sprint "Desk Experience v1.0" al scrim de arranque de los monitores, ver Cap. 14).

---

## 11. Design System

**Tokens reales** (`src/packages/estudio-design-system/tokens/`): `colors.ts`, `materials.ts` (Cap. 9), `motion.ts`, `radius.ts`, `shadows.ts`, `spacing.ts`, `typography.ts`. `colors.ts` está confirmado como copia exacta de los valores ya vivos en `src/index.css` — su propio comentario admite que **todavía no tiene ningún consumidor real**; el CSS raíz sigue siendo la fuente de verdad efectiva hasta que algún componente empiece a importar estos tokens en vez de clases utilitarias directas.

**Paleta cálida** — `--ink:#EDE5DA`, `--ink-dim:#B0A395`, `--ink-faint:#786D60`, `--accent:#CE965C` sobre `--canvas:#120F0C` — un lugar que se ilumina de adentro hacia afuera, nunca un fondo blanco de aplicación.

**Composición y jerarquía visual** — "Mobile First. Desktop Power." (`vision.md`); la habitación es contexto, el escritorio es acción (`vision.md`); ningún elemento flota fuera de un mueble (regla del mundo físico, Decisión #5); la jerarquía entre elementos se establece con luz, tiempo y contraste — nunca con badges ni tipografía de alarma.

**Interacción** — todo control interactivo debe pasar la prueba de las dos preguntas (`WORLD_DESIGN_PRINCIPLES.md` §4) antes de aceptarse; un objeto nunca inicia algo hacia la persona (Decisión #24) — la iniciativa siempre es del usuario.

**Lo que nunca debe agregarse** (`libro-01` §11, exhaustivo): badges, XP, niveles, insignias, confeti, celebraciones, barras de progreso, notificaciones invasivas, gamificación de cualquier tipo, coach motivacional, comparación social, leaderboards, dashboards nuevos, widgets, métricas decorativas, tarjetas innecesarias (`AI_DEVELOPMENT_RULES.md` §7).

---

## 12. AI Architecture

**No existe hoy ningún chat ni asistente dentro de la aplicación.** Verificado por búsqueda exhaustiva en `src/` — las únicas coincidencias de "asistente"/"habitante" describen objetos del mundo como habitantes filosóficos (`RoomObjects.tsx`, `roomObjectsRegistry.ts`), no una función de IA conversacional.

Lo que sí existe, real y en producción:

- **`ClassificationEngine`** (`src/packages/cognitive-engine/ports/ClassificationEngine.ts`) — puerto genérico diseñado para admitir a futuro un motor de reglas, de embeddings o un LLM sin cambiar a sus consumidores.
- **`RuleBasedClassifier`** (`src/packages/cognitive-engine/providers/rule-based/`) — el único proveedor activo hoy: coincidencia de texto contra una lista fija de reglas más una pequeña memoria de correcciones aprendidas. Su propio comentario es explícito: **"nunca IA, nunca embeddings, nunca puntuación de confianza."** Cuando nada coincide, cae a `'hoy'` con `reason: {kind:'sin-coincidencia'}` — El Estudio nunca adivina.
- **`comprehensionEngine.ts`** (`src/app/shell/`) — el singleton de composición que registra `RuleBasedClassifier` como único proveedor activo hoy.
- **`voiceEngine.ts`** (`src/lib/voice/`) — la jerarquía de voz real: Memoria Viva → Biblioteca de Sabiduría → Estado del Estudio → Frase del Manifiesto → Silencio. **Las dos primeras capas están hoy codificadas para devolver `null`** — son stubs, no funciones activas; apuntan a un `MemoryLayer` todavía no construido del todo. Su comentario reafirma el invariante: *"La IA nunca enseña. La IA recuerda."* — conectar ahí un texto de "consejo" generado violaría la arquitectura, no solo el estilo.

**Conclusión operativa:** cualquier IA de desarrollo (Claude, ChatGPT, Kimi u otra) que lea este Bible debe distinguir dos cosas distintas que comparten la palabra "IA" en este proyecto: (1) la IA de desarrollo trabajando sobre el repositorio, gobernada por `AI_DEVELOPMENT_RULES.md` (Cap. 13), y (2) la "IA habitante" filosófica del Manifiesto VI, que hoy **no tiene ninguna implementación conversacional real** — es un motor de clasificación determinista más una jerarquía de voz mayormente silenciosa. Ninguna futura implementación de (2) puede "enseñar" ni dar consejos generados; solo puede recordar.

---

## 13. Development Rules

Este capítulo no duplica — remite íntegro a `docs/AI_DEVELOPMENT_RULES.md`, el documento vinculante para cómo trabaja cualquier IA sobre este repositorio. Resumen de sus 14 secciones para referencia rápida (texto completo y autoritativo en el archivo original, no acá):

1. Filosofía — "¿Hace que El Estudio sea un lugar más habitable?"
2. Consumo de tokens — Graphify primero, nunca recorrer el proyecto completo.
3. Alcance — solo el objetivo del sprint, nunca limpieza general.
4. Reutilización — siempre buscar antes de crear.
5. Arquitectura — no romper, no duplicar lógica.
6. Experiencia — Lugar > Pantallas, Muebles > Funciones, Presencia > Animaciones, Habitabilidad > Productividad.
7. Diseño — lista de lo prohibido (ver Cap. 11).
8. Implementación — mayor impacto, menor complejidad, menos archivos.
9. Calidad — build, lint, TypeScript, sin romper lo existente.
10. Entregable — Graphify usado, archivos modificados, motivo, limitaciones, próximos pasos sugeridos (nunca implementados sin pedirlo).
11. Regla más importante — ante la duda, gana "hacer que El Estudio se sienta más vivo" sobre "agregar una función nueva".
12. Evolución incremental — un objetivo por sprint, siempre reversible.
13. Regla del 80/20 — identificar el 20% de cambios que producen el 80% del impacto.
14. Calidad de entregables — una sola versión consolidada, nunca una primera versión para corregir después.

---

## 14. Current Project Status

Estado auditado al 2026-07-23, verificado por lectura directa de código (no por inferencia de los documentos de filosofía):

**Motores / sistemas temporales**
- Luz (`lightEngine.ts`) — ✅ real, único reloj continuo en producción.
- Clima, Sonido, Movimiento Ambiental como sistema propio, Respiración del Espacio — ❌ conceptuales, sin motor.
- Desgaste/envejecimiento real por uso (`historyMarks.ts`, `deskMemory.ts`) — ⚠️ tipos definidos, cero lógica, cero marcas reales todavía.

**Datos de mundo** (Cap. 6) — cuatro capas reales y separadas (geografía, grafo de muebles, estaciones, registro de objetos), ninguna fusionada en un "World Graph" único.

**Comportamiento de objetos** (Cap. 7) — gramática de once verbos ratificada, cero objetos la implementan todavía. `RoomObjectCondition` tipado `never`, reservado.

**Furniture System** (Cap. 8) — Escritorio, Pizarra, Corcho, Archivador reales como estaciones; Ventana y Rincón de lectura solo geografía inerte; Sofá/Mesa de café/Trading-como-mueble no existen. 3 de 6 `RoomObjectKind` con instancia real (Libreta, Planta, Taza — la Taza se agregó en el sprint más reciente, ver abajo).

**Material System** (Cap. 9) — 5 tokens definidos, cero consumidores reales todavía (CSS sigue siendo la fuente de verdad efectiva). `.material-plastic` usado en CSS pero fuera del canon de 5 — deuda registrada.

**Camera** (Cap. 10) — ✅ real y activa, `TRANSITION_MS = 1050`, fases `idle`/`transitioning`/`focused`, easing por estación.

**Módulos** (`src/modules/*`):

| Módulo | Estado |
|---|---|
| `today` | ✅ Real — home/orquestador, único módulo exento de las reglas de aislamiento entre módulos |
| `trading` | ✅ Real — pantalla funcional propia |
| `missions` | ✅ Real |
| `habits` | ✅ Real |
| `journal` | ✅ Real, pero sin entrada en `MODULES`/nav — solo alcanzable vía la estación `archivador` o la ruta `/diario` |
| `work-table` | ✅ Real — infraestructura compartida de captura/ruteo de ideas |
| `frases` (label "Biblioteca") | ⚠️ Entrada de nav real, pantalla todavía `ModulePlaceholder` |
| `library` | ❌ Solo placeholder, sin ruta registrada en `App.tsx` |
| `finanzas` / finance | ❌ No existe como módulo — solo reservado en el grafo de muebles |
| planning (como módulo de ruta) | ❌ No existe — Pizarra es una estación con `PlanningBoard`, no un módulo de ruta independiente |

**Paquetes** (`src/packages/world|cognitive-engine|estudio-design-system|shared-kernel`) — los cuatro existen como directorios con contenido interno real, pero **cada `index.ts` propio sigue siendo un scaffold vacío** (`export {}`) — el contenido se importa hoy vía alias de ruta directo (`@world/...`, etc.), no a través de una superficie pública sellada.

**Límites de arquitectura** — `.dependency-cruiser.cjs` **activo y verificado en cada build** (9 reglas `forbidden`, incluyendo las excepciones heredadas explícitas de `today` como orquestador y de `work-table` como infraestructura compartida). Reemplaza una regla de oxlint que nunca funcionó de verdad.

**IA** (Cap. 12) — clasificador determinista únicamente; sin LLM en producción; dos de cuatro niveles de la jerarquía de voz devuelven `null` hoy.

**Jerarquía documental** — antes "Propuesta, pendiente de ratificación" (`RATIFIED_DECISIONS.md` §1, Decisión #25); **este Bible la ratifica formalmente**, cerrando el Open Question #1 de ese documento (ver "Nota de autoridad" arriba).

**Sprint más reciente — "Desk Experience v1.0 → BLOCKOUT → P0"** (cerrado, build y lint limpios):
- Taza (coffee cup) agregada a la arquitectura RoomObject, con vapor sutil integrado al Ambient Life Engine existente, sin sonido.
- Jerarquía asimétrica de monitores: el derecho (`.monitor--content`) despierta primero y termina antes (~580ms); el izquierdo (`.monitor--nav`) despierta después (~920ms) y queda con un dimming persistente (`brightness(0.93)`) incluso en reposo — ambos con margen bajo los 1050ms de `TRANSITION_MS`.
- Personalidad por destino vía `data-tab` en `.monitor-screen--content`: Trading (denso, `tabular-nums`, `--ink-faint` más oscuro), Proyectos (acento de borde izquierdo estático), IA (el único con movimiento propio, 17s de ciclo, opacity tope 0.05), Finanzas (`tabular-nums` + `saturate(0.85)`); Hoy sin override, como línea base de calma.

---

## 15. Roadmap

**Completado** (ver Cap. 14 para el detalle auditado):
- ✅ Paquetes lógicos F1–F17 creados (superficie pública aún sin sellar).
- ✅ `.dependency-cruiser.cjs` activo (Sprint B1).
- ✅ Sprint "Desk Experience v1.0 / BLOCKOUT / P0".
- ✅ Jerarquía documental ratificada (este Bible, cerrando Decisión #25).

**Pendiente — ya nombrado por el propio corpus, no inventado por este Bible:**
- Mecanismo concreto de olvido con gracia (Decisión #20 — "todavía no se sabe cómo construir").
- Primer objeto real que use la gramática de once verbos de `WORLD_BEHAVIOR_LANGUAGE.md`.
- Lógica real de `historyMarks.ts` / `deskMemory.ts` (hoy tipos vacíos).
- Fusión de las cuatro capas de datos de mundo en un modelo de entidad único (el "World Graph" del Cap. 6) — si se decide hacerlo; hoy es una opción de diseño abierta, no un compromiso.
- Construir `library` (módulo de ruta) y `frases`/"Biblioteca" más allá del placeholder.
- Construir el módulo de Finanzas (`ModulePlaceholder` ya anticipa este consumidor).
- Construir un tab "IA" real más allá del placeholder (también anticipado por el mismo componente).
- Decidir el destino de `.material-plastic` (¿se suma al canon de 5 materiales o se reemplaza por `metal`?).
- Migrar componentes reales a consumir `estudio-design-system/tokens/*` en vez de CSS directo (hoy cero consumidores).
- Sellar la superficie pública (`index.ts`) de los cuatro paquetes lógicos.
- Ítems P1/P2 del propio sprint "Desk Experience" — deliberadamente no detallados acá para no reabrir el alcance que ese sprint ya cerró; consultar el historial de esa conversación si se retoman.

**Orden de implementación:** lo dicta la secuencia de sprints de `ARCHITECTURE_RATIFIED.md` más la Regla del 80/20 (`AI_DEVELOPMENT_RULES.md` §13) — este Bible consolida la lista, no inventa un orden nuevo ni prioriza unilateralmente cuál construir primero.

---

## 16. Definition of Done

Todo sprint futuro debe satisfacer, antes de reportarse como cerrado:

- **Fidelidad visual** — nada flota fuera de un mueble real (Manifiesto I/V); la cámara permanece invisible (Manifiesto IV).
- **Consistencia arquitectónica** — `npm run build` (tsc + `.dependency-cruiser.cjs` + vite build) limpio; `npm run lint` (oxlint) limpio; cero errores de TypeScript.
- **Sin sistemas duplicados** — reutilizar antes de crear (`AI_DEVELOPMENT_RULES.md` §4/§5); ningún objeto nuevo evade la arquitectura RoomObject existente (Cap. 8).
- **Carga cognitiva mínima** — la ley madre de atención sigue cumpliéndose: un solo punto puede pesar más que el reposo a la vez (Decisión #9).
- **La atmósfera emerge, nunca se diseña directo** — ninguna tarea debería decir "mejorar la atmósfera" sin apuntar a una capa concreta del Cap. 5 (Decisión #8).
- **Cero elementos de la lista prohibida** (Cap. 11) — sin excepciones "solo por esta vez".
- **Todo objeto nuevo responde** por qué existe, qué historia cuenta, cómo envejece (`reason`/`story` obligatorios, Decisión #7); todo elemento interactivo nuevo pasa la prueba de las dos preguntas (`WORLD_DESIGN_PRINCIPLES.md` §4).
- **Entregable completo** por sprint (`AI_DEVELOPMENT_RULES.md` §10): Graphify usado/justificado, archivos modificados y motivo, limitaciones encontradas, próximos pasos sugeridos — nunca implementados sin que se pidan explícitamente.

---

*Fin del Bible v1.0. Toda actualización futura debe mantener sincronizadas ambas copias (`docs/EL_ESTUDIO_BIBLE.md` y la copia en el Escritorio real del sistema operativo) y debe respetar la Nota de Autoridad: este documento nunca gana un conflicto contra `WORLD_FOUNDATIONS.md` ni contra `WORLD_DESIGN_PRINCIPLES.md`.*
