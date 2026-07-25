# EL ESTUDIO — Core Product Specification

Version: 1.1
Status: OFFICIAL — Especificación de Producto
Owner: Nah Rubio
Last Updated: 2026-07-23
Depende de: `docs/EL_ESTUDIO_BIBLE.md` (constitución del proyecto). Este documento nunca repite su filosofía ni su arquitectura — las referencia por número de capítulo. Ante cualquier conflicto entre este documento y el Bible, gana el Bible; un conflicto detectado acá se documenta, nunca se resuelve en silencio.

Este es el segundo documento más importante del repositorio. El Bible define **qué es** El Estudio. Este documento define **qué se construye primero** — la especificación de producto permanente sobre la que cualquier interfaz futura (móvil, escritorio, la Habitación) se apoya. Ninguna decisión de acá debería necesitar descartarse cuando la Habitación exista: la Habitación es otra interfaz sobre este mismo Core, no otro producto.

---

## Nota metodológica — Fase 0 y Graphify

Antes de escribir se releyó `EL_ESTUDIO_BIBLE.md` completo — ya sintetiza los 23 documentos del proyecto y audita el estado real del código, así que cubre la Fase 0 de descubrimiento documental. Para fundamentar específicamente las decisiones de producto de este documento se leyeron además, de forma directa: `src/modules/work-table/IdeaCapture.tsx`, `src/modules/work-table/destinoFurniture.ts`, `src/packages/cognitive-engine/providers/rule-based/rules.ts` y `src/app/modules.ts`.

**Sobre Graphify:** ya existía un grafo construido (`graphify-out/graph.json`, del 2026-07-22 — un día de antigüedad, desactualizado solo por no incluir todavía el Bible, creado recién en esta sesión). Reconstruirlo entero habría vuelto a procesar los mismos documentos que el Bible ya sintetizó a mano un día antes, sin ganancia real — en cambio se lo **consultó directamente** (`graphify query`, modo BFS) para confirmar relaciones reales entre módulos, el grafo de muebles y el motor de clasificación. Esa consulta confirmó, entre otras cosas, que `furniture.ts` ya tiene tipos `HistoryEntry`/`HistoryEvento` propios (historial a nivel mueble, no solo a nivel objeto de escritorio) — dato que informa el Cap. 16. Decisión documentada acá, tal como exige la regla de Token Optimization de este mismo encargo.

---

## Hallazgos y contradicciones — documentados, no resueltos en silencio

1. **Threshold ya existe, parcialmente, en producción, con otro nombre.** `work-table/IdeaCapture.tsx` ya implementa el comportamiento completo pedido en el Cap. 6: texto libre → `comprehensionEngine.classify()` → propuesta de destino corregible → `learnCorrection()` si el usuario corrige. Hoy vive **dentro** del Escritorio, no como punto de entrada global de la app. Este documento trata "Threshold" como la promoción de ese mecanismo real a superficie de producto de primer nivel — no como algo a construir desde cero. Qué tan global debe ser esa promoción es una decisión abierta, no resuelta acá (Cap. 6).
2. **La clasificación automática de "finanzas", "biblioteca" y "archivo" no existe todavía.** `rules.ts` solo tiene nueve reglas de palabra clave, cubriendo exclusivamente `habitos`, `trading` y `misiones`. El propio ejemplo de este encargo — *"Pagué el seguro"* — hoy caería en `hoy` por defecto y necesitaría corrección manual (que el sistema recordaría después vía `learnCorrection`). No se resuelve acá — se declara requisito explícito de Fase 1 (Cap. 17).
3. **Calendar y Settings no existen en absoluto.** Ningún archivo, ruta, `destino` ni entrada de `furniture.ts` los menciona. A diferencia de Threshold, Finance o Library — que sí tienen alguna base real construida — estos dos módulos parten de cero.
4. **Colisión de nombre, no de concepto.** "Threshold" ya existe en el código como nombre de sprint ("Crossing the Threshold", `Workspace.tsx`/`gaze.ts`) y, en español, como concepto filosófico sin implementación ("El Umbral", Bible Cap. 3). Ninguna de las dos cosas es el "Threshold" — punto de entrada de captura — que describe este documento. Se documenta la homonimia para que ninguna IA futura las confunda entre sí; no se renombra nada existente.
5. ~~Colisión de mapeo Habitación~~ — **Resuelto en v1.1.** El Cap. 16 pedía `Calendar → Planning Wall`, pero la Pizarra ya aloja hoy el módulo `misiones` (Bible Cap. 8). Se resolvió reencuadrando la Pizarra como espacio físico compartido, no propiedad exclusiva de un módulo — el mismo patrón que ya usa el Escritorio con sus tabs (Bible Cap. 8, `WorkspaceTabs.tsx`). Detalle en Cap. 16.
6. **Notification System choca con una ley ya ratificada.** El Bible Cap. 2 ratifica que ningún objeto puede iniciar algo hacia la persona, y su lista de lo prohibido (Cap. 11) nombra explícitamente "notificaciones invasivas". Una capacidad de "Sistema de Notificaciones" tal como se pide — alertas que se disparan hacia el usuario — es, tal cual, incompatible con esa ley. No se resuelve acá cuál de las dos cede: se documenta como decisión arquitectónica abierta en el Cap. 19 (Product Capabilities).

