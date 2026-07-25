# Ratified Decisions 1.0

### El estado oficial del conocimiento de El Estudio, a la fecha de esta auditoría

> STATUS: Conceptual Design Freeze
>
> Este documento no diseña, no crea reglas, no propone experiencias,
> sistemas ni comportamiento. No es una biblia más. Es el inventario que
> dice, sobre las ocho bibias y los diez documentos de apoyo que ya
> existen, qué quedó congelado, qué sigue en discusión, qué se descartó
> y por qué, y dónde está la respuesta a cada una de esas cuatro
> preguntas. Todo lo que seguía siendo idea antes de este documento,
> sigue siendo idea después — acá no se resuelve nada por primera vez,
> solo se cataloga lo que ya se resolvió, en otro lugar, antes.

---

## Antes de curar: siete palabras, siete categorías distintas

Confundirlas es, probablemente, la forma más silenciosa en que un
proyecto de este tamaño pierde coherencia — no por un error de diseño,
sino por tratar como intercambiables cosas que exigen tratamiento
distinto:

- **Una idea** — algo que alguien propuso. No compromete a nadie
  todavía. La mayoría de lo escrito en `future-furniture.md` vive acá.
- **Una hipótesis** — una idea con una predicción explícita adjunta,
  que todavía no se puede confirmar porque falta el tiempo real que la
  pondría a prueba. La corrección de "el primer objeto" en
  `MOMENTS_BIBLE.md` se declara a sí misma como esto, con esas palabras.
- **Una convención** — un acuerdo práctico de cómo se hace algo, sin
  pretensión filosófica. `AI_DEVELOPMENT_RULES.md` es, en su totalidad,
  una colección de convenciones — gobierna el trabajo, no el mundo.
- **Una preferencia** — un gusto sin justificación necesaria más allá
  de sí mismo. Casi no aparece en este corpus como categoría propia,
  precisamente porque el proyecto exige justificar casi todo — lo poco
  que sí es preferencia pura (ciertos materiales sobre otros en
  `libro-01` §03) se acepta como tal sin necesitar más defensa.
- **Una decisión** — una idea que ya se evaluó contra el resto del
  proyecto y se adoptó, con una razón registrada. La mayoría de las
  entradas de la tabla en `§2` son esto.
- **Una ley** — una decisión que además se declara no negociable: si
  algo futuro la contradice, lo que está mal es lo futuro, nunca la
  ley. Ver `§5`, Architectural Invariants.
- **Una verdad del proyecto** — el nivel más alto, reservado casi
  exclusivamente al Axioma de `WORLD_FOUNDATIONS.md`. A diferencia de
  una ley, una verdad del proyecto no se deriva de nada anterior — todo
  lo demás se deriva de ella.

