# Design Validation Framework 1.0

### STATUS: Pre-Implementation Validation Framework

Este documento no crea filosofía, no crea experiencia, no crea
sistemas, no crea comportamiento, no crea especificaciones. Depende
por completo del conocimiento ya ratificado en `RATIFIED_DECISIONS.md`
y en los ocho documentos de dominio que ese registro cataloga — no los
modifica, los usa. Su única responsabilidad: definir cómo se
verificará que cualquier implementación futura siga siendo,
realmente, El Estudio.

---

## Antes de escribir: qué ya existe, y sobre qué se construye esto

Regla Permanente 1 obliga a revisar antes de escribir. Ya existen,
sin que este documento necesite repetirlos:

- La taxonomía oficial de contradicciones A–F (`RATIFIED_DECISIONS.md`
  §9) — se usa acá tal cual, sin variante.
- Los once Architectural Invariants (`RATIFIED_DECISIONS.md` §5) — se
  citan por número, nunca se reformulan.
- Las veinticinco decisiones ratificadas con su tabla completa
  (`RATIFIED_DECISIONS.md` §2).
- Las pruebas informales de "quitar todo y ver si sobrevive", ya
  usadas de forma repetida e independiente en `EXPERIENCE_BIBLE.md`,
  `MOMENTS_BIBLE.md`, `LIVING_SYSTEMS_BIBLE.md` y
  `SPATIAL_EXPERIENCE_MANIFESTO.md` XIII — este documento no las
  reinventa, las formaliza como procedimiento único en el Ejercicio 1.
- La gramática de once verbos y sus cinco reglas de sintaxis
  (`WORLD_BEHAVIOR_LANGUAGE.md`) — usada acá como criterio de
  verificación de comportamiento, no repetida.