---

# 1. Mission

El Bible responde qué es El Estudio y por qué es un lugar, no una aplicación (Bible Cap. 1–2). Ese axioma no resuelve una pregunta distinta: **qué se construye primero para que el dueño del proyecto deje de abrir Apple Notes, Google Keep, Todoist, su diario de trading y su registro de gastos.** Ese es el único propósito de este Core.

Es permanente porque no describe una interfaz — describe los sustantivos del producto (Today, Threshold, Journal, Trading, Finance, Calendar, Habits, Library, Settings) y sus relaciones. Las interfaces son intercambiables porque ya hay precedente real de esto en el propio código: el mismo `destino` de una idea capturada hoy se refleja tanto en una pestaña del monitor (interfaz móvil/escritorio actual, Bible Cap. 8) como en un mueble del grafo `furniture.ts` (la futura Habitación, Bible Cap. 6) — sin que ese dato sepa cuál de las dos lo está mostrando. La Habitación, cuando exista, será una tercera forma de mostrar exactamente estos mismos sustantivos, no un producto nuevo con su propia lógica.

---

# 2. Product Vision

Después de seis meses de uso diario, el dueño del proyecto no debería poder nombrar en qué "app" guardó algo — porque dejó de decidirlo. Una idea para Okumo, un gasto del seguro, una cita que le gustó, un error del trade tres: todo entró por el mismo lugar y terminó donde correspondía, sin que él lo clasificara. Sus notas dispersas, su Todoist, su diario de trading en otro lado y su registro de gastos en una planilla dejaron de abrirse — no porque se lo propuso, sino porque dejaron de tener algo que El Estudio no tuviera ya.

La sensación no es de "productividad lograda" ni de "sistema dominado" — esas son exactamente las emociones que el Bible excluye como objetivo de producto (Bible Cap. 1, Cap. 11 vía `EXPERIENCE_BIBLE.md`). La sensación es de **menos peso**: menos decisiones triviales de dónde poner algo, menos herramientas que mantener, menos fragmentos sueltos. Todo, no productividad.

---

# 3. Primary Users

Un solo usuario: el dueño del proyecto. No hay personas plurales, no hay segmentos, no hay "usuario promedio" — diseñar para una audiencia genérica es exactamente lo que este Core evita, porque el propio motor de clasificación ya revela, en código, quién es esa persona: alguien que opera NASDAQ/MNQ/SP500 (`rules.ts`, reglas `trading-*`), tiene asuntos de tribunales pendientes (`mision-tribunales`), medita y va al gimnasio (`habito-meditar`, `habito-gimnasio`). El producto ya está empezando a tallarse alrededor de esta persona específica, no de un arquetipo.

El dueño es su propio tester de largo plazo: no hay ciclo de feedback vía analítica ni encuestas — hay uso diario real y corrección directa (`learnCorrection`) cuando el sistema se equivoca. Cada decisión de este documento se evalúa contra la fricción real de esa única persona, nunca contra una necesidad hipotética de un futuro usuario distinto.