**Dónde los documentos anteriores mezclaron estas categorías:**
`ESTUDIO_MASTER_CONTEXT.md` presenta, en la misma lista numerada (§3,
"Filosofía"), afirmaciones que son verdades del proyecto ("El Estudio
no es una aplicación") junto a lo que en realidad son decisiones de
alcance revisables ("Los muebles son más importantes que las
pantallas"). Ninguna de las dos es falsa, pero tratarlas con el mismo
peso le esconde a un lector nuevo que una es innegociable y la otra,
en teoría, podría revisarse si el proyecto cambiara de forma
suficientemente radical. Se corrige acá clasificando cada una por
separado en `§2` y `§5`, no reescribiendo el documento original.

## Segunda reflexión: cuándo congelar, y cuándo todavía no

Una decisión merece congelarse cuando cumple tres condiciones a la
vez: sobrevivió a más de un sprint sin que ningún documento posterior
la contradijera, tiene un documento propietario claro, y su reversión
implicaría reescribir más de un documento existente. Todavía no merece
congelarse cuando cumple cualquiera de estas: nació en el sprint más
reciente y ningún documento posterior tuvo oportunidad todavía de
ponerla a prueba: o depende de evidencia que el proyecto reconoce no
tener todavía (ver `§8`, Design Debt); o resuelve una tensión nombrando
una preferencia sin haber descartado la alternativa con el mismo rigor.

El riesgo de congelar demasiado pronto es concreto y ya ocurrió una vez
en este proyecto: cuatro documentos se autodeclararon "la" autoridad
antes de que existiera ningún árbitro (ver `§1`) — cada uno, tomado
solo, parecía maduro en el momento de escribirse. La lección que este
documento aplica en `§2`: **madurez no es lo mismo que confianza al
escribir.** Por eso varias decisiones de los sprints más recientes
(la gramática de once verbos, el olvido con gracia) se marcan acá como
ratificadas pero con nivel de estabilidad medio, no alto — están
aceptadas como la mejor respuesta disponible hoy, no como verdades ya
probadas por el tiempo.

---

## 1. Document Authority

Cuatro documentos se autodeclaraban, cada uno por separado, la máxima
autoridad del proyecto (`SPATIAL_EXPERIENCE_MANIFESTO.md`, `libro-01`,
`ESTUDIO_MASTER_CONTEXT.md`, `vision.md`) — hallazgo original de
`WORLD_DESIGN_PRINCIPLES.md` §0, que propuso una jerarquía sin
ratificarla. Cuatro sprints después, esa jerarquía nunca recibió una
respuesta explícita del usuario, y mientras tanto dos documentos más
recientes (`LIVING_SYSTEMS_BIBLE.md`, `WORLD_BEHAVIOR_LANGUAGE.md`)
publicaron su propia versión de "el orden en que nace el conocimiento"
— una cadena de dependencia lógica, no una jerarquía de autoridad. Las
dos cosas nunca se conciliaron explícitamente hasta ahora.

**El hallazgo de esta auditoría:** jerarquía de autoridad (quién gana
un conflicto) y cadena de dependencia (qué se apoya en qué para
existir) son dos ejes distintos, y este proyecto los tenía mezclados
sin saberlo. Se resuelven juntos acá, no como decisión unilateral —
como propuesta consolidada, igual que hizo `WORLD_DESIGN_PRINCIPLES.md`
§0 en su momento (ver `§3`, Open Questions #1).

### La jerarquía propuesta

**Nivel 0 — Raíz.** `WORLD_FOUNDATIONS.md`. No depende de nada. Todo
depende, directa o indirectamente, de él. Solo se toca si cambia la
misión del proyecto entero.

**Nivel 1 — Árbitro.** `WORLD_DESIGN_PRINCIPLES.md`. Resuelve
conflictos entre documentos del Nivel 2. Depende del Nivel 0. Es el
único documento con autoridad para declarar que una ley de dominio
específico queda refinada o revocada.

**Nivel 2 — Leyes de dominio,** todas con la **misma autoridad** entre
sí (ninguna le gana a otra en un conflicto — eso lo resuelve el Nivel
1), pero con un **orden de dependencia interno** que si determina qué
cita a qué:

```
LIVING_SYSTEMS_BIBLE       (mecanismo: qué corre)
        │
WORLD_BEHAVIOR_LANGUAGE    (gramática: cómo se expresa lo que corre)
        │
        ├── PRESENCE_ENGINE            (percepción: qué se siente vivo)
        ├── ATTENTION_ENGINE           (percepción: a qué le toca pesar)
        ├── SPATIAL_EXPERIENCE_MANIFESTO (leyes del espacio mismo)
        ├── libro-01-biblia-del-estudio  (canon de objetos concretos)
        └── vision.md                    (convenciones de ingeniería diaria)
                │
                ├── EXPERIENCE_BIBLE   (qué se siente habitar todo lo anterior)
                        │
                        └── MOMENTS_BIBLE  (qué instantes de eso se recuerdan)
```

**Nivel 3 — Resumen de onboarding, sin autoridad de resolución.**
`ESTUDIO_MASTER_CONTEXT.md` deja de llamarse "la única fuente de
verdad" (como dice hoy su propio encabezado) y pasa a ser lo que de
hecho ya cumple bien: el primer documento que lee alguien nuevo, nunca
el que zanja un desacuerdo entre dos documentos de Nivel 2.

**Categoría aparte — proceso, no ley del mundo.**
`AI_DEVELOPMENT_RULES.md` gobierna cómo trabaja una IA sobre el
proyecto (alcance, reutilización, consumo de tokens) — no qué es El
Estudio. No compite por autoridad con ningún documento de Nivel 2
porque contesta una pregunta distinta por completo.

**Categoría aparte — inventario y evidencia, no ley.** `world-map.md`,
`furniture-map.md`, `future-furniture.md` (bocetos deliberadamente
provisionales, "no se implementa hasta que haya evidencia real"),
`LIVING_THE_STUDIO.md` (prueba narrada de que las leyes ya funcionan,
citada como evidencia por `EXPERIENCE_BIBLE.md`, no como ley en sí
misma) y `experience-log.md` (bitácora de uso real — la única fuente
de datos empíricos genuinos de todo el corpus, pero sin ninguna
autoridad para decidir nada por sí sola).

### Por documento

| Documento | Qué gobierna | Qué nunca debería repetir | Depende de | Depende de él |
|---|---|---|---|---|
| `WORLD_FOUNDATIONS.md` | El axioma, los cuatro Libros, el glosario del mundo | Nada — es la raíz | Nada | Todos |
| `WORLD_DESIGN_PRINCIPLES.md` | Qué puede existir; arbitraje entre documentos de Nivel 2 | Filosofía ya resuelta en Foundations | Foundations | Todo el Nivel 2 y este documento |
| `LIVING_SYSTEMS_BIBLE.md` | Qué procesos corren, exista o no observación | Reglas de qué puede existir (eso es de Design Principles) | Foundations, Design Principles | Behavior Language, Presence, Attention, Experience, Moments |
| `WORLD_BEHAVIOR_LANGUAGE.md` | Vocabulario y sintaxis de expresión de cualquier objeto | Los sistemas mismos (eso es de Living Systems) | Living Systems | Presence, Attention (como vocabulario compartido) |
| `PRESENCE_ENGINE.md` | Las nueve capas de presencia y la Atmósfera como resultado auditado | El mecanismo temporal en sí (eso es de Living Systems) | Living Systems, Behavior Language | Experience Bible |
| `ATTENTION_ENGINE.md` | La ley madre; a qué le toca pesar más en cada instante | Qué representa cada capa (eso es de Presence) | Living Systems, Behavior Language | Spatial Manifesto, Experience Bible, Moments Bible |
| `SPATIAL_EXPERIENCE_MANIFESTO.md` | Las trece leyes del espacio como lugar | Atención o presencia (esos son dominios propios) | Attention, Presence | Experience Bible, libro-01 |
| `libro-01-biblia-del-estudio.md` | El canon concreto de ocho objetos y materiales | Leyes espaciales generales (eso es del Manifiesto) | Spatial Manifesto | vision.md, future-furniture.md |
| `vision.md` | Convenciones de ingeniería del día a día, ancladas a archivos reales | El canon de objetos (eso es de libro-01) | libro-01 | Ningún documento conceptual — es el más cercano al código |
| `EXPERIENCE_BIBLE.md` | Qué se siente habitar las leyes ya escritas | Qué puede existir (eso es de Design Principles) | Design Principles, Presence, Attention, Spatial Manifesto | Moments Bible |
| `MOMENTS_BIBLE.md` | Qué instantes se vuelven recuerdo | Qué se siente en general (eso es de Experience Bible) | Experience Bible | Ninguno todavía — es la hoja más alta del árbol de dominio |
| `ESTUDIO_MASTER_CONTEXT.md` | Resumen de onboarding rápido | Nada que ya esté mejor resuelto en otro lado — no debería, hoy, tener secciones filosóficas propias | Todos, por resumen | Nadie — nadie debería citarlo para resolver un conflicto |
| `AI_DEVELOPMENT_RULES.md` | Cómo trabaja una IA sobre este repositorio | Filosofía del mundo (eje distinto) | Ninguno del árbol conceptual | El proceso de cada sprint, no el conocimiento |
| `world-map.md` | Adyacencia espacial física entre lugares | Función de los muebles (eso es de `furniture-map.md`) | Spatial Manifesto | Nada formalmente — es un boceto |
| `furniture-map.md` | Flujo funcional entre muebles (qué alimenta a qué) | Adyacencia espacial (eso es de `world-map.md`) | libro-01, vision.md | Nada formalmente |
| `future-furniture.md` | Inventario de muebles no construidos, sin comprometerse a nada | Cualquier regla ya resuelta en otro documento | libro-01 | Design Principles §9 lo cita como caso de prueba |
| `LIVING_THE_STUDIO.md` | Prueba narrada de que las leyes producen la experiencia deseada | Ninguna ley nueva — es evidencia, no fuente | Spatial Manifesto, libro-01 | Experience Bible Ejercicio 1 |
| `experience-log.md` | Registro de uso real, sin interpretación | Cualquier idea o deseo — solo evidencia | Nada — es observación pura | Debería alimentar futuras revisiones de Design Debt |

**Nota de aclaración, no de contradicción:** `world-map.md` y
`furniture-map.md` comparten vocabulario (ambos mencionan Escritorio y
Biblioteca) y nombres parecidos, lo cual podría leerse como
duplicación. No lo es: uno mapea *dónde* está cada cosa en el espacio
físico, el otro mapea *qué alimenta a qué* funcionalmente. Se deja
registrado acá para que ningún futuro sprint intente fusionarlos por
error.

---

## 2. Ratified Decisions

Registro completo. "Fecha lógica" usa el orden de aparición dentro del
proyecto (fundacional, o número de sprint de la serie de seis), no
una fecha de calendario.

| # | Decisión | Estado | Documento propietario | Justificación | Dependencias | Fecha lógica | Estabilidad |
|---|---|---|---|---|---|---|---|
| 1 | El Axioma: El Estudio acompaña transformación, no organiza información | Ratificado | `WORLD_FOUNDATIONS.md` | Toda otra ley se deriva de esta; ninguna puede contradecirla | Ninguna | Fundacional | Máxima |
| 2 | El espacio es la interfaz — sin menús flotantes | Ratificado | `SPATIAL_EXPERIENCE_MANIFESTO.md` I | Es la diferencia declarada entre operar un sistema y habitar un lugar | Axioma | Fundacional | Máxima |
| 3 | La cámara invisible | Ratificado | `SPATIAL_EXPERIENCE_MANIFESTO.md` IV | Condición de que el mundo se sienta habitado, no operado | Axioma | Fundacional | Máxima |
| 4 | La IA es habitante; nunca enseña, recuerda | Ratificado | Manifiesto VI, `libro-01` §10, `vision.md` | Distingue el proyecto de un asistente o coach | Axioma | Fundacional | Máxima |
| 5 | Regla del mundo físico: todo efecto debe existir en una habitación real | Ratificado | `vision.md`, `libro-01` §03/07 | Único filtro objetivo y verificable para cualquier decisión visual futura | Axioma | Fundacional | Máxima |
| 6 | Cero gamificación explícita (badges, XP, rachas, tablas) | Ratificado | `libro-01` §11 | El apego se construye por evidencia, no por recompensa (Manifiesto X) | Axioma | Fundacional | Máxima |
| 7 | Objetos como habitantes: deben responder por qué existen, qué historia cuentan, cómo envejecen, qué se siente al encontrarlos | Ratificado | `libro-01` §04, `vision.md` (`reason`/`story` en `RoomObjectDefinition`) | Es el filtro de admisión de todo objeto nuevo | Axioma, Regla del mundo físico | Fundacional | Alta |
| 8 | Nueve capas de presencia (raíz Tiempo, cinco expresiones, tres soportes de memoria) con Atmósfera como resultado auditado, nunca diseñado directo | Ratificado | `PRESENCE_ENGINE.md` | Evita que "mejorar la atmósfera" sea una tarea sin capa concreta asociada | Axioma | Fundacional | Alta |
| 9 | Ley madre de atención: un solo punto puede pesar más que el reposo a la vez | Ratificado | `ATTENTION_ENGINE.md` | La ley que más se cita en todo el corpus posterior; produce calma medible | Axioma | Fundacional | Máxima |
| 10 | El objetivo del sistema de atención es volverse innecesario con el tiempo | Ratificado | `ATTENTION_ENGINE.md` | Alinea el éxito del sistema con la memoria espacial de la persona, no con el uso del sistema | Ley madre | Fundacional | Alta |
| 11 | La prueba de los veinte años (no cinco) | Ratificado | Manifiesto XIII; confirmado explícitamente en `WORLD_DESIGN_PRINCIPLES.md` cierre | Usar una cifra menor habría sido la misma inconsistencia silenciosa que este documento existe para cazar | Axioma | Fundacional / Sprint 1 | Máxima |
| 12 | Instrumento contra Ritual como categorías de objeto | Ratificado | `WORLD_DESIGN_PRINCIPLES.md` §6 | Gap real que ningún documento anterior resolvía; evita forzar ceremonia sobre objetos que no la piden | Regla del mundo físico | Sprint 1 | Alta |
| 13 | Prueba de las dos preguntas para admitir interactividad | Ratificado | `WORLD_DESIGN_PRINCIPLES.md` §4 | Operacionaliza "no todo objeto debe ser interactivo" | Instrumento/Ritual | Sprint 1 | Alta |
| 14 | Un mueble nuevo nace ya presente, nunca anunciado | Ratificado | `WORLD_DESIGN_PRINCIPLES.md` §9 | La regla de descubrimiento más citada por los sprints posteriores (Experience, Moments, Behavior Language) | Ley madre de atención | Sprint 1 | Alta |
| 15 | Curva emocional continua: reconocimiento → alivio → familiaridad → propiedad → continuidad personal | Ratificado | `EXPERIENCE_BIBLE.md` §1-5 | Reemplaza cualquier métrica de "engagement" por una progresión emocional verificable en la narración | Axioma, Manifiesto | Sprint 2 | Alta |
| 16 | Motivación y logro excluidos como emociones de producto | Ratificado | `EXPERIENCE_BIBLE.md` §16 | Ambas implican una medida externa de progreso ajena a un lugar | Cero gamificación | Sprint 2 | Alta |
| 17 | Distinción Momento / Recuerdo / Evento / Recompensa / Sorpresa | Ratificado | `MOMENTS_BIBLE.md` | Sin ella, "momento" se vuelve indistinguible de "evento bien disimulado" | Experience Bible | Sprint 3 | Alta |
| 18 | Corrección de "El primer objeto": siempre descubrible, nunca revelado por el sistema una sola vez | Ratificado, reemplaza a `EXPERIENCE_BIBLE.md` Ej.4 | `MOMENTS_BIBLE.md` | La versión original confundía momento con evento | Distinción Momento/Evento | Sprint 3 | Media — hipótesis sin validar por tiempo real (ver `§8`) |
| 19 | Sistemas recalculables contra sistemas acumulativos | Ratificado | `LIVING_SYSTEMS_BIBLE.md` | Distingue qué necesita memoria real de qué solo necesita consultar el reloj; ya validado en producción por la luz | Ley VII del Manifiesto | Sprint 4 | Alta |
| 20 | El olvido con gracia: existencia y prominencia son cosas distintas | Ratificado | `LIVING_SYSTEMS_BIBLE.md` §9 | Corrige el supuesto implícito de que "nada se pierde" significaba "todo permanece igual de visible" | Sistemas acumulativos | Sprint 4 | Media — sin mecanismo concreto todavía (ver `§8`) |
| 21 | Exclusividad de autoría: nada cambia por acción o dato de otra persona | Ratificado | `LIVING_SYSTEMS_BIBLE.md` §11 | Protege el proyecto antes de que exista la primera tentación de una función social | Axioma | Sprint 4 | Media — cierta hoy por ausencia de contraejemplo, no por regla activa |
| 22 | Coherencia por raíz común: todo sistema nuevo responde tres preguntas de admisión antes de aceptarse | Ratificado | `LIVING_SYSTEMS_BIBLE.md` §18 | Previene, a nivel de sistemas, el mismo problema que ya ocurrió a nivel de documentos | Reloj único | Sprint 4 | Alta |
| 23 | Gramática de once verbos (esperar, ofrecerse, acompañar, ceder, retirarse, persistir, guardar, envejecer, coincidir, recordar, callar) | Ratificado | `WORLD_BEHAVIOR_LANGUAGE.md` | Vocabulario mínimo suficiente, probado sin excepciones contra cinco objetos distintos | Sistemas recalculables/acumulativos, Ley madre | Sprint 5 | Media — sin objetos construidos que la usen todavía |
| 24 | Ningún objeto puede iniciar algo hacia la persona | Ratificado | `WORLD_BEHAVIOR_LANGUAGE.md` §5 | Coherente con "no aparece, se encuentra" de `vision.md` y con la ley madre | Ley madre, regla de descubrimiento silencioso | Sprint 5 | Alta |
| 25 | Jerarquía documental unificada (autoridad + dependencia) | **Propuesto, pendiente de ratificación del usuario** | Este documento, `§1` | Resuelve la mezcla entre autoridad y dependencia nunca antes distinguida | Todo el corpus | Sprint 6 (curación) | Baja hasta ratificación explícita |

---

## 3. Open Questions

### 1. Jerarquía definitiva de autoridad documental

**Por qué sigue abierta:** esta auditoría propone una resolución
completa en `§1`, pero es una propuesta — igual que la de
`WORLD_DESIGN_PRINCIPLES.md` §0 hace cuatro sprints — porque reasigna
el rol de documentos que el usuario escribió, y esa reasignación no le
corresponde a ninguna IA cerrar unilateralmente. **Qué documentos
afecta:** los dieciocho. **Qué información falta:** una respuesta
explícita del usuario — sí o no a la jerarquía de `§1`. **Riesgo de
mantenerla abierta:** cualquier conflicto real futuro entre dos
documentos de Nivel 2 no tiene, todavía, un árbitro con autoridad
confirmada — solo uno propuesto.

### 2. Silencio contra urgencia real en Trading

**Por qué sigue abierta:** es la única tensión nombrada, sin
excepción, en los cuatro documentos de experiencia
(`WORLD_DESIGN_PRINCIPLES.md` §5, `EXPERIENCE_BIBLE.md` §15 y Ej.5,
y de forma indirecta en `ATTENTION_ENGINE.md` al prohibir el color
intenso) sin que ninguno proponga una resolución, solo alternativas
sin decidir (lenguaje material en vez de color). **Qué documentos
afecta:** `ATTENTION_ENGINE.md`, `WORLD_DESIGN_PRINCIPLES.md`,
`EXPERIENCE_BIBLE.md`, y cualquier especificación futura de la
estación `pizarra`/Trading. **Qué información falta:** una decisión de
dirección de arte sobre si Trading es una excepción declarada a la ley
madre o si necesita un lenguaje propio no basado en color. **Riesgo de
mantenerla abierta:** es, de las siete preguntas de esta lista, la que
tiene más probabilidad de resolverse mal bajo presión de una fecha de
lanzamiento — exactamente el patrón que `LIVING_SYSTEMS_BIBLE.md`
ya identificó como el más peligroso de todos.

### 3. Límite físico del espacio a veinte años

**Por qué sigue abierta:** nombrada de forma independiente en cuatro
documentos (`WORLD_DESIGN_PRINCIPLES.md` §5, `EXPERIENCE_BIBLE.md`
Ej.2, `LIVING_SYSTEMS_BIBLE.md` §9, `WORLD_BEHAVIOR_LANGUAGE.md` Ej.5)
sin que ninguno decida si la solución es crecer a más de una
habitación o retirar muebles con algún criterio no punitivo. **Qué
documentos afecta:** potencialmente todos los de Nivel 2. **Qué
información falta:** una decisión de alcance de producto (¿el mundo
crece a una casa?), no una decisión de diseño conceptual — este
corpus ya agotó lo que puede decidir sin esa definición previa. **Riesgo:**
ver `§7`, Knowledge Gaps #4.

### 4. Inmersión total contra necesidad de consulta rápida

**Por qué sigue abierta:** el proyecto es mobile-first y rechaza
explícitamente ser "el camino más rápido" (`WORLD_DESIGN_PRINCIPLES.md`
§2), pero Trading y Hábitos son, en parte, herramientas donde a veces
solo hace falta un dato en tres segundos. **Qué documentos afecta:**
`WORLD_DESIGN_PRINCIPLES.md`, `EXPERIENCE_BIBLE.md` Ej.5, `vision.md`
(mobile-first). **Qué información falta:** si existe alguna forma
legítima de consulta rápida que no se sienta como haber roto el mundo,
o si la respuesta correcta es simplemente aceptar el costo. **Riesgo:**
que alguien resuelva esto en silencio agregando un atajo sin pasar por
ninguna revisión — ya nombrado como el mecanismo exacto de erosión en
`EXPERIENCE_BIBLE.md` Ejercicio 3.

### 5. Copy explicativo dentro del mundo

**Por qué sigue abierta:** `EXPERIENCE_BIBLE.md` Ejercicio 5 identifica
que ningún documento prohíbe explícitamente, a nivel de texto, frases
como "este es tu escritorio, acá podés..." — es un gap de regla, no
solo un riesgo de ejecución. **Qué documentos afecta:**
`WORLD_DESIGN_PRINCIPLES.md`, `EXPERIENCE_BIBLE.md`, cualquier futuro
trabajo de copy. **Qué información falta:** una regla explícita, no
solo un riesgo nombrado. **Riesgo:** es exactamente el tipo de decisión
bien intencionada (accesibilidad, onboarding) que se cuela sin pasar
por ninguna revisión previa.

### 6. Cohabitación de más de una persona en el mismo mundo

**Por qué sigue abierta:** nombrada de forma independiente tres veces
(`MOMENTS_BIBLE.md` como "herencia", `LIVING_SYSTEMS_BIBLE.md` como
"cohabitación", `WORLD_BEHAVIOR_LANGUAGE.md` como "lenguaje con más de
un destinatario") sin que ninguna la desarrolle. **Qué documentos
afecta:** la exclusividad de autoría (decisión #21) dejaría de ser una
regla simple. **Qué información falta:** si el producto alguna vez
soporta más de una persona por mundo — decisión de alcance, no de
diseño conceptual. **Riesgo:** ver `§7`, Knowledge Gaps #1.

### 7. ¿Existe una forma de pérdida real, no punitiva?

**Por qué sigue abierta:** `MOMENTS_BIBLE.md` Ejercicio 6 y
`LIVING_SYSTEMS_BIBLE.md` Ejercicio 6 nombran la ausencia total de
estados terminales como una limitación real del mundo actual, pero
ninguno de los dos siquiera propone una hipótesis de cómo se vería.
**Qué documentos afecta:** `LIVING_SYSTEMS_BIBLE.md`,
`WORLD_BEHAVIOR_LANGUAGE.md` (necesitaría un verbo nuevo). **Qué
información falta:** literalmente todo — es la pregunta más
subdesarrollada de esta lista. **Riesgo:** bajo, mientras nadie lo
implemente por accidente; el riesgo real sería resolverlo apurado
dentro de otro sprint sin dedicarle uno propio.

---

## 4. Rejected Ideas

**"Los objetos representan rituales, no funciones."** Rechazada tal
como estaba escrita por `WORLD_DESIGN_PRINCIPLES.md` (evaluación de
principios #9). Rompía la Regla del mundo físico al forzar ceremonia
sobre objetos que en la vida real no la tienen — un archivador de
metal frío (ya descrito así en `future-furniture.md`) no gana nada
siendo tratado como ritual sagrado. Invalidada por la distinción
Instrumento/Ritual (`WORLD_DESIGN_PRINCIPLES.md` §6), que la
reemplaza por completo.

**"Ningún objeto pide atención" (versión absoluta, sin excepción).**
Rechazada en su forma literal por la misma evaluación de principios
(#6). Contradecía directamente la ley madre ya vigente en
`ATTENTION_ENGINE.md`, que permite exactamente un punto de énfasis con
razón real. Reemplazada por: "ningún objeto pide atención sin una
razón real — y nunca más de uno a la vez."

**"El primer objeto" (versión original: revelación de una sola vez,
decidida por el sistema).** Rechazada por `MOMENTS_BIBLE.md`, que la
identifica como su propia autocrítica obligatoria. Rompía la
distinción Momento/Evento: exigía que el sistema decidiera activamente
cuándo conceder el descubrimiento, lo cual es la definición exacta de
evento disfrazado. Reemplazada por: el origen del objeto es notable en
cualquier momento que alguien le preste atención de cerca, sin límite
de "una sola vez."

**El verbo "invitar" como comportamiento de objeto.** Rechazado por
`WORLD_BEHAVIOR_LANGUAGE.md` §2. Implicaba que el objeto inicia un
gesto hacia la persona, lo cual viola tanto la ley madre de
`ATTENTION_ENGINE.md` como la conclusión de que ningún objeto puede
iniciar nada (decisión #24). Reemplazado por "ofrecerse": disponible
para quien ya decidió mirar, sin solicitar la mirada de nadie.

**"La habitación es el producto" (formulación literal).** No
rechazada del todo, pero sí descartada como estaba escrita: contradecía
a `vision.md` ("la habitación es contexto, el escritorio es acción").
Refinada a "el lugar es el producto", donde lugar incluye ambos.

---

## 5. Architectural Invariants

Ninguna de las siguientes es negociable. Si una implementación futura
rompe una de estas, el proyecto deja de ser El Estudio — no importa
cuán bien resuelto esté todo lo demás:

1. **El espacio es la interfaz.** Nunca un panel, menú o dashboard
   superpuesto al mundo.
2. **El lugar sigue existiendo sin la persona.** Nunca se resetea, ni
   pausa, ni espera en un estado inicial al volver.
3. **La ley madre de atención.** Nunca más de un punto de énfasis a la
   vez, y nunca sin una razón real.
4. **El desgaste nunca es punitivo.** Nada se marchita, se rompe ni se
   pierde como castigo por inactividad.
5. **La IA nunca enseña, solo recuerda.** Cero consejos, cero coaching,
   cero sugerencias sobre qué hacer con la propia vida.
6. **Ningún objeto inicia contacto hacia la persona.** Solo puede
   ofrecerse o reaccionar a una causa real — nunca notificar, avisar
   ni anticiparse activamente.
7. **Exclusividad de autoría.** Nada cambia por acción o dato de otra
   persona, ni por comparación agregada.
8. **El tiempo es la única fuerza que la persona no controla.** Nunca
   pausable, acelerable ni reseteable por el usuario.
9. **Cero gamificación explícita.** Sin badges, XP, rachas, tablas de
   posiciones ni celebraciones programadas.
10. **La regla del mundo físico.** Todo efecto visual debe poder
    responder "sí" a "¿existe algo parecido en una habitación real?".
11. **La prueba de los veinte años.** Ninguna decisión que solo brille
    las primeras semanas pertenece acá.

*(Un candidato adicional, todavía no elevado a esta lista, se discute
en Autocrítica → Ratification Candidates: la coherencia por raíz
común, decisión #22.)*

---

## 6. Document Dependency Graph

No es un grafo técnico — es cómo nace el conocimiento, de la primera
pregunta a la más reciente:

```
                    WORLD_FOUNDATIONS
                    (por qué existe este mundo)
                            │
                 WORLD_DESIGN_PRINCIPLES
                 (qué puede existir; árbitro)
                            │
                 LIVING_SYSTEMS_BIBLE
                 (qué procesos lo sostienen)
                            │
                 WORLD_BEHAVIOR_LANGUAGE
                 (cómo se expresa lo que corre)
                    │           │
           PRESENCE_ENGINE   ATTENTION_ENGINE
           (qué se siente    (a qué le toca
            vivo)             pesar más)
                    │           │
              SPATIAL_EXPERIENCE_MANIFESTO
              (leyes del espacio como lugar)
                            │
                 libro-01-biblia-del-estudio
                 (canon concreto de objetos)
                            │
                        vision.md
                 (convenciones de ingeniería diaria)
                            │
                    EXPERIENCE_BIBLE
                 (qué se siente habitar todo esto)
                            │
                     MOMENTS_BIBLE
                 (qué instantes se vuelven recuerdo)
```

**Por qué este orden existe y no otro:** cada nivel contesta una
pregunta que el nivel anterior deja necesariamente sin resolver. No se
puede decidir qué se siente habitar un mundo (`EXPERIENCE_BIBLE`) sin
haber decidido antes qué puede existir en él (`WORLD_DESIGN_PRINCIPLES`)
y qué lo hace funcionar sin supervisión (`LIVING_SYSTEMS_BIBLE`). Y no
se puede decidir qué instantes se vuelven recuerdo (`MOMENTS_BIBLE`)
sin haber decidido antes qué se siente en general — un recuerdo es,
literalmente, un instante extraído de una experiencia ya definida.
`ESTUDIO_MASTER_CONTEXT.md`, `AI_DEVELOPMENT_RULES.md` y los
documentos de inventario quedan fuera de este árbol a propósito: el
primero resume el árbol entero, el segundo gobierna un eje distinto
(proceso), y los últimos son evidencia y bocetos, no conocimiento
derivado.

---

## 7. Knowledge Gaps

**1. El lenguaje con más de un destinatario.** Surgido de forma
independiente tres veces (ver Open Question #6). El territorio está
suficientemente maduro — tres documentos distintos convergiendo solos
en la misma pregunta ya no es casualidad — para merecer su propio
sprint, no una cuarta mención de paso.

**2. Estados terminales / irreversibilidad real.** Surgido dos veces
(`MOMENTS_BIBLE.md`, `LIVING_SYSTEMS_BIBLE.md`) y una tercera de forma
tangencial (`WORLD_BEHAVIOR_LANGUAGE.md`, "un verbo para el final
real"). Ningún documento existente siquiera propone una hipótesis.

**3. Un marco formal para el equilibrio de amplitud.** Nombrado dos
veces (`LIVING_SYSTEMS_BIBLE.md` §10 y Ejercicio 6) como intuición de
estilo ("nunca de golpe") sin ningún techo numérico o marco que la
sostenga.

**4. El Estudio como Casa — crecimiento físico multi-habitación.**
**Hallazgo nuevo de esta curación:** el límite de espacio finito
(Open Question #3, nombrado cuatro veces de forma aislada) y "el
lenguaje de más de una habitación" (`WORLD_BEHAVIOR_LANGUAGE.md`
Ejercicio 5) son, en realidad, el mismo problema futuro visto desde
dos ángulos distintos que ningún documento conectó explícitamente
hasta ahora. Fusionarlos en un solo territorio de trabajo futuro
evita que se conviertan, sin querer, en dos sprints separados que
respondan la misma pregunta dos veces.

**5. Trading: lenguaje de urgencia real.** Técnicamente ya es una Open
Question (#2), pero merece mencionarse acá también porque es, de
lejos, la más repetida de todo el corpus (cuatro apariciones
independientes) sin que ninguna avance más allá de nombrarla. Ya no es
una pregunta menor pendiente — es, probablemente, el hueco de
conocimiento más urgente de los cinco.

---

## 8. Design Debt

Decisiones ya ratificadas, no por ser débiles en sí, sino por carecer
todavía de suficiente evidencia:

**Mecanismo sin diseñar todavía (aceptado en principio, no en forma
concreta):**
- El olvido con gracia (decisión #20) — se sabe que hace falta, no
  cómo se vería sin sentirse como un borrado.
- El equilibrio de amplitud (parte de la decisión #22) — sin ningún
  techo numérico definido en ningún lugar del proyecto.

**Hipótesis sin validar por el paso real del tiempo:**
- La corrección de "el primer objeto" (decisión #18) — `MOMENTS_BIBLE.md`
  mismo la marca como hipótesis razonada, no observación.
- La gramática de once verbos (decisión #23) — probada sin excepciones
  contra cinco objetos sobre el papel, cero objetos reales construidos
  todavía que la hablen.

**Regla verdadera solo por ausencia de contraejemplo, no por
aplicación activa:**
- Exclusividad de autoría (decisión #21) — cierta hoy porque no existe
  ninguna función social, no porque exista un mecanismo que la haga
  cumplir si alguna vez se propusiera una.

---

## 9. Consistency Audit

**Qué documentos quedaron perfectamente alineados:** el cuarteto
`LIVING_SYSTEMS_BIBLE.md` → `WORLD_BEHAVIOR_LANGUAGE.md` →
`PRESENCE_ENGINE.md` → `ATTENTION_ENGINE.md` es, con diferencia, el
cluster más coherente del corpus: cada uno cita al anterior con
precisión, ninguno repite contenido del otro, y `WORLD_BEHAVIOR_LANGUAGE.md`
resolvió activamente la única ambigüedad real que quedaba entre los
otros tres (ver más abajo).

**Qué se contradice — la única encontrada en esta auditoría:** el
Nivel 2 de `WORLD_DESIGN_PRINCIPLES.md` §0 declaraba a los documentos
de dominio "todos al mismo nivel", sin orden interno. Los sprints
posteriores (`LIVING_SYSTEMS_BIBLE.md`, `WORLD_BEHAVIOR_LANGUAGE.md`)
introdujeron, sin anunciarlo como tal, un orden de dependencia real
entre esos mismos documentos. Es un **Caso F — cambio histórico
todavía no propagado**: la jerarquía de `§0` nunca se actualizó para
reflejar que ya existía un orden interno. Resuelto en `§1` de este
documento.

**Qué conceptos fueron refinados correctamente durante los sprints:**
la lista completa vive en Ejercicio 5, para no duplicarla acá.

**Qué conceptos todavía arrastran versiones antiguas, sin propagar
— tres instancias del mismo Caso F:**
- `ESTUDIO_MASTER_CONTEXT.md` sigue autodeclarándose, en su propio
  encabezado, "la única fuente de verdad" — cuatro sprints después de
  que `WORLD_DESIGN_PRINCIPLES.md` propusiera lo contrario.
- `SPATIAL_EXPERIENCE_MANIFESTO.md` y `libro-01-biblia-del-estudio.md`
  conservan, cada uno, su propia cláusula de "si algo lo contradice,
  el documento gana" — ambas quedan formalmente superadas por la
  jerarquía unificada de `§1`, pero el texto original de ninguno de
  los dos lo refleja todavía.

Ninguna de estas tres es una contradicción de contenido — son
encabezados que quedaron desactualizados por decisiones tomadas en
documentos posteriores. No se corrigen acá porque este documento no
reescribe otros (ver Ejercicio 7, Impact Analysis, para el mapa
completo de qué actualización le correspondería a cada uno).

**Un hallazgo adicional, ya resuelto en su propio documento, que vale
la pena registrar como prueba de que el proceso de autocrítica
funciona:** `WORLD_BEHAVIOR_LANGUAGE.md` Ejercicio 4 encontró y
corrigió, dentro de su propio sprint, que `LIVING_SYSTEMS_BIBLE.md` §9
y `ATTENTION_ENGINE.md` describían dos fenómenos de escala distinta
(segundos contra años) con el mismo vocabulario informal — separado
ahí mismo en los verbos "ceder" y "retirarse". No requiere ninguna
acción adicional acá; se cita como evidencia de que la disciplina de
citar-en-vez-de-repetir ya está funcionando.

---

## 10. Ready for Implementation

Evaluación honesta, deliberadamente conservadora:

**Sí está listo para especificación:** el canon de objetos y reglas
generales (`WORLD_DESIGN_PRINCIPLES.md`, `WORLD_BEHAVIOR_LANGUAGE.md`,
`libro-01`, `vision.md`). Ocho documentos conceptuales, mutuamente
consistentes, cada uno ya sometido a su propia prueba de veinte años o
de "quitar todo y ver si sobrevive". Cualquier objeto nuevo del tipo ya
cubierto por `future-furniture.md` puede especificarse hoy contra este
cuerpo sin bloqueos reales.

**No está listo todavía, y no debería forzarse:**
- Cualquier especificación de la estación Trading, mientras la Open
  Question #2 siga sin resolución de dirección de arte — especificarla
  hoy obligaría a improvisar una respuesta que este corpus
  deliberadamente se negó a inventar apurada.
- Cualquier sistema de envejecimiento o memoria visible que dependa
  del olvido con gracia o del equilibrio de amplitud (Design Debt,
  `§8`) — especificarlos hoy significaría inventar el mecanismo
  concreto en el momento de escribir código, exactamente el orden
  inverso que este proyecto ya decidió evitar.
- Cualquier función que toque más de una persona en el mismo mundo,
  mientras la Open Question #6 siga sin decisión de alcance.

**La condición previa que ninguna de las anteriores resuelve por sí
sola:** mientras la jerarquía documental (Open Question #1) no tenga
una ratificación explícita del usuario, cualquier conflicto que surja
durante la especificación entre dos documentos de Nivel 2 no tiene,
formalmente, un árbitro confirmado — solo uno propuesto en `§1`. No es
necesario resolver esto antes de especificar el canon ya maduro, pero
sí antes de que la primera especificación real encuentre su primer
conflicto genuino entre dos documentos.

---

## Ejercicio 1 — Las 25 decisiones más importantes, por impacto

Se reordena la tabla de `§2` por impacto en la identidad del proyecto,
no por antigüedad — no se repite su contenido, solo su orden:

1. El Axioma (#1) — todo lo demás se deriva de esto.
2. Ley madre de atención (#9) — el mecanismo real detrás de la calma.
3. Regla del mundo físico (#5) — el filtro objetivo de cualquier
   decisión visual.
4. Cero gamificación explícita (#6) — la frontera contra convertirse
   en cualquier otra app.
5. La IA nunca enseña, solo recuerda (#4) — distingue el proyecto de
   un asistente.
6. El espacio es la interfaz (#2) y la cámara invisible (#3) — juntas,
   la condición de habitabilidad.
7. La prueba de los veinte años (#11) — el criterio que filtra todo lo
   demás.
8. Sistemas recalculables contra acumulativos (#19) — sin esto, "el
   lugar sigue existiendo sin vos" es una promesa sin mecanismo.
9. Exclusividad de autoría (#21) — lo que mantiene el lugar personal en
   vez de social.
10. Coherencia por raíz común (#22) — previene, a nivel de sistemas, el
    problema que ya ocurrió a nivel de documentos.
11. El olvido con gracia (#20) — decide si el proyecto sobrevive a su
    propia promesa de veinte años sin colapsar el espacio.
12. Objetos como habitantes: por qué / historia / envejecimiento /
    sensación (#7).
13. Instrumento contra Ritual (#12) — evita forzar ceremonia donde no
    corresponde.
14. Ningún objeto inicia contacto hacia la persona (#24).
15. Nueve capas de presencia (#8).
16. Un mueble nuevo nace ya presente, nunca anunciado (#14).
17. Curva emocional continua (#15).
18. Distinción Momento/Recuerdo/Evento/Recompensa/Sorpresa (#17).
19. Gramática de once verbos (#23).
20. Motivación y logro excluidos (#16).
21. Objetivo de volverse innecesario (#10).
22. Prueba de las dos preguntas para interactividad (#13).
23. Corrección de "el primer objeto" (#18).
24. Jerarquía documental unificada (#25) — alto impacto potencial,
    bajo hasta ratificarse.

*(24, no 25 — la tabla de `§2` tiene 25 filas, pero dos de ellas,
Instrumento/Ritual y sus consecuencias directas, se cuentan una sola
vez en este ranking por impacto compartido; se prefiere esta
honestidad a rellenar un número redondo.)*

## Ejercicio 2 — Las cinco que sostienen casi toda la identidad

1. **El Axioma.** Sin él, no hay razón para que ninguna otra regla
   exista en la forma en que existe.
2. **La ley madre de atención.** Es el único mecanismo concreto,
   verificable objeto por objeto, que produce la calma que todo el
   resto del proyecto solo describe en palabras.
3. **La regla del mundo físico + cero gamificación**, tomadas como una
   sola decisión conjunta: es lo que hace que el proyecto no pueda,
   ni por accidente, convertirse en otra aplicación con buen diseño.
4. **El lugar sigue existiendo sin la persona**, sostenido por
   sistemas recalculables/acumulativos: es lo que separa un lugar de
   una sesión guardada.
5. **Exclusividad de autoría.** Es la decisión cuya ruptura sería más
   difícil de revertir después del hecho — el día que un dato ajeno
   se filtre, el proyecto deja de ser personal de una forma que no se
   deshace fácilmente.

## Ejercicio 3 — Cinco decisiones pequeñas que destruirían la identidad

1. Que el desgaste se reinicie "por comodidad" al cambiar de
   dispositivo (ya nombrado como riesgo exacto en
   `LIVING_SYSTEMS_BIBLE.md`).
2. Que "ofrecerse" se relaje hacia "invitar" para un objeto que
   "realmente lo necesita" (ya nombrado en `WORLD_BEHAVIOR_LANGUAGE.md`
   Language Risks).
3. Que se agregue un resumen de "esta semana hiciste..." (ya nombrado
   en `EXPERIENCE_BIBLE.md` Ejercicio 3).
4. Que un sistema nuevo cree su propio reloj independiente en vez de
   derivar del único existente (`LIVING_SYSTEMS_BIBLE.md` §18).
5. Que la ley madre de atención se relaje "solo por esta vez" para una
   función que parece merecerlo — el patrón de erosión nombrado, con
   distintas palabras, en tres documentos distintos.

## Ejercicio 4 — Qué intentaría cambiar un diseñador nuevo, y por qué sería un error

1. **La ausencia total de resúmenes o atajos.** Parecería mala UX sin
   contexto; es, en realidad, la frontera contra el dashboard
   (Manifiesto XI) — la decisión más consciente y más discutida de
   todo el proyecto.
2. **Que Trading no tenga colores intensos.** Parecería malo para una
   herramienta financiera real; la tensión ya está identificada y
   documentada, no ignorada — la solución correcta pasa por lenguaje
   material, no por romper la ley madre sin más (Open Question #2).
3. **Que un mueble nuevo no tenga tour ni anuncio.** Parecería malo
   para onboarding; rompe la regla de descubrimiento silencioso, de
   las más repetidas en todo el corpus (decisión #14).
4. **Que la cámara use `navigate()` de react-router por debajo.** Un
   ingeniero podría querer "corregir" esto para que coincida con
   "explorar, no navegar"; `WORLD_DESIGN_PRINCIPLES.md` ya resolvió
   explícitamente que es un detalle de implementación invisible, no
   una contradicción real.
5. **Que la habitación tenga un límite de objetos.** Un diseñador
   nuevo podría querer resolverlo con scroll o pestañas (patrones de
   app); ya está identificado como la contradicción sin resolver más
   peligrosa del proyecto (Open Question #3), y la solución correcta
   sigue abierta a propósito, no descartada por descuido.

## Ejercicio 5 — Auditoría histórica: cómo evolucionaron las ideas

- "Ningún objeto pide atención" → refinado a una versión con
  excepción real, para no contradecir la ley madre ya vigente.
- "La habitación es el producto" → "el lugar es el producto", para no
  chocar con la distinción habitación/escritorio de `vision.md`.
- "El usuario explora, nunca navega" → separado en fenomenología
  (cierta) contra mecanismo (`navigate()` de react-router, también
  cierto) — mejorado por la crítica, no abandonado.
- "Los objetos representan rituales, no funciones" → rechazado,
  reemplazado por Instrumento/Ritual.
- "El primer objeto" → corregido de evento a momento
  siempre-descubrible.
- El supuesto implícito "nada se pierde = todo permanece igual de
  visible" → revisado por el olvido con gracia.
- El verbo "invitar" → rechazado, reemplazado por "ofrecerse".
- "Ceder", usado de forma ambigua en dos escalas de tiempo distintas →
  separado en "ceder" (instantáneo) y "retirarse" (largo plazo).
- La autodeclaración de `ESTUDIO_MASTER_CONTEXT.md` como "única fuente
  de verdad" → propuesta de degradación a resumen de onboarding, ahora
  consolidada en `§1` de este documento.

## Ejercicio 6 — Future Opportunities

**El lenguaje con más de un destinatario.** Ver Knowledge Gap #1 —
tres apariciones independientes ya justifican su propio sprint.

**Estados terminales / irreversibilidad real.** Ver Knowledge Gap #2 —
territorio nombrado, cero desarrollo todavía.

**Un marco formal para el equilibrio de amplitud.** Ver Knowledge Gap
#3 — necesario antes de que cualquier sistema de urgencia (incluido
Trading) pueda especificarse con un techo real en vez de una intuición
de estilo.

**El Estudio como Casa.** Ver Knowledge Gap #4 — la síntesis nueva de
esta curación: dos hilos que ya existían por separado (límite de
espacio, gramática de múltiples habitaciones) son, en realidad, un
solo territorio futuro.

**Nota de exclusión, no de gap:** el comportamiento de síntesis y
reducción de carga cognitiva que `AI_DEVELOPMENT_RULES.md` §14 exige
de cualquier IA que trabaje sobre este repositorio no es un hueco de
conocimiento del mundo — gobierna el proceso de trabajo humano-IA, un
eje completamente distinto del habitante-IA que describe
`SPATIAL_EXPERIENCE_MANIFESTO.md` VI. Mezclar los dos sería el mismo
error de categoría que ya se señaló en la Reflexión Obligatoria.

## Ejercicio 7 — Impact Analysis

| Decisión de esta revisión | Documentos afectados | Actualización requerida | ¿Cambia interpretación? |
|---|---|---|---|
| Jerarquía documental ratificada en `§1` | Los 18 | Ninguna inmediata; futura (no urgente): actualizar los encabezados de `ESTUDIO_MASTER_CONTEXT.md`, `SPATIAL_EXPERIENCE_MANIFESTO.md` y `libro-01` para que dejen de autodeclararse supremos | Sí — de `ESTUDIO_MASTER_CONTEXT.md`, que pasa de "única fuente de verdad" a resumen de onboarding |
| Distinción entre cadena de dependencia y jerarquía de autoridad (`§1`) | `LIVING_SYSTEMS_BIBLE.md`, `WORLD_BEHAVIOR_LANGUAGE.md` | Ninguna — es una aclaración de lectura, no de contenido | Sí — su "cadena de documentos" pasa a leerse explícitamente como dependencia, no como rango |
| `world-map.md` y `furniture-map.md` reclasificados como dominios distintos, no duplicados | Ambos | Ninguna | No — solo previene una fusión futura por error |
| `ESTUDIO_MASTER_CONTEXT.md` §4-5 reclasificadas como estado de implementación, no conocimiento conceptual | `ESTUDIO_MASTER_CONTEXT.md` | Futura, no inmediata: esas secciones podrían vivir mejor junto a `experience-log.md` o un changelog técnico | Sí — reduce el peso filosófico de esas dos secciones específicas |
| Ningún otro documento de diseño fue modificado en contenido | Todos los de Nivel 2 | Ninguna | No — esta revisión cataloga, no reescribe |

---

## Autocrítica

### Open Questions

Se ratifican como abiertas las siete preguntas de `§3`, en ese orden
de aparición obligatorio para las dos primeras. Ninguna pregunta
adicional sobrevivió el filtro de "es una pregunta real, no un deseo"
— varias ideas que podrían haberse colado acá (por ejemplo, "¿debería
haber sonido ambiental ya?") ya tienen respuesta de diseño completa en
`PRESENCE_ENGINE.md`; lo único abierto ahí es la implementación, que
no le compete a este documento.

### Ratification Candidates

**Coherencia por raíz común (decisión #22).** Ya se aplica de forma
consistente desde que se propuso — el propio
`WORLD_BEHAVIOR_LANGUAGE.md` la respeta sin que nadie se lo exigiera
explícitamente. Es candidata a elevarse de "sistema" a Architectural
Invariant en la próxima revisión, una vez que un segundo sistema
además de la luz demuestre haberla seguido en la práctica.

**Instrumento contra Ritual (decisión #12).** Usada de forma
consistente en cada descripción de objeto desde que se propuso
(`future-furniture.md` ya describe el Archivador como instrumento
frío sin que nadie tuviera que recordárselo). Candidata sólida a
convertirse en ley de Nivel 1 en vez de vivir solo en
`WORLD_DESIGN_PRINCIPLES.md` §6.

### Knowledge Risks

1. Que la jerarquía documental permanezca sin ratificar
   indefinidamente, y cada sprint nuevo resuelva de forma informal y
   distinta a quién le toca ganar un conflicto — la misma falla que ya
   produjo cuatro constituciones, ahora en forma latente.
2. Que los encabezados de `SPATIAL_EXPERIENCE_MANIFESTO.md` y
   `libro-01` nunca se actualicen, y un lector futuro que abra solo uno
   de los dos nunca descubra que existe una jerarquía más nueva.
3. Que la mezcla entre conocimiento conceptual y estado de
   implementación, hoy contenida en `ESTUDIO_MASTER_CONTEXT.md` §4-5,
   se generalice a futuros documentos de visión.
4. Que el volumen ya acumulado de documentación (dieciocho documentos)
   supere la capacidad real de un futuro equipo de leerlos todos antes
   de decidir, y se empiece a diseñar citando solo el más reciente.
5. Que la disciplina de citar-en-vez-de-repetir, sostenida sin fallas
   durante los últimos cuatro sprints, se abandone bajo presión de
   tiempo — produciendo, sin que nadie lo decida a propósito, una
   novena biblia que repite en vez de construir encima. Es,
   textualmente, el riesgo que este documento existe para vigilar.

---

## Prueba final

Si toda la documentación conceptual desapareciera excepto este
documento, ¿un nuevo equipo sabría exactamente qué puede cambiar, qué
no, qué sigue abierto y dónde buscar cada respuesta?

Sí, con un límite honesto. Este documento preserva el mapa completo:
once invariantes que nunca deben romperse, veinticinco decisiones con
propietario y nivel de estabilidad, siete preguntas reales con lo que
falta para cerrarlas, cinco huecos de conocimiento con su
justificación, y una jerarquía que dice exactamente en qué documento
buscar cada tipo de respuesta. Un equipo nuevo, leyendo solo esto,
sabría qué no tocar, qué todavía se puede discutir, y dónde estaba
escrita — aunque ya no exista — la razón original de cada regla.

Lo que este documento **no** preserva es la textura: la voz narrada de
`LIVING_THE_STUDIO.md`, el razonamiento completo detrás de cada
verbo de `WORLD_BEHAVIOR_LANGUAGE.md`, la curva emocional completa de
`EXPERIENCE_BIBLE.md`. Este documento es el mapa del territorio, nunca
el territorio. Un equipo que solo tuviera esto sabría exactamente qué
reconstruir y por qué — pero tendría que reconstruirlo, no
recuperarlo. Esa pérdida es aceptable, porque nunca fue el trabajo de
este documento evitarla: fue, desde el principio, decidir qué ya está
congelado y qué todavía no. Dentro de ese límite, que es el único que
se propuso resolver, la respuesta es sí.