- La prueba de las dos preguntas para admitir interactividad
  (`WORLD_DESIGN_PRINCIPLES.md` §4, decisión #13) — citada, no
  reformulada.

**Duplicación detectada y resuelta en este mismo párrafo:** cuatro
documentos distintos ya contienen, cada uno por separado, una versión
de "quitar todo y ver si el proyecto sobrevive". Ninguno se cita a los
otros tres. No es una contradicción de contenido (las cuatro versiones
coinciden), pero sí duplicación documental real: la misma prueba
inventada cuatro veces de forma independiente. Este documento no
corrige los cuatro originales — no le corresponde reescribirlos — pero
la resuelve hacia adelante formalizándola una sola vez acá (Ejercicio
1) como el procedimiento canónico al que los cuatro documentos
anteriores, de hecho, ya apuntaban sin saberlo.

---

## Reflexión obligatoria: seis palabras que el proyecto usó como sinónimos

`RATIFIED_DECISIONS.md` habla de "auditoría", `WORLD_DESIGN_PRINCIPLES.md`
habla de "evaluación de principios", `EXPERIENCE_BIBLE.md` y
`MOMENTS_BIBLE.md` hablan de "prueba final" — los tres términos, y
otros tres más que aparecen sueltos por el corpus, nunca se
distinguieron entre sí. Se corrige acá, porque un framework de
validación que no distingue estas seis palabras no puede pedirle a
nadie que las use con criterio:

- **Verificar** — confirmar mecánicamente si algo cumple o no una
  condición binaria ya definida de antemano. Puntual, rápido,
  repetible por cualquiera. *¿Este objeto tiene los campos `reason` y
  `story`? Sí o no.*
- **Validar** — confirmar que algo cumple el propósito para el que
  existía, más allá de la letra de cada requisito puntual. Más amplio
  que verificar: algo puede pasar cada verificación puntual y aun así
  no validar. *¿Esta implementación sigue siendo un lugar que se
  acompaña, no una tarea que se completa?*
- **Medir** — asignar un valor cuantitativo. Presupone una métrica
  numérica. La mayoría de las propiedades que le importan a este
  proyecto (calma, apego, presencia) **no deberían medirse nunca** —
  ver `§2` de la Estructura.
- **Evaluar** — emitir un juicio comparativo de valor, sopesando varias
  validaciones a la vez para decidir si algo, en conjunto, merece
  aprobarse. Es lo que hace un Design Review Director al final,
  después de que ya existen verificaciones y validaciones puntuales.
- **Auditar** — revisar retroactivamente un cuerpo ya existente,
  buscando desviaciones que nadie detectó en su momento. Mira hacia
  atrás y mira a muchas cosas a la vez, no a una implementación
  puntual. Es lo que hace `RATIFIED_DECISIONS.md` §9 sobre el corpus
  documental; acá se propone el mismo verbo aplicado al código y a la
  experiencia real (Estructura §9).
- **Revisar** — el acto social y dialógico de leer el trabajo de otra
  persona antes de aceptarlo. Envuelve a todas las anteriores, pero no
  es ninguna de ellas por sí sola: una revisión de PR conceptual usa
  verificación, validación y a veces auditoría, en ese orden
  (Estructura §11).

**Dónde el corpus las mezcló antes, sin que sea una contradicción
real:** `WORLD_DESIGN_PRINCIPLES.md` llama "evaluación" a lo que, con
esta distinción, en realidad fue una **revisión** — aceptar, refinar o
rechazar once principios uno por uno, con diálogo, no un juicio
comparativo cuantitativo. No se trata de un error a corregir en aquel
documento; es lenguaje anterior a esta formalización, exactamente el
mismo tipo de hallazgo que `WORLD_BEHAVIOR_LANGUAGE.md` ya verificó y
descartó como no-contradicción para "comportamiento" y "expresión" en
`EXPERIENCE_BIBLE.md` §17. Se deja registrado acá, no se reescribe
`WORLD_DESIGN_PRINCIPLES.md`.

---

## Estructura

### 1. ¿Qué significa validar identidad?

Confirmar que una implementación preserva los once Architectural
Invariants y no contradice ninguna decisión ratificada, **incluso si
cumple cada requisito funcional puntual.** Validar identidad es
siempre una operación holística: nunca se valida un botón, se valida
si el mundo, con ese botón adentro, sigue respondiendo al Axioma.

### 2. ¿Qué nunca debería validarse con métricas?

Todo lo que `EXPERIENCE_BIBLE.md` §16 clasifica como emoción cultivada
(calma, presencia, curiosidad, pertenencia, concentración, claridad,
refugio) y, en particular, todo lo que excluye explícitamente
(motivación, logro). Medir "tiempo en la app", "retención" o
"frecuencia de apertura" como criterio de éxito es indistinguible, en
la práctica, de diseñar para producir esas mismas métricas — el camino
más corto de vuelta a la gamificación que el invariante #9 prohíbe.

**Aclaración necesaria, para que esto no se lea como prohibición de
toda evidencia:** esta regla prohíbe mostrarle métricas a la persona
o usarlas como criterio de diseño — no prohíbe que el equipo, puertas
adentro, registre observación cualitativa. `experience-log.md` ya es,
precisamente, evidencia sin métrica: no cuenta sesiones, describe qué
se sintió. Esa es la única clase de instrumento interno compatible con
este invariante.

### 3. ¿Qué sí puede validarse objetivamente?

Hechos estructurales binarios: si un objeto nuevo tiene los campos
`reason`/`story` (decisión #7); si un sistema nuevo deriva del reloj
único en vez de crear el suyo propio (decisión #22); si, en un instante
dado, más de un punto compite por atención (invariante #3 — es, de
hecho, el único invariante con un número literal adjunto: como máximo
uno); si un comportamiento nuevo puede nombrarse con alguno de los once
verbos existentes o rompe alguna de las cinco reglas de sintaxis de
`WORLD_BEHAVIOR_LANGUAGE.md`; si un efecto visual nuevo responde "sí" a
"¿existe algo así en una habitación real?" (invariante #10 — la
aplicación del criterio pide juicio humano, pero el criterio en sí es
objetivo y binario).

### 4. Pruebas mínimas para cualquier nueva interacción

1. Pasa la prueba de las dos preguntas para admitir interactividad
   (decisión #13) — si no, no debería ser interactiva.
2. No inicia nada hacia la persona (invariante #6) — solo puede
   ofrecerse o reaccionar a una causa real.
3. Respeta la ley madre (invariante #3) en cualquier estado del mundo,
   no solo en el estado de demostración.
4. Es nombrable con la gramática existente, o su falta de nombre queda
   registrada como señal (ver Estructura §8).

### 5. Pruebas mínimas para cualquier objeto nuevo

Las cuatro preguntas de admisión ya ratificadas (decisión #7): por qué
existe, qué historia cuenta, cómo envejece, qué se siente al
encontrarlo. Además: clasificación explícita como Instrumento o Ritual
(decisión #12); nace ya presente, nunca anunciado (decisión #14);
pasa la regla del mundo físico (invariante #10).

### 6. Pruebas mínimas para cualquier estación nueva

Todo lo del punto anterior, objeto por objeto, más: se ubica en
`world-map.md` sin forzar una adyacencia que no exista todavía (y si
la fuerza, esa expansión del mapa se declara explícitamente, no se
asume); se ubica en `furniture-map.md` con un flujo funcional propio,
sin duplicar la función de otro mueble ("cada mueble tiene una única
función"); si su dominio tiene una tensión de diseño ya identificada
como abierta (Trading, Open Question #2 de `RATIFIED_DECISIONS.md`),
no puede considerarse validable hasta que esa tensión se resuelva —
construirla antes sería inventar una respuesta de dirección de arte
en el momento de implementar, exactamente lo que el proyecto ya
decidió no hacer.

### 7. Pruebas mínimas para cualquier cambio visual

Regla del mundo físico (invariante #10); el color solo como
"publicidad, no presencia" — cualquier uso de color con la intención
de llamar la atención necesita justificar por qué no es, de hecho,
una violación disfrazada de la ley madre; recuento explícito de
puntos de énfasis simultáneos antes y después del cambio.

### 8. Pruebas mínimas para cualquier cambio de comportamiento

Debe poder describirse con uno de los once verbos existentes, sin
forzar una metáfora. Si no puede nombrarse: esto no es un fallo
automático, es una señal de dos posibles lecturas — o el
comportamiento no pertenece a El Estudio, o el vocabulario de
`WORLD_BEHAVIOR_LANGUAGE.md` está incompleto. Este documento no decide
cuál de las dos es cierta — eso requeriría reabrir aquel documento, no
este — pero registrar la señal (Ejercicio 1, último punto de la
checklist) es obligatorio.

### 9. Cómo detectar degradación silenciosa del proyecto

Cruzar, de forma periódica, las entradas reales de `experience-log.md`
contra el catálogo de peores-escenarios ya construido
(`EXPERIENCE_BIBLE.md` Ejercicio 3, que marca la gamificación
progresiva de Hábitos como el riesgo más probable de todos). Si el
vocabulario de una entrada real empieza a usar palabras como "racha",
"completé", "puntaje", "logré" — no como cita irónica sino como
descripción sincera de la experiencia — eso es degradación silenciosa
ocurriendo, no una hipótesis.

### 10. Cómo detectar acumulación de pequeñas excepciones

Regla Permanente 5 exige que cada excepción justifique por qué no
destruye la identidad global — pero una justificación individual
válida no dice nada sobre el efecto acumulado de diez excepciones
válidas por separado. Se propone acá un artefacto de proceso nuevo,
no una idea filosófica: un **Registro de Excepciones**, una lista
simple y cronológica de cada excepción aprobada junto a su
justificación puntual. Su valor no está en ninguna entrada individual
— está en poder leerlas todas juntas, una vez al año, y preguntar si
el patrón acumulado sigue pareciendo El Estudio o ya es, sin que nadie
lo decidiera de una vez, otra cosa.

### 11. Cómo revisar una Pull Request conceptual

Orden fijo, no intercambiable: (1) ¿cita lo que ya existe o lo
reformula? — si reformula, se rechaza antes de seguir leyendo; (2)
¿declara cómo se verificaría cada afirmación importante? (Regla 2);
(3) ¿es falsificable? (Regla 3); (4) ¿se contrasta explícitamente
contra los once invariantes?; (5) ¿tiene un documento propietario
asignado, o queda flotando sin dueño? (regla de ownership de
`RATIFIED_DECISIONS.md` §1).

### 12. Cómo aprobar un documento nuevo

Pasa las cinco preguntas del punto anterior, más: ¿generaliza a
cualquier objeto presente o futuro, o solo describe uno específico?
(regla de `WORLD_BEHAVIOR_LANGUAGE.md`, "piensa en lenguaje, nunca en
objetos"); ¿su llegada obliga a actualizar la jerarquía documental de
`RATIFIED_DECISIONS.md` §1, y si es así, se declaró explícitamente ese
impacto?

### 13. Cómo rechazar una implementación aunque funcione técnicamente

Funcionar no es lo mismo que validar. Se rechaza si viola cualquier
invariante aunque el código no tenga errores; si la única forma de
justificarla fue inventar una razón después de construirla, en vez de
antes (una justificación posterior es, en sí misma, la señal de alerta
más confiable de todo este framework — una implementación que de
verdad pertenece a El Estudio no necesita que se le busque la
justificación al final); o si pasa la Checklist Universal (Ejercicio
1) pero falla la Prueba Final de esa sección específica (Estructura
§4-8).

### 14. Cuándo romper una regla existente está realmente justificado

Nunca por conveniencia de implementación. Solo cuando aparece,
efectivamente, la evidencia de falsificación específica que esa misma
regla debería tener declarada de antemano (Ejercicio 5) — no una
evidencia genérica de "esto sería más fácil sin la regla", sino la
evidencia concreta y particular que esa regla necesitaría para
demostrarse equivocada.

### 15. Cómo evoluciona el framework con el tiempo

Este documento y `RATIFIED_DECISIONS.md` están acoplados: una revisión
de uno debería disparar una revisión del otro. Sus dos únicas fuentes
legítimas de revisión empírica son el Registro de Excepciones (§10) y
`experience-log.md` — nunca la opinión aislada de un solo revisor, por
más senior que sea, sin evidencia de ninguno de los dos.

---

## Ejercicio 1 — Checklist Universal de Validación

Formaliza, en un solo procedimiento, las cuatro pruebas de "quitar
todo" que el corpus ya repitió por separado (ver "Antes de escribir").
Aplicable a cualquier feature futura, en este orden:

1. **Cita, no reformula.** ¿Qué documento ya cubre esto? Si ninguno,
   ¿por qué no?
2. **Prueba de origen físico.** ¿Existe un equivalente en una
   habitación real? (invariante #10)
3. **Prueba de iniciativa.** ¿El objeto/sistema inicia algo hacia la
   persona, o solo se ofrece/reacciona? (invariante #6)
4. **Prueba de la ley madre.** ¿Cuántos puntos de énfasis compiten en
   simultáneo, en el peor caso? Debe ser como máximo uno. (invariante #3)
5. **Prueba de gramática.** ¿Puede describirse con alguno de los once
   verbos? Si no, se registra como señal abierta, no se aprueba ni se
   rechaza sin más.
6. **Prueba de no-gamificación.** ¿Produce algo parecido a puntaje,
   racha, comparación o progreso medible? (invariante #9)
7. **Prueba de sistema único.** Si crea un proceso temporal nuevo,
   ¿deriva del reloj único o inventa el suyo? (decisión #22)
8. **Prueba de remoción total.** Si se quitan todos los efectos
   visuales, sonoros y de animación, ¿sigue teniendo sentido la pieza
   central de la propuesta? Si la respuesta depende del efecto y no
   del contenido, falla acá.
9. **Prueba de justificación previa.** ¿La razón de ser de esto se
   escribió antes de construirlo, o se está redactando ahora para
   justificarlo? Si es lo segundo, alerta máxima (Estructura §13).

Pasar las nueve no garantiza aprobación — es condición necesaria, no
suficiente; la evaluación final (Ejercicio 3) todavía requiere juicio
humano comparativo.

## Ejercicio 2 — Revisión de Diseño previa al desarrollo

Antes de escribir una sola línea de código: (1) el documento de
propuesta cita explícitamente contra qué invariantes y decisiones se
contrasta a sí mismo; (2) declara su propia falsificación (¿qué
evidencia probaría que esta propuesta está mal?) antes de construirse,
no después; (3) pasa la Checklist Universal en su forma teórica,
sección por sección de la Estructura (§4 a §8, según corresponda); (4)
si toca una estación con una tensión de diseño abierta (Trading), la
revisión se detiene ahí — no se aprueba una implementación que resuelve
por accidente una pregunta que el proyecto dejó abierta a propósito;
(5) se asigna un documento propietario, incluso si es un documento que
todavía no existe (queda declarado como deuda, no como ambigüedad).

## Ejercicio 3 — Revisión posterior a la implementación

Después de construida: (1) se corre la Checklist Universal contra el
resultado real, no contra la intención — a menudo difieren; (2) se
audita el recuento real de puntos de énfasis en al menos tres estados
distintos del mundo (recién llegado, uso normal, abandono prolongado);
(3) se compara el resultado contra cualquier justificación escrita en
la Revisión Previa — si la justificación cambió entre el "antes" y el
"después" sin que nadie lo declarara, eso ya es una alerta,
independiente del resultado técnico; (4) se agrega una entrada al
Registro de Excepciones si corresponde; (5) se marca explícitamente el
nivel de estabilidad de la nueva decisión, siguiendo la misma escala
de `RATIFIED_DECISIONS.md` §2 (nunca "Alta" en la primera revisión —
eso requiere sobrevivir, como mínimo, a un sprint sin contradicción,
según la Segunda Reflexión de aquel documento).

## Ejercicio 4 — Cinco implementaciones hipotéticas

**1. FALLA — "Racha de Hábitos".** Un contador visible de días
consecutivos en la estación Hábitos. Falla la Checklist ítem 6 sin
ambigüedad: es, literalmente, la definición de gamificación que el
invariante #9 prohíbe, y es el escenario que `EXPERIENCE_BIBLE.md`
Ejercicio 3 ya identificó como el riesgo más probable del proyecto.

**2. APRUEBA — Papel amarillento en notas no revisadas.** El borde de
una nota envejece visualmente cuanto más tiempo pasa sin atención, sin
umbral ni penalización — solo un material que responde al tiempo, como
el papel real. Pasa origen físico, pasa iniciativa (no reclama nada,
solo cambia), pasa ley madre (un solo estado de énfasis posible a la
vez), pasa no-gamificación (no hay recompensa por revisar rápido, solo
una textura distinta).

**3. FALLA — Borde rojo pulsante en Trading al alcanzar un precio
objetivo.** Falla la prueba de la ley madre (compite con cualquier
otro punto de énfasis ya activo) y la regla de color-como-publicidad
de `ATTENTION_ENGINE.md`. Además, construye una respuesta a la Open
Question #2 (Trading) sin haberla resuelto formalmente — exactamente
el caso que la sección 6 de la Estructura prohíbe.

**4. APRUEBA — "Mapa Mental" como objeto nuevo**, tal como está
descripto en `future-furniture.md` (papel cuadriculado, sin ningún
mecanismo interactivo más allá de mirar). Pasa las cuatro preguntas de
admisión, se clasifica limpiamente como Instrumento, nace ya con
contenido existente en vez de vacío y anunciado, pasa origen físico
sin esfuerzo.

**5. FALLA — Resumen semanal automático en el Escritorio**
("Esta semana: 3 hábitos completados, 2 notas nuevas"). Falla la
prueba de origen físico (ningún escritorio real resume su propia
semana en voz alta), falla iniciativa (aparece sin que nadie lo pida),
y es exactamente el patrón de dashboard que el invariante #1 prohíbe
sin excepción.

## Ejercicio 5 — Falsification

Se construye directamente sobre el ranking por impacto ya establecido
en `RATIFIED_DECISIONS.md` Ejercicio 1 — no se vuelve a elegir ni
justificar el orden, solo se agrega la columna que antes no existía:
qué evidencia probaría que cada una estaba mal.

| Decisión | Evidencia que la falsificaría |
|---|---|
| El Axioma | Meses de uso real documentados en `experience-log.md` sin ningún rastro de transformación acompañada — solo acumulación de datos sin relación con cambio personal |
| Ley madre de atención | Reporte consistente y repetido (no aislado) de sentir más de un punto de atención en simultáneo, pese a que el conteo técnico diga uno |
| Regla del mundo físico | Que aplicarla estrictamente produzca, de forma repetida, peor comprensión que romperla en un dominio específico |
| Cero gamificación | Abandono masivo real citando explícitamente "falta de motivación para volver", sin que presencia o memoria logren compensarlo |
| La IA nunca enseña, solo recuerda | Frustración sostenida y repetida (no un deseo ocasional) por la ausencia de consejo, registrada como negligencia percibida, no como respeto |
| El espacio es la interfaz | Que la ausencia de atajos se convierta, de forma medible en `experience-log.md`, en la razón de abandono — no en parte del encanto |
| Sistemas recalculables vs. acumulativos | Que un sistema marcado "recalculable" demuestre haber perdido información que la persona sí notaba y valoraba |
| Exclusividad de autoría | Pedido sostenido y no anecdótico de cohabitar el mismo mundo con otra persona (activaría la Open Question #6, no invalidaría la decisión por sí sola) |
| El olvido con gracia | Que cualquier implementación concreta se sienta, en la práctica, como pérdida real y no como descanso |
| La prueba de los veinte años | Que el ritmo real de cambio de vida de una persona resulte mucho más rápido que el ritmo al que el mundo puede envejecer con gracia |

## Ejercicio 6 — Impact Analysis

| Decisión de este documento | Documentos afectados | Actualización requerida | ¿Cambia interpretación? |
|---|---|---|---|
| Distinción verificar/validar/medir/evaluar/auditar/revisar | Todo el corpus, en especial `RATIFIED_DECISIONS.md` y `WORLD_DESIGN_PRINCIPLES.md` | Ninguna inmediata | Sí — "evaluación de principios" en `WORLD_DESIGN_PRINCIPLES.md` se relee como revisión, no como juicio comparativo |
| Formalización de la prueba de remoción total como procedimiento único | `EXPERIENCE_BIBLE.md`, `MOMENTS_BIBLE.md`, `LIVING_SYSTEMS_BIBLE.md`, `SPATIAL_EXPERIENCE_MANIFESTO.md` | Ninguna — sus cuatro versiones quedan como antecedentes válidos, no como duplicación a resolver por reescritura | No — solo consolida hacia adelante |
| Registro de Excepciones (nuevo artefacto de proceso) | `RATIFIED_DECISIONS.md` (Regla Permanente 5 original) | Futura: crear el artefacto en sí, fuera del alcance de este documento | Sí — le da a la Regla 5 un mecanismo de cumplimiento que antes no tenía |
| Aclaración interna-vs-superficie sobre métricas | `PRESENCE_ENGINE.md`, `ATTENTION_ENGINE.md`, invariante #9 | Ninguna | Sí — previene una lectura futura de "cero métricas" como "cero evidencia" |
| Ningún invariante, decisión o ley fue modificado en contenido | Todos | Ninguna | No — este documento valida, no redefine |

## Ejercicio 7 — Decision Log

Decisiones intelectuales tomadas acá que no estaban explícitamente
pedidas por el brief: (1) tratar "medir" como categóricamente distinto
y más peligroso que "verificar", en vez de como sinónimos más suaves
— el brief pedía distinguir los seis términos, no jerarquizarlos por
riesgo; (2) proponer el Registro de Excepciones como artefacto
concreto, en vez de responder la pregunta 10 de la Estructura solo en
abstracto; (3) construir el Ejercicio 5 directamente sobre el ranking
ya existente de `RATIFIED_DECISIONS.md` en vez de volver a seleccionar
diez decisiones de forma independiente — juicio de aplicación de la
Regla Permanente 1, no instrucción literal del brief; (4) declarar
explícitamente que ninguna contradicción nueva de tipo A–F fue
encontrada en esta revisión, en vez de forzar un hallazgo para cumplir
la Regla Permanente 6 — la regla exige clasificar si se encuentra una,
no exige encontrar una a toda costa.

## Ejercicio 8 — Future Opportunities

**Un protocolo de falsificación específico para sistemas vivos.** Los
sistemas acumulativos (decisión #19) son, de los tres tipos de
conocimiento ratificado, los más difíciles de falsificar en la
práctica porque su evidencia solo aparece con años reales de uso —
merece su propio documento cuando exista suficiente
`experience-log.md` acumulado, no antes.

**Un documento de instrumentación interna de desarrollo.** Esta
auditoría tuvo que repetir, en al menos tres preguntas distintas de la
Estructura, la misma aclaración de que "sin métricas de cara al
usuario" no significa "sin ninguna evidencia interna". Eso sugiere que
falta un documento propio, dirigido solo al equipo, que especifique
qué puede instrumentarse puertas adentro sin que nada de eso cruce
nunca hacia la experiencia — no se desarrolla acá porque haría de este
documento uno técnico, y este sigue siendo conceptual.

---

## Autocrítica

### Open Questions

Se ratifican como abiertas, sin cambios, las siete preguntas de
`RATIFIED_DECISIONS.md` §3. Se agrega una nueva, propia de este
documento: **¿quién tiene autoridad formal para aprobar una
excepción?** — Regla Permanente 5 exige que toda excepción se
justifique, pero ningún documento, incluido este, define quién firma
esa aprobación ni con qué investidura. Afecta: la viabilidad real del
Registro de Excepciones propuesto en Estructura §10. Falta: una
decisión de gobernanza de proceso, no de diseño conceptual. Riesgo de
dejarla abierta: el registro se vuelve un archivo sin dueño, y un
archivo sin dueño, según la propia regla de ownership de
`RATIFIED_DECISIONS.md` §1, es "un problema, no una fortaleza".

### Knowledge Risks

Se ratifican, sin cambios, los cinco riesgos de `RATIFIED_DECISIONS.md`
Autocrítica. Se agrega uno nuevo: que el Registro de Excepciones se
proponga acá y nunca llegue a crearse en la práctica — dejando la
Regla Permanente 5 exactamente en el mismo estado de cumplimiento
honorario en que estaba antes de este documento.

### Ratification Candidates

**La prueba de remoción total** (Ejercicio 1, ítem 8), usada de forma
informal e independiente en cuatro documentos distintos sin que
ninguno la citara como procedimiento oficial, hasta esta
formalización. Candidata sólida a promoverse a Architectural Invariant
propio en la próxima revisión de `RATIFIED_DECISIONS.md`, ya que
cumple las tres condiciones de madurez que aquel documento exige
(sobrevivió a varios sprints, tiene ahora un documento propietario
claro, su reversión implicaría reescribir varios documentos).

### Validation Risks

1. Que un revisor futuro aplique la Checklist Universal de forma
   mecánica (verificar) sin nunca dar el paso siguiente de validar u
   evaluar — pasando las nueve pruebas y perdiendo, aun así, el
   sentido del conjunto.
2. Que "cero métricas de cara al usuario" se use como excusa para no
   recolectar tampoco evidencia interna, vaciando de contenido la
   Regla Permanente 2 (todo debe ser verificable de alguna forma
   razonable).
3. Que nadie, en la práctica, tenga la autoridad o el tiempo real para
   ejercer el rol de Design Review Director aquí descrito, dejando
   este framework como un proceso de papel sin ejecución real —
   exactamente el mismo riesgo que ya se nombró para el Registro de
   Excepciones, en su forma más general.

---

## Prueba final

Un diseñador nuevo, dentro de quince años, que nunca habló con nadie
del equipo original y que solo leyó este Framework, construye una
estación nueva. ¿Tiene herramientas suficientes para detectar por sí
mismo cuándo dejó de construir El Estudio?

Parcialmente, y de una forma honesta que vale la pena precisar en vez
de suavizar: este documento le da los procedimientos — qué preguntar,
en qué orden, con qué evidencia — pero cita los invariantes y
decisiones por número y nombre en vez de reproducirlos, porque
reproducirlos sería la duplicación exacta que la Regla Permanente 1
prohíbe. Si esta persona tiene acceso también a
`RATIFIED_DECISIONS.md`, a `WORLD_BEHAVIOR_LANGUAGE.md` y al canon de
`libro-01`, la respuesta es sí, sin reservas. Si de verdad solo
sobrevivió este documento y ningún otro, sabría *que* debe verificar
el invariante #6 antes de aprobar su estación, pero no *qué dice* el
invariante #6 — sabría el procedimiento sin el contenido. Eso no es un
defecto que este documento deba corregir escribiendo el contenido de
nuevo: este framework nunca pretendió ser autosuficiente, solo el
proceso. Ser un proceso que depende de un cuerpo de conocimiento
externo es correcto; no serlo sería, en sí mismo, otra forma de la
misma duplicación que todo este proyecto lleva seis sprints
evitando.