---

# 4. Core Experience

**Mañana** — el Escritorio (Bible Cap. 8) es el punto de llegada; Today (Cap. 13) muestra qué merece atención antes que nada más.
**Durante el trabajo** — Threshold (Cap. 6) queda disponible para capturar cualquier pensamiento sin interrumpir lo que se está haciendo.
**Escritura** — el Journal (Cap. 10) recibe texto rápido, sin fricción, sin que escribir se sienta como "abrir una app de notas".
**Trading** — sesiones, operaciones y errores quedan en Trading (Cap. 9), no en una herramienta externa.
**Gastos** — se capturan como cualquier otro pensamiento vía Threshold; Finance (Cap. 8) los organiza después, nunca exige que se los registre ahí directamente.
**Planificación** — misiones y compromisos futuros pasan por Calendar y por la Pizarra existente (Bible Cap. 8).
**Revisión del día** — Today cierra el círculo: qué cambió, qué se resolvió, qué sigue esperando.

Ninguna de estas etapas depende de que el usuario recuerde en qué pantalla está cada cosa — el flujo es continuo, el Threshold es la única puerta de entrada indiferenciada.

---

# 5. Information Architecture

| Módulo | Propósito | Relación principal | Estado real (ver hallazgos) |
|---|---|---|---|
| **Today** | Qué merece atención ahora | Recibe señales filtradas de todos los demás módulos | Real (Bible Cap. 14) |
| **Threshold** | Punto de entrada único, sin categorización manual | Alimenta a todos los demás módulos vía `destino` | Parcialmente real, como `work-table` (Hallazgo 1) |
| **Journal** | Escritura rápida, memoria por asociación | Recibe todo lo marcado `archivo`; distinto de Library en grano (crudo vs. curado) | Real, sin entrada de navegación (Bible Cap. 14) |
| **Trading** | Reemplazo del diario de trading externo | Recibe todo lo marcado `trading` | Real (Bible Cap. 14) |
| **Finance** | Conciencia de dinero sin complejidad contable | Recibe todo lo marcado `finanzas` | Placeholder de pantalla; `destino`/mueble reservados, sin reglas de clasificación (Hallazgo 2) |
| **Calendar** | Eventos, recordatorios, vencimientos | Se integra con Today; sin `destino` propio todavía | No existe (Hallazgo 3) |
| **Habits** | Consistencia mínima, sin gamificación | Alimenta a Today de forma silenciosa | Real (Bible Cap. 14) |
| **Library** | Referencias y citas acumuladas, curadas | Recibe todo lo marcado `biblioteca` | Estación real (Corcho/`LibraryModule`), módulo de ruta todavía placeholder (Bible Cap. 14) |
| **Settings** | Configuración del sistema | Sin relación de `destino` — no es un destino de captura | No existe (Hallazgo 3) |

Relación estructural: Threshold es el único módulo del que todos los demás **reciben**; Today es el único módulo al que todos los demás **reportan**, pero nunca los agrega todos a la vez (ver prueba anti-dashboard, Cap. 13). Journal y Library comparten el mismo tipo de contenido — memoria — en dos grados distintos: Journal es crudo y cronológico-pero-enlazado, Library es curado y deliberado. Calendar y Habits comparten el eje tiempo, pero Calendar es compromiso externo agendado, Habits es ritmo propio sin fecha.

---

# 6. Threshold

> **Aclaración de nombre (obligatoria).** Dentro de `EL_ESTUDIO_CORE.md`, "Threshold" se refiere **siempre y únicamente** al módulo de captura y procesamiento universal descrito en este capítulo. Nunca se refiere al nombre de sprint "Crossing the Threshold" (`Workspace.tsx`/`gaze.ts`) ni al concepto filosófico "El Umbral" del Bible (Cap. 3). Ver Hallazgo 4 para el detalle de la homonimia.

El comportamiento completo **ya existe en código** (`work-table/IdeaCapture.tsx`, Hallazgo 1) y este documento lo adopta como la especificación oficial, no como una propuesta nueva:

1. El usuario escribe cualquier texto libre — *"Pagué el seguro"*, *"Llamar a Martín mañana"*, *"Idea para Okumo"*, *"Cita que me gustó"*, *"Perdí disciplina en el trade tres"*.
2. `comprehensionEngine.classify()` (Bible Cap. 12) propone uno de los siete `destino` reales: `hoy`, `misiones`, `habitos`, `trading`, `finanzas`, `biblioteca`, `archivo`.
3. La propuesta se muestra como algo corregible, nunca como una pregunta bloqueante — el usuario nunca elige una categoría antes de escribir.
4. Si el usuario corrige, `learnCorrection()` recuerda esa corrección para la próxima vez con ese mismo texto.
5. El contenido se mueve al mueble correspondiente (`destinoFurniture.ts` → `furniture.ts`) — el mismo dato que alimentará, a futuro, la Habitación (Cap. 16).

**Requisito explícito de Fase 1** (cierra el Hallazgo 2): hoy solo 3 de los 7 `destino` tienen reglas de clasificación reales. Ampliar la cobertura a `finanzas`, `biblioteca` y `archivo` es condición para que el ejemplo *"Pagué el seguro"* funcione como este mismo documento lo describe.

**Decisión abierta, no resuelta acá:** promover este mecanismo de un widget embebido en el Escritorio a un punto de entrada alcanzable desde cualquier pantalla de la app es el cambio de producto más consecuente que este documento identifica. Se señala para que el dueño del proyecto lo decida explícitamente, no se asume.

---

# 7. AI Behavior

Ver Bible Cap. 12 para la arquitectura completa (clasificador determinista, jerarquía de voz, "nunca enseña, recuerda"). A nivel de producto, la superficie visible de la IA en el Core se limita a exactamente dos lugares: la propuesta de destino del Threshold (Cap. 6) y las señales que Today decide mostrar (Cap. 13). No hay pantalla de "personalidad de IA", no hay chat, no hay caja de prompt. Cuando se equivoca, corregirla es un toque, nunca un formulario.

---

# 8. Finance

**Diseño de la experiencia:** resumen mensual, categorías, categorización automática (hoy inexistente, Hallazgo 2), gastos recurrentes, flujo de caja como un único número legible de un vistazo, reportes retrospectivos — nunca proyecciones ni presupuestos complejos — y observaciones de IA como señales puntuales en Today, nunca un dashboard analítico aparte.

**No-objetivos explícitos:** sin contabilidad de partida doble, sin múltiples monedas, sin facturación. El objetivo es reemplazar una planilla de gastos personales, no ser un ERP.

**Estado real:** la pantalla es hoy un `ModulePlaceholder` (tab `finanzas` en `WorkspaceTabs.tsx`); el `destino` y el `FurnitureId` ya están reservados. Construir la pantalla real es un ítem de Fase 1 (Cap. 17).

---

# 9. Trading

Reemplaza por completo el diario de trading externo (Product Mission). Cubre: operaciones, sesiones, errores, psicología, imágenes, gráficos, rendimiento y detección de patrones por IA.

**Estado real:** `TradingScreen` ya existe y es el destino real de todo lo marcado `trading` (Bible Cap. 14, `rules.ts`). Este capítulo define el estándar de completitud para esa pantalla — registro de psicología y errores, y detección de patrones — no afirma que ya estén construidos; son el criterio de Fase 2 (Cap. 17) para considerar el reemplazo del diario externo como terminado.

---

# 10. Journal

Escritura rápida, cero fricción. La IA crea relaciones entre entradas — memoria por encima de cronología, nunca una lista ordenada por fecha como interfaz principal.

**Nota de honestidad, cruzada con el Bible:** esta capacidad de relacionar entradas depende de la capa "Memoria Viva" de `voiceEngine.ts`, que el Bible Cap. 12 documenta explícitamente como stub (`null`) hoy. Por lo tanto, "memoria sobre cronología" es un criterio de Fase 3 (Cap. 17, "Memoria inteligente"), no de Fase 1 — el Journal de Fase 1 es rápido y sin fricción, pero todavía cronológico en la práctica.

