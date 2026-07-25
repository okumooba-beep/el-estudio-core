# Concept-to-Spec Protocol 1.0

### STATUS: Knowledge Translation Protocol

Este documento no crea filosofía, principios, experiencia, sistemas,
comportamiento, especificaciones ni implementación. Los diez
documentos ya existentes (`WORLD_FOUNDATIONS.md` hasta
`DESIGN_VALIDATION_FRAMEWORK.md`) permanecen inalterados — este
protocolo solo define cómo su conocimiento viaja hacia una
especificación implementable sin perder significado en el camino.

---

## Antes de escribir: qué ya existe, y un hallazgo que hay que resolver primero

Regla Permanente 1 obliga a revisar antes de escribir. Ya existen, sin
necesidad de repetirlos: la taxonomía de contradicciones A–F, los once
Architectural Invariants, la tabla de veinticinco decisiones
ratificadas y las Rejected Ideas (`RATIFIED_DECISIONS.md` §§2, 4, 5);
la distinción verificar/validar/medir/evaluar/auditar/revisar y la
Checklist Universal de nueve pasos (`DESIGN_VALIDATION_FRAMEWORK.md`
Estructura §1-3, Ejercicio 1); el Registro de Excepciones ya propuesto
en aquel mismo documento (Estructura §10) — este protocolo lo reutiliza
en `§11`, no crea uno nuevo.

**Un hallazgo que debe resolverse antes de continuar:** la Regla
Permanente 3 de este documento fija una cadena obligatoria —
`FOUNDATION → PRINCIPLE → EXPERIENCE → SYSTEM → BEHAVIOR →
SPECIFICATION` — y `RATIFIED_DECISIONS.md` §6 ya fijó, cuatro sprints
antes, una cadena distinta: `WORLD_FOUNDATIONS → WORLD_DESIGN_PRINCIPLES
→ LIVING_SYSTEMS_BIBLE → WORLD_BEHAVIOR_LANGUAGE → PRESENCE_ENGINE/
ATTENTION_ENGINE → SPATIAL_EXPERIENCE_MANIFESTO → libro-01 → vision.md
→ EXPERIENCE_BIBLE → MOMENTS_BIBLE`. Leídas ingenuamente, EXPERIENCE
aparece antes que SYSTEM y BEHAVIOR en una cadena, y después en la
otra — una **Case D (Ambigüedad)** real si se dejara sin resolver,
usando la taxonomía oficial tal como exige la buena práctica ya
establecida por los documentos anteriores.

**Resolución:** son dos ejes distintos, del mismo modo en que
`RATIFIED_DECISIONS.md` §1 ya tuvo que distinguir autoridad de
dependencia. La cadena de `RATIFIED_DECISIONS.md` §6 describe el
**orden de autoría** — qué biblia necesitó que otra existiera antes
para poder escribirse. La cadena de la Regla Permanente 3 describe el
**orden de traducción de una idea individual** — qué pregunta hay que
contestar antes que cuál al convertir una idea ya existente en una
especificación. Decidir qué se debería *sentir* al vivir una idea
(EXPERIENCE) razonablemente precede, en ese proceso puntual, a decidir
qué *mecanismo* la sostiene (SYSTEM) y con qué *vocabulario* se expresa
(BEHAVIOR) — aunque, históricamente, las bibias de Sistema y
Comportamiento se hayan escrito antes que la de Experiencia. Ninguna de
las dos cadenas está mal; describen procesos distintos. Se usa acá,
en adelante, exclusivamente la lectura de "pipeline de traducción", no
la de "orden de autoría" — ver `§2` para el mapeo explícito de qué
documento provee el conocimiento de cada etapa.

---

## Reflexión obligatoria: seis verbos que no son sinónimos

- **Traducir** — el verbo paraguas de todo este documento: pasar el
  mismo significado de un lenguaje a otro sin agregar ni quitar
  intención.