---

# 11. Calendar

Módulo enteramente nuevo (Hallazgo 3): eventos, recordatorios, vencimientos, integrado con Today y con el Threshold (una fecha mencionada en una captura libre debería poder terminar acá). No-objetivo explícito: no es un calendario colaborativo — sin sincronización multi-calendario, sin invitaciones a terceros. Es una línea de tiempo personal de un solo dueño, consistente con el Cap. 3.

---

# 12. Habits

Mínimo, sin gamificación — la lista de lo prohibido ya está ratificada en el Bible Cap. 11 (sin badges, sin rachas, sin logros, sin comparación). Solo consistencia, mostrada de forma silenciosa en Today, nunca como un contador que reclama atención por sí mismo.

**Estado real:** módulo `habits` ya existe (Bible Cap. 14).

---

# 13. Today

Una sola pantalla que responde, de un vistazo: qué merece atención, qué cambió, qué importa, qué puede esperar. Se alimenta de Threshold (qué se acaba de capturar), Finance (alertas de flujo de caja), Trading (resultados de sesión), Habits (consistencia, en silencio), Calendar (vencimientos próximos) y Journal (conexiones que la IA encontró) — pero nunca los muestra todos a la vez. La prueba que debe pasar es la misma que ya rige el mundo (Bible Cap. 4, "prueba anti-dashboard"): si dos señales compiten por atención al mismo tiempo, Today está mal diseñado, no el mundo.

---

# 14. Mobile Experience

Primera interfaz oficial. Uso a una mano, captura rápida, fricción mínima: el Threshold debe ser alcanzable desde cualquier pantalla en un solo gesto, nunca enterrado bajo un menú. La navegación prioriza la zona alcanzable por el pulgar. Por instrucción explícita de este encargo, este capítulo no especifica componentes ni layout — esa es una decisión de implementación posterior.

---

# 15. Desktop Experience

El escritorio expande el móvil — mismo producto, mismo modelo mental, mismos nueve módulos, misma taxonomía de `destino`. Nunca es un segundo producto con su propia lógica. La metáfora actual de Workspace/monitores (Bible Cap. 8, Cap. 10) ya es, hoy, una implementación real de esta expansión: más densidad de información visible a la vez, sin duplicar el modelo de datos del móvil.

---

# 16. Future Interfaces

El Core nunca depende de ninguna interfaz; toda interfaz depende del Core. Esta dirección ya se respeta hoy, no es solo aspiracional: el mismo `destino` de una captura ya determina, indistintamente, en qué pestaña del escritorio aparece y en qué mueble del grafo (`furniture.ts`) se guardaría — ninguno de los dos lados conoce al otro (confirmado por consulta a Graphify, ver Nota metodológica; `furniture.ts` ya tiene tipos `HistoryEntry`/`HistoryEvento` propios, listos para alimentar una futura vista de historial por mueble sin rediseño).

| Módulo Core | Mueble futuro | Estado del mapeo |
|---|---|---|
| Threshold | Escritorio (Desk) | Real — mismo mueble que hoy aloja el Escritorio (Bible Cap. 8) |
| Finance | Archivador/Gabinete | `FurnitureId: 'finanzas'` reservado, sin estación propia |
| Trading | Mesa de análisis (Trading Desk) | Real — `mesa-analisis` ya existe como estación |
| Journal | Archivador | Real — mismo mueble que hoy aloja `archivador`/`/diario` |
| Library | Estantería (Corcho) | Real como estación; módulo de ruta todavía placeholder |
| Calendar | Muro de planificación (Pizarra) — vista compartida, no exclusiva | Resuelto (Hallazgo 5, v1.1): ver principio de "espacio físico compartido" abajo |

**Principio arquitectónico — resolución del Hallazgo 5:** un mueble futuro no es propiedad exclusiva de un módulo; es un espacio físico que puede alojar varias vistas. Ya hay precedente real de este patrón: el Escritorio aloja hoy cinco vistas distintas (Hoy/Trading/Finanzas/IA/Proyectos) sobre el mismo mueble físico, sin que ninguna sea "dueña" de él (`WorkspaceTabs.tsx`, Bible Cap. 8). La Pizarra (Planning Wall) resuelve así el conflicto entre Calendar y Misiones: ambas son vistas dentro de la misma Pizarra — junto con Timeline y Goals si llegaran a existir — no dos módulos compitiendo por un mueble. Este principio se aplica a cualquier mueble futuro con el mismo tipo de conflicto, no solo a la Pizarra.

---

# 17. Product Roadmap

**Fase 1 — Uso diario real**
Cerrar el Hallazgo 2 (reglas de clasificación para `finanzas`, `biblioteca`, `archivo`); construir Calendar; construir Settings; decidir y, si corresponde, ejecutar la promoción del Threshold a punto de entrada global (Cap. 6); construir la pantalla real de Finance.

**Fase 2 — Reemplazo de herramientas existentes**
Completar Trading con psicología, errores y detección de patrones (Cap. 9); reemplazar los placeholders de Library/`frases`; consolidar el Journal como reemplazo real de notas dispersas.

**Fase 3 — Memoria inteligente**
Activar las capas "Memoria Viva" y "Biblioteca de Sabiduría" de `voiceEngine.ts` (hoy stubs, Bible Cap. 12); relaciones entre entradas del Journal (Cap. 10).

**Fase 4 — Interfaz de Habitación**
Todo lo descrito en Bible Cap. 6–10, condicionado a que el Core de Fases 1–3 esté estable — el Core nunca depende de la Habitación (Cap. 16), así que esta fase nunca puede adelantarse a las anteriores.

---

# 18. Definition of Done

Se aplica el mismo estándar del Bible Cap. 16 (build limpio, sin sistemas duplicados, carga cognitiva mínima) más un criterio específico de producto: una funcionalidad de este Core está terminada únicamente cuando **el dueño del proyecto deja de usar la herramienta externa correspondiente** (Apple Notes, Google Keep, Todoist, diario de trading, registro de gastos, cuaderno disperso — lista exacta del Cap. Product Mission). Ese reemplazo real, no la cobertura de features ni ninguna métrica de analítica, es la única prueba de terminado que este documento reconoce.

---

# 19. Product Capabilities

Estas no son módulos — son sistemas transversales que varios módulos usan sin que ninguno los posea. Documentarlas en un solo lugar evita que cada módulo termine construyendo su propia versión del mismo mecanismo (Bible Cap. 13, "no duplicar lógica"). Ninguna debe atarse a una interfaz — deben seguir siendo válidas sin importar si las entrega el móvil, el escritorio, la Habitación o una futura interfaz espacial/AR todavía inexistente.

**Threshold Capture**
- Propósito: convertir cualquier entrada libre en contenido clasificado y enrutado sin que la persona elija una categoría.
- Por qué existe: es el único mecanismo que permite el flujo Vida→Memoria→Comprensión sin archivado manual (Product Principles).
- Quién puede usarla: cualquier superficie de entrada futura — hoy texto, potencialmente voz o gesto más adelante — no solo la UI del módulo Threshold.
- Módulos que dependen de ella: Threshold (Cap. 6) y, transitivamente, todo módulo que recibe un `destino` (Today, Journal, Trading, Finance, Habits, Library — Cap. 5).
- Estado: parcialmente real — ver Cap. 6 y Hallazgo 2 (solo 3 de 7 `destino` tienen reglas de clasificación).

**Smart Classification**
- Propósito: decidir a qué `destino` pertenece un contenido.
- Por qué existe: es la decisión que la persona nunca debería tomar por sí misma (Cap. 6).
- Quién puede usarla: Threshold Capture la llama directamente; cualquier futura superficie de captura llamaría al mismo motor.
- Módulos que dependen de ella: los mismos que Threshold Capture.
- Estado: real, con cobertura parcial — `ClassificationEngine` (puerto) + `RuleBasedClassifier` (proveedor único, Bible Cap. 12), 9 reglas de palabra clave cubriendo solo `habitos`/`trading`/`misiones`.