- **Reinterpretar** — cambiar el significado durante el traspaso,
  a veces sin darse cuenta. Es exactamente lo que la Regla Permanente
  4 prohíbe. Una traducción que reinterpreta ya dejó de ser
  traducción — es una idea nueva con el nombre de la vieja.
- **Simplificar** — quitar detalle manteniendo intacto el significado
  esencial. Operación legítima *dentro* de traducir, siempre que la
  Regla Permanente 2 pueda justificar la pérdida explícitamente.
- **Abstraer** — generalizar un caso concreto a un principio que cubre
  más casos de los que lo motivaron originalmente. Es el movimiento
  opuesto a especificar: sube de nivel, no baja.
- **Especificar** — producir un documento técnico intermedio,
  implementable pero todavía no implementado. Es el destino final de
  este protocolo y el límite exacto de su alcance.
- **Implementar** — producir el artefacto de código real a partir de
  una especificación. La única de las seis que este documento
  explícitamente no cubre.

**Dónde termina una etapa y empieza la siguiente:** traducir es la
sombrilla; simplificar y abstraer son movimientos legítimos que
pueden ocurrir dentro de ella, en cualquier combinación; reinterpretar
nunca es una etapa legítima, es el nombre que le damos a una
traducción fallida. Especificar es el punto donde traducir se detiene
y produce un artefacto nombrado y citable; implementar empieza donde
ese artefacto termina, y ocurre fuera de este documento.

## Segunda reflexión: qué conocimiento nunca debería cruzar hacia una especificación