**Learning Engine**
- Propósito: recordar correcciones de clasificación para no repetir el mismo error.
- Por qué existe: mantiene a Smart Classification mejorando sin entrenar ningún modelo ni pedirle configuración a la persona.
- Quién puede usarla: Smart Classification la consume; ningún módulo la llama directo.
- Módulos que dependen de ella: los mismos que Threshold Capture, indirectamente.
- Estado: real — `learnCorrection()` / `getLearnedDestino()` (`rule-based/memory.ts`).

**AI Memory**
- Propósito: recordar contenido pasado relevante sin que se lo pidan — lo que el Bible llama "la IA recuerda, nunca enseña" (Bible Cap. 2, Cap. 12).
- Por qué existe: es la diferencia entre un sistema de archivo y un lugar que conoce la historia de la persona.
- Quién puede usarla: pensada primero para Journal (Cap. 10) y Today (Cap. 13).
- Módulos que dependen de ella: Journal ("relaciones entre entradas", Cap. 10) depende explícitamente de esto; las señales de Trading en Today (Cap. 9, Cap. 13) también dependerían de ella.
- Estado: futuro — las capas "Memoria Viva" y "Biblioteca de Sabiduría" de `voiceEngine.ts` existen como código pero devuelven `null` hoy (Bible Cap. 12).

**Cross-module References**
- Propósito: que un contenido pueda señalar dónde estuvo o relacionarse con otro contenido.
- Por qué existe: nada en El Estudio debería ser un callejón sin salida — un pensamiento capturado conserva su rastro incluso después de cambiar de lugar.
- Quién puede usarla: cualquier módulo cuyo contenido se mueva entre `destino`s.
- Módulos que dependen de ella: Threshold (historial de enrutamiento), Journal (enlace entre entradas, futuro).
- Estado: parcialmente real a nivel de enrutamiento — `Idea.history`, tipos `HistoryEntry`/`HistoryEvento` (`furniture.ts`), confirmado en producción en `src/lib/db/db.ts`. El enlace semántico entrada-a-entrada depende de AI Memory y es trabajo futuro.

**Notification System** — ver Hallazgo 6, contradicción documentada, no resuelta.
- Propósito (tal como se pidió): mostrarle a la persona información sensible al tiempo.
- Por qué está en tensión: el Bible Cap. 2 ratifica que ningún objeto puede iniciar algo hacia la persona, y el Cap. 11 prohíbe explícitamente notificaciones invasivas.
- Quién la usaría: principalmente recordatorios de Calendar (Cap. 11) y alertas de Finance (Cap. 8).
- Módulos que dependen de ella: Calendar, Finance, Today.
- Estado: no existe. Si puede existir de alguna forma compatible con el Bible Cap. 2 — por ejemplo, como superficie pasiva dentro de Today en vez de una alerta que se inicia sola — es una pregunta arquitectónica abierta, no una decisión de este documento.

**Offline-first**
- Propósito: que cada escritura funcione localmente sin importar la conectividad.
- Por qué existe: un lugar nunca debería sentirse no disponible.
- Quién puede usarla: todos los módulos — todo el contenido ya vive acá.
- Módulos que dependen de ella: Today, Threshold, Journal, Trading, Finance, Habits (todos los módulos reales actuales).
- Estado: real, en producción — `src/lib/db/db.ts`, IndexedDB vía Dexie, elegido explícitamente sobre `localStorage` por durabilidad. Las tres tablas de contenido (`ideas`, `operaciones`, `habitChecks`) ya son locales-primero hoy.

**Sync**
- Propósito: que los mismos datos locales sean alcanzables desde más de un dispositivo.
- Por qué existe: la persona no debería tener que elegir qué dispositivo tiene la verdad.
- Quién la usaría: los mismos módulos que Offline-first, una vez que exista.
- Módulos que dependen de ella: ninguno todavía — nada lee ni limpia el flag.
- Estado: solo el esquema está listo — cada fila ya lleva un flag `pendingSync` (`db.ts`, desde la versión 7 de schema), pero, según el propio comentario del código, "el motor de sync todavía no existe." No hay backend conectado; un futuro proyecto Supabase está anticipado para sincronizar, nunca para reemplazar, la base local.

**Universal Search**
- Propósito: encontrar cualquier cosa en El Estudio sin importar en qué módulo vive.
- Por qué existe: la memoria (Product Principles) solo sirve si es recuperable.
- Quién puede usarla: todos los módulos.
- Módulos que dependen de ella: ninguno todavía.
- Estado: no existe — no hay índice de búsqueda, no hay UI de búsqueda, ninguna evidencia en el código.

**Presence Engine (futuro)**
- Propósito, por qué existe y estado: pertenecen enteramente al Bible (Cap. 5) — no se redefinen acá. Se referencia porque eventualmente modulará cómo se siente el contenido de cada módulo (materiales, luz, vida ambiental) una vez que exista una interfaz espacial.
- Módulos que dependen de ella: ningún módulo actual; todo módulo futuro alojado en la Habitación, sí.

**Attention Engine (futuro)**
- Propósito, por qué existe y estado: pertenecen enteramente al Bible (Cap. 1, Cap. 4, `ATTENTION_ENGINE.md`) — no se redefinen acá.
- Módulos que dependen de ella: Today (Cap. 13) ya implementa su ley central hoy ("como máximo un punto pesa más que el reposo a la vez") incluso antes de que exista un motor dedicado.

---

## Change Log

**v1.1 (2026-07-23) — sprint de refinamiento**

- **Qué cambió:** se agregó el Cap. 19 (Product Capabilities, nueve sistemas transversales documentados); se agregó un bloque de aclaración de nombre explícito al inicio del Cap. 6; se resolvió el Hallazgo 5 reencuadrando la Pizarra como espacio físico compartido (Cap. 16), citando como precedente real el patrón de tabs ya existente en el Escritorio; se agregó el Hallazgo 6, documentando — sin resolver — el choque entre "Notification System" y la ley ratificada del Bible Cap. 2. Ningún capítulo existente fue reescrito ni renombrado; todos los cambios son aditivos o correcciones puntuales de una fila de tabla.
- **Por qué mejora la arquitectura:** las capacidades transversales estaban antes implícitas y repetidas entre capítulos de módulo (Threshold Capture dentro del Cap. 6, Learning Engine mencionado solo de paso, Offline-first no mencionado en ningún lado pese a ya estar en producción) — consolidarlas en un solo capítulo le da a cualquier ingeniero o IA futura un único lugar para verificar "¿esto ya existe?" antes de construir una versión propia por módulo, sirviendo directamente la regla de reutilización del Bible Cap. 13. La resolución del Hallazgo 5 elimina un conflicto sin resolver usando un patrón que ya existe en producción, en vez de inventar uno nuevo.
- **Graphify:** no se regeneró. El grafo existente (`graphify-out/graph.json`, 2026-07-22) se comprobó más nuevo que ningún archivo de código fuente tocado en este sprint — la estructura del repositorio no cambió, solo se agregaron dos documentos Markdown ya leídos directamente. Regenerarlo habría reprocesado el mismo código sin información nueva. Los hallazgos nuevos de este sprint (Offline-first real, Sync solo-esquema, Universal Search inexistente) salieron de lecturas directas y dirigidas (`src/lib/db/db.ts`, greps de "search"/"buscar") en vez de una consulta al grafo, porque para estas preguntas puntuales una lectura directa fue más precisa y más barata que una travesía BFS — decisión de Token Optimization documentada tal como exige este mismo encargo.
- **Decisiones arquitectónicas que siguen abiertas a propósito:** Hallazgo 6 (Notification System vs. Bible Cap. 2 — sin resolver); la promoción del Threshold de widget de escritorio a punto de entrada global (Cap. 6, decisión abierta original, sin cambios); el requisito de Fase 1 de ampliar cobertura de clasificación a `finanzas`/`biblioteca`/`archivo` (Hallazgo 2, sin cambios).

---

*Fin de EL_ESTUDIO_CORE.md v1.1. Toda actualización futura debe releer primero el Bible y esta misma sección de Hallazgos antes de modificar cualquier capítulo — un hallazgo resuelto se marca como tal, nunca se borra en silencio.*