**Las verdades del proyecto citadas de forma literal.** El Axioma no
debe aparecer copiado dentro de un ticket técnico — debe traducirse a
un requisito verificable ("el sistema no reinicia el desgaste al
perder sesión"), nunca citarse como si la especificación fuera el
lugar correcto para la prosa filosófica. Hacerlo sería mezclar dos
categorías que `RATIFIED_DECISIONS.md` ya distinguió en su Reflexión
Obligatoria (verdad del proyecto contra decisión implementable).

**El tono y la voz narrativa.** La prosa en primera persona de
`libro-01` §12, las narraciones completas de `LIVING_THE_STUDIO.md`:
un especificador necesita la consecuencia funcional de esa voz, nunca
la voz en sí.

**Las Open Questions disfrazadas de respuestas resueltas.** Ninguna de
las siete preguntas abiertas de `RATIFIED_DECISIONS.md` §3 puede
colarse dentro de una especificación como si ya tuviera una
resolución. Ver `§10`.

**Las Rejected Ideas, sin su etiqueta de rechazo visible.** Si una
especificación futura reintroduce, sin saberlo, "invitar" en vez de
"ofrecerse", o un sistema de recompensa disfrazado de progreso — el
protocolo falló, no porque la idea rechazada haya vuelto, sino porque
volvió sin que nadie reconociera que ya había sido rechazada antes
(`RATIFIED_DECISIONS.md` §4). Ver `§5`.

**La Design Debt con más confianza de la que tiene.** Una decisión
marcada "Media" o "Baja" en `RATIFIED_DECISIONS.md` §2/§8 debe llegar
a la especificación con esa misma marca — nunca redondeada hacia
arriba solo porque ya está escrita en un documento técnico.

---

## Estructura

### 1. ¿Qué significa traducir conocimiento?

Preservar la función, la intención y el límite de una idea mientras
cambia su forma — de prosa filosófica a requisito verificable. No es
"convertir": convertir permite que el resultado sea otra cosa;
traducir exige que sea la misma cosa, dicha de otro modo.

### 2. ¿Cuáles son las etapas oficiales de traducción?

Usando la lectura ya resuelta en "Antes de escribir" — orden de
traducción, no orden de autoría — cada documento existente provee el
conocimiento de exactamente una etapa:

| Etapa | Qué pregunta contesta | Documento(s) que proveen ese conocimiento |
|---|---|---|
| FOUNDATION | ¿Por qué existe esto? | `WORLD_FOUNDATIONS.md` |
| PRINCIPLE | ¿Puede existir esto? | `WORLD_DESIGN_PRINCIPLES.md` |
| EXPERIENCE | ¿Qué se debería sentir? | `EXPERIENCE_BIBLE.md`, `MOMENTS_BIBLE.md` |
| SYSTEM | ¿Qué mecanismo lo sostiene? | `LIVING_SYSTEMS_BIBLE.md`, `PRESENCE_ENGINE.md`, `ATTENTION_ENGINE.md` |
| BEHAVIOR | ¿Con qué vocabulario se expresa? | `WORLD_BEHAVIOR_LANGUAGE.md`, `SPATIAL_EXPERIENCE_MANIFESTO.md`, `libro-01`, `vision.md` |
| SPECIFICATION | ¿Cómo se verifica que esto se construyó bien? | No existe todavía — es lo que este protocolo ayuda a producir |

`RATIFIED_DECISIONS.md` y `DESIGN_VALIDATION_FRAMEWORK.md` no
pertenecen a ninguna etapa individual — son transversales: el primero
asigna propietario y estabilidad a cualquier conocimiento de cualquier
etapa, el segundo valida el resultado final contra las seis anteriores.

### 3. ¿Qué información debe permanecer obligatoriamente?

La cita exacta del invariante o decisión de origen (nunca parafraseada
sin su número); el criterio de falsificación ya declarado en
`DESIGN_VALIDATION_FRAMEWORK.md` Ejercicio 5, si la decisión traducida
aparece en esa lista; el documento propietario; el nivel de
estabilidad.

### 4. ¿Qué información puede abstraerse?

El tono narrativo y la voz en primera persona; el andamiaje pedagógico
de cada biblia (sus propios ejercicios, preguntas numeradas,
autocríticas) — la especificación necesita la conclusión, no el
proceso de llegar a ella; la historia completa de cómo evolucionó una
idea (`RATIFIED_DECISIONS.md` Ejercicio 5) — una especificación
necesita la forma ratificada actual, no su genealogía.

### 5. ¿Qué información nunca debería llegar a una especificación?

Todo lo nombrado en la Segunda Reflexión. En términos de
procedimiento: toda especificación nueva debe contrastarse
explícitamente contra la lista completa de Rejected Ideas
(`RATIFIED_DECISIONS.md` §4) antes de darse por terminada — no como
sugerencia, como paso obligatorio del pipeline (`§1`, última
transición).

### 6. ¿Cómo detectar pérdida de significado?

Que una especificación pase la Checklist Universal de nueve pasos
(`DESIGN_VALIDATION_FRAMEWORK.md` Ejercicio 1) es necesario, no
suficiente. Hay pérdida de significado si, leyendo *solo* la
especificación, ya no se puede reconstruir la respuesta a "¿por qué
existe esto?" de la etapa FOUNDATION — aunque la especificación pase
cada verificación técnica puntual.

### 7. ¿Cómo detectar reinterpretaciones?

Una reinterpretación se detecta cuando la especificación contiene una
justificación que no puede rastrearse hasta ningún documento citado —
una **justificación huérfana**. Es la misma señal de alerta que
`DESIGN_VALIDATION_FRAMEWORK.md` Ejercicio 1 (paso 9) ya nombró como la
más confiable de todo ese framework: una razón redactada después de
construir, para justificar lo ya construido, en vez de citada desde
antes.

### 8. ¿Cómo garantizar que dos personas lleguen prácticamente al mismo resultado?

Constriñendo el resultado por lo citable, no por el estilo individual
de quien escribe. La Plantilla Universal de Trazabilidad (Ejercicio 3)
obliga a que cada afirmación de la especificación apunte a un número
de invariante, decisión o verbo existente — dos personas distintas,
citando el mismo número, producen necesariamente el mismo requisito,
incluso si lo redactan con palabras diferentes.

### 9. ¿Cómo preservar la intención original?

Traduciendo siempre primero el "por qué" (la etapa FOUNDATION/PRINCIPLE
de la idea) y solo después el "qué" (SYSTEM/BEHAVIOR/SPECIFICATION) —
nunca al revés. Especificar el mecanismo antes de tener escrito el
porqué es, estructuralmente, cómo nace una justificación huérfana.

### 10. ¿Cómo resolver conflictos entre dos documentos conceptuales durante la traducción?

No se inventa un árbitro nuevo: se usa el ya ratificado en
`RATIFIED_DECISIONS.md` §1 — `WORLD_DESIGN_PRINCIPLES.md` arbitra
entre documentos de Nivel 2. Si el conflicto es sobre un territorio que
ese árbitro nunca llegó a resolver (por ejemplo, Trading, Open
Question #2), la traducción se detiene ahí — no se resuelve por
criterio del traductor. Esto no es una excepción a este protocolo, es
la aplicación directa de su Regla Permanente 6: declarar, no inventar.

### 11. ¿Cómo documentar excepciones?

Reutilizando el Registro de Excepciones ya propuesto en
`DESIGN_VALIDATION_FRAMEWORK.md` Estructura §10, con los mismos campos.
Este protocolo no crea un segundo registro — una especificación que
necesita una excepción agrega una entrada ahí, citando además en qué
etapa de la traducción (`§2`) ocurrió la necesidad de excepción.

### 12. ¿Cómo mantener la trazabilidad completa del proyecto?

Toda especificación carga, como metadato obligatorio, la cadena
completa de seis citas (una por etapa) que la originaron. El camino
inverso exigido por la Regla Permanente 3 — de SPECIFICATION de vuelta
a FOUNDATION — se reconstruye leyendo esos seis campos directamente
desde el archivo de especificación, sin depender de memoria
institucional ni de quien la escribió.

---

## Ejercicio 1 — Pipeline Oficial de Traducción

| Transición | Qué permanece intacto | Qué se abstrae | Qué deja de ser necesario | Por qué esa pérdida es segura |
|---|---|---|---|---|
| FOUNDATION → PRINCIPLE | La intención (por qué esto importa) | El lenguaje de verdad-absoluta se acota a reglas verificables | La prosa fundacional completa | El Axioma sigue citable por referencia; repetirlo no agrega precisión, solo volumen |
| PRINCIPLE → EXPERIENCE | El límite de lo permisible | El "puede existir" se convierte en "se debería sentir así" | El lenguaje de regla abstracta | El principio sigue disponible por cita; la especificación necesita el sentimiento objetivo, no el argumento que lo permite |
| EXPERIENCE → SYSTEM | El objetivo emocional concreto | El lenguaje de sentimiento se convierte en clasificación mecánica (recalculable/acumulativo) | La descripción narrada de la emoción | El objetivo emocional queda registrado como criterio de validación (`DESIGN_VALIDATION_FRAMEWORK.md` §2), no se necesita repetirlo en el lenguaje de sistema |
| SYSTEM → BEHAVIOR | El mecanismo elegido | El mecanismo se mapea a uno de los once verbos, o se declara sin vocabulario | El razonamiento interno de por qué ese mecanismo y no otro | Ese razonamiento ya vive citado en `LIVING_SYSTEMS_BIBLE.md`; el vocabulario es lo único que necesita viajar hacia adelante |
| BEHAVIOR → SPECIFICATION | El verbo, el invariante, la regla del mundo físico | Todo lo anterior se compila en requisitos verificables (formato de la Checklist Universal) | El lenguaje de gramática en sí | Un requisito verificable contiene toda la información operativa que un verbo describía en lenguaje natural |

## Ejercicio 2 — Cinco decisiones ratificadas, paso a paso

**Ley madre de atención (#9).** F: el Axioma exige acompañar, no
exigir atención. P: solo puede existir un punto de énfasis genuino. E:
se debería sentir como calma, nunca como competencia por la mirada. S:
el conteo de puntos activos debe evaluarse en tiempo real, sin caché
que permita más de uno por accidente. B: expresable con cualquiera de
los once verbos, nunca dos a la vez sobre el mismo objeto. Spec:
"en cualquier instante, `activeEmphasisPoints.length <= 1`, verificable
por conteo directo."

**Mueble nace ya presente (#14).** F: el mundo sigue existiendo sin la
persona. P: un mueble nuevo no anuncia su llegada. E: debería sentirse
como redescubrir, no como recibir una notificación. S: el objeto debe
insertarse en el estado persistente antes del primer render posterior
a su creación, no durante él. B: verbo "esperar" — el objeto ya está
ahí, aguardando sin señal. Spec: "ningún objeto nuevo dispara un evento
de UI en su primer render; su existencia debe ser indistinguible de un
objeto preexistente."

**Sistemas recalculables contra acumulativos (#19).** F: el tiempo es
la única fuerza no controlable. P: ningún sistema puede depender de
que la app estuviera abierta para funcionar. E: debería sentirse como
que el mundo nunca se detuvo. S: clasificación explícita por sistema
(reloj como recalculable puro). B: verbo "envejecer" para lo
acumulativo, sin verbo dedicado para lo recalculable (se expresa
simplemente estando actualizado). Spec: "todo valor derivado del reloj
se computa desde timestamp real, nunca desde un contador incrementado
en cada sesión."

**Gramática — "ofrecerse" (#23, reemplaza a "invitar").** F: la IA es
habitante, no vendedor de su propia atención. P: ningún objeto inicia
contacto. E: debería sentirse como encontrar, nunca como ser
abordado. S: el objeto no dispara nada por sí mismo; solo cambia su
propio estado disponible. B: verbo "ofrecerse". Spec: "el objeto no
posee ningún método `notify()` ni `prompt()`; solo expone un estado
`disponible: boolean` que otro código puede o no consultar."

**Objetos como habitantes — reason/story (#7).** F: cada objeto tiene
una historia dentro de este mundo. P: pasa la prueba de las dos
preguntas de admisión. E: debería sentirse como conocer a alguien, no
como configurar un ítem. S: el campo debe existir desde la creación
del objeto, nunca agregarse después. B: instrumento o ritual, según
`libro-01` §6. Spec: "`RoomObjectDefinition` exige `reason: string` y
`story: string` no vacíos como condición de compilación, no de
validación en runtime."

## Ejercicio 3 — Plantilla Universal de Trazabilidad

Todo archivo de especificación futura debe declarar, como bloque de
metadatos inicial:

```
FOUNDATION cita:        [verdad del proyecto de la que depende]
PRINCIPLE cita:         [principio o prueba de admisión aplicable]
EXPERIENCE objetivo:    [qué se debe sentir; cita EXPERIENCE_BIBLE/MOMENTS_BIBLE si aplica]
SYSTEM mecanismo:       [recalculable o acumulativo; de qué reloj/estado depende]
BEHAVIOR verbo(s):      [uno o más de los once verbos; o "sin vocabulario — declarado abajo"]
SPECIFICATION:          [el requisito verificable en sí]
Excepciones:            [entrada correspondiente en el Registro de Excepciones, o "ninguna"]
Estabilidad heredada:   [Alta / Media / Baja — igual a la de la decisión de origen, nunca mayor]
Chequeo inverso:        [confirmación de que, leyendo solo este bloque, se reconstruye la cadena completa hacia FOUNDATION]
```

## Ejercicio 4 — Cinco errores típicos de traducción

1. **Cita literal de una verdad del proyecto dentro de un ticket
   técnico.** Evitado por la Segunda Reflexión y por exigir que el
   campo FOUNDATION de la plantilla cite, no reproduzca.
2. **Resolver en silencio una Open Question durante la
   especificación.** Evitado por `§10` — la traducción se detiene, no
   decide por cuenta propia.
3. **Reintroducir una Rejected Idea sin saber que ya fue rechazada.**
   Evitado por el chequeo obligatorio contra `RATIFIED_DECISIONS.md`
   §4 antes de dar por cerrada cualquier especificación (`§5`).
4. **Inflar la confianza de una Design Debt.** Evitado por el campo
   "Estabilidad heredada" de la plantilla, que nunca puede superar la
   estabilidad de la decisión original.
5. **Justificación huérfana** (una razón inventada durante la
   traducción, sin cita de origen). Evitado por `§7` — toda afirmación
   de la especificación debe rastrearse hasta un número citable.

## Ejercicio 5 — Cinco simplificaciones que destruirían identidad

1. Simplificar "ningún objeto inicia contacto" a "las notificaciones
   están desactivadas por defecto" — convierte un invariante en una
   preferencia configurable, exactamente lo opuesto de un invariante.
2. Simplificar "el olvido con gracia" a "ocultar después de 30 días" —
   reemplaza un juicio contextual por un temporizador ciego, el
   mecanismo punitivo que la decisión original quería evitar.
3. Simplificar los once verbos a tres estados genéricos
   (inactivo/activo/urgente) — colapsa "ceder" y "retirarse" de vuelta
   en la misma conflación que `WORLD_BEHAVIOR_LANGUAGE.md` ya corrigió.
4. Simplificar la ley madre a "máximo una notificación push por día" —
   confunde una regla espacial de énfasis con una regla de frecuencia
   de notificaciones; no es una simplificación, es un error de
   categoría.
5. Simplificar la admisión de objetos a "tiene nombre e ícono" —
   elimina por completo el requisito de historia de origen, permitiendo
   el regreso de objetos puramente decorativos que `libro-01` ya
   excluye.

## Ejercicio 6 — Knowledge Gaps

No pueden traducirse hoy, y deben declararse como tales en vez de
forzarse: el olvido con gracia y el equilibrio de amplitud, por
carecer de mecanismo concreto (`RATIFIED_DECISIONS.md` §8); cualquier
especificación de Trading, mientras la Open Question #2 siga sin
resolución de dirección de arte; cualquier comportamiento que no
pueda nombrarse con los once verbos existentes — la falta de
vocabulario no se resuelve inventando un verbo dentro de una
especificación, eso sería reinterpretación disfrazada de traducción.

## Ejercicio 7 — Decision Log

Decisiones metodológicas no pedidas explícitamente por el brief: (1)
resolver la aparente contradicción entre la cadena de la Regla
Permanente 3 y la de `RATIFIED_DECISIONS.md` §6 distinguiéndolas como
dos ejes (orden de autoría contra orden de traducción) en vez de
descartar una a favor de la otra; (2) asignar cada documento existente
a exactamente una etapa del pipeline, incluyendo ubicar
`PRESENCE_ENGINE.md`/`ATTENTION_ENGINE.md` bajo SYSTEM en vez de bajo
EXPERIENCE o BEHAVIOR; (3) exigir el chequeo obligatorio contra
Rejected Ideas como paso explícito del pipeline, no solo como
advertencia general; (4) reutilizar el Registro de Excepciones de
`DESIGN_VALIDATION_FRAMEWORK.md` en vez de crear uno nuevo, aplicando
la Regla Permanente 1 de forma literal.

## Ejercicio 8 — Impact Analysis

| Elemento afectado | Cambio | Actualización requerida | ¿Cambia interpretación? |
|---|---|---|---|
| Futuras especificaciones (categoría que aún no existe) | Ahora requieren la Plantilla Universal de Trazabilidad (`§Ejercicio 3`) como metadato obligatorio | N/A — se aplica desde su creación | N/A |
| `DESIGN_VALIDATION_FRAMEWORK.md` Ejercicio 1 (Checklist Universal) | Pasa a ser, explícitamente, el formato de compilación de la transición BEHAVIOR→SPECIFICATION | Ninguna | Sí — se relee como el paso final de este pipeline, no solo como validación posterior |
| `RATIFIED_DECISIONS.md` §6 (grafo de dependencia documental) | Gana una distinción explícita frente a la cadena de esta Regla Permanente 3 | Ninguna inmediata | Sí — se aclara que describe orden de autoría, no orden de traducción |
| Registro de Excepciones | Gana un segundo tipo de entrada (excepciones de traducción, no solo de implementación) | Ninguna estructural | No — mismo formato, más orígenes posibles |

## Ejercicio 9 — Future Opportunities

**Un verificador automático de citas.** Una herramienta que confirme
que cada número de invariante o decisión citado en una especificación
existe realmente en `RATIFIED_DECISIONS.md` — mejora técnica de
proceso, no de filosofía; no se diseña acá porque excede el alcance
conceptual de este documento.

**Un Registro de Especificaciones**, análogo al Registro de
Excepciones, una vez que existan especificaciones reales que
registrar — prematuro de diseñar en detalle antes de que exista la
primera.

---

## Autocrítica

### Open Questions

Se ratifican, sin cambios, las siete de `RATIFIED_DECISIONS.md` §3.
Se agrega una propia de este protocolo: **¿el mapeo de documentos a
etapas de `§2` es definitivo, o debe revisarse una vez que la primera
especificación real exponga una etapa que no encaje limpiamente?**
Afecta: la validez de la Plantilla Universal. Falta: evidencia de uso
real (todavía no existe ninguna especificación escrita bajo este
protocolo). Riesgo de dejarla abierta: bajo, mientras se marque el
mapeo como estabilidad Media, no Alta.

### Knowledge Risks

Se ratifican los cinco de `RATIFIED_DECISIONS.md`. Se agrega: que la
distinción entre "orden de autoría" y "orden de traducción",
resuelta acá con cuidado, se pierda informalmente y alguien vuelva a
leer la cadena de la Regla Permanente 3 como si reemplazara al grafo
de `RATIFIED_DECISIONS.md` §6 — la misma ambigüedad ya resuelta,
resurgiendo por no haber sido leída con atención.

### Translation Risks

1. Que la abstracción se use como excusa para no justificar una
   pérdida real — la Regla Permanente 2 exige justificar cada pérdida,
   pero nada impide que alguien escriba una justificación débil solo
   para cumplir el formato.
2. Que el determinismo se erosione con el tiempo a medida que más
   personas traducen sin haber leído la Plantilla completa, y empiecen
   a citar de memoria en vez de citar el número exacto.
3. Que el chequeo obligatorio contra Rejected Ideas se salte en la
   práctica por parecer un paso burocrático, justo en el tipo de
   especificación apurada donde más falta hace.

### Ratification Candidates

El mapeo documento-a-etapa de `§2` es candidato a ratificarse como
parte formal de `RATIFIED_DECISIONS.md` una vez que al menos una
especificación real lo haya usado sin necesitar ajustes.

---

## Prueba final

Dentro de ocho años, alguien que nunca habló con el equipo original,
con acceso solo a los documentos conceptuales y a este protocolo,
escribe una especificación nueva. ¿Llega esencialmente a la misma
interpretación que el equipo original habría producido?

Sí, en todo lo que tiene número citable: un invariante, una decisión
ratificada, un verbo existente — ahí el protocolo fuerza convergencia
porque la especificación queda constreñida por la cita, no por el
juicio personal de quien la escribe. También sí, de una forma menos
obvia pero igual de importante, en todo lo que hoy es un Knowledge Gap
o una Open Question: el protocolo no promete que esa persona invente
la misma respuesta que el equipo original habría inventado — promete
que, igual que el equipo original, se detenga ahí en vez de inventar
cualquier respuesta. Dos personas que se detienen en el mismo lugar
por la misma razón ya llegaron, en el sentido que importa, al mismo
resultado.

Donde la respuesta todavía es honestamente incierta es en el mapeo
documento-a-etapa de `§2` — nunca se probó contra una especificación
real, y por eso viaja marcado como estabilidad Media, no Alta,
siguiendo la misma convención que `RATIFIED_DECISIONS.md` ya estableció
para no congelar una idea antes de que el tiempo la ponga a prueba. El
protocolo no está fingiendo estar más terminado de lo que está — y,
dado que esa misma honestidad sobre la propia madurez es, en sí misma,
una de las reglas que este proyecto lleva ocho sprints aplicando sobre
todo lo demás, aplicarla también sobre este documento es la prueba más
directa de que el protocolo entendió su propio método.
