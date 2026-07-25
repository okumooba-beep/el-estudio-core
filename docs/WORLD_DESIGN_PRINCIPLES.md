# World Design Principles 1.0

### La constitución operativa de El Estudio, escrita después de las demás

> Este documento no inventa un mundo nuevo. El Estudio ya tiene ley
> escrita — `WORLD_FOUNDATIONS.md`, `SPATIAL_EXPERIENCE_MANIFESTO.md`,
> `PRESENCE_ENGINE.md`, `ATTENTION_ENGINE.md`, `libro-01-biblia-del-estudio.md`,
> `vision.md` — y esa ley es buena. Este documento existe para tres
> cosas que ninguno de los anteriores resuelve todavía: decidir qué
> pasa cuando dos de ellos entran en conflicto, llenar las preguntas de
> diseño que ningún documento anterior contestó todavía, y someter a
> juicio real — no a confirmación — un set de principios propuestos
> para este sprint.
>
> Si en algún punto de este documento una decisión anterior del
> proyecto queda expuesta como incorrecta, se dice directamente. Ese
> fue el mandato de este sprint, y tratarlo con cuidado no significa
> tratarlo con silencio.

---

## 0. El problema que nadie había resuelto todavía: ¿cuál libro gobierna?

Antes de escribir una sola regla nueva, hay que decir esto en voz alta:
El Estudio tiene hoy **cuatro documentos que se autodeclaran la máxima
autoridad** sobre el mismo territorio.

- `SPATIAL_EXPERIENCE_MANIFESTO.md`: *"Esta es la constitución de la
  experiencia espacial de El Estudio (...) Si algún día una
  implementación lo contradice, la implementación está equivocada — no
  este documento."*
- `libro-01-biblia-del-estudio.md`: se declara la biblia del proyecto.
- `ESTUDIO_MASTER_CONTEXT.md`: *"la única fuente de verdad sobre la
  visión del proyecto."*
- `vision.md`: *"Antes de escribir código en este proyecto, léela dos
  veces."*

Ninguno de los cuatro es falso. El problema es que cuando dos de ellos
den respuestas distintas ante el mismo caso — y ya existe al menos un
caso así, ver §4 — no hay ninguna regla que diga cuál gana. Cuatro
constituciones sin jerarquía no son cuatro veces más ley: son cero
leyes, porque cualquiera puede citarse contra cualquiera.

**Propuesta de jerarquía** (a ratificar, no una decisión unilateral de
este documento):

1. **`WORLD_FOUNDATIONS.md`** — el porqué. Filosofía, axioma central,
   los cuatro Libros. No se toca salvo que cambie la misión del
   proyecto entero.
2. **Este documento (`WORLD_DESIGN_PRINCIPLES.md`)** — el árbitro.
   Cuando dos documentos de diseño choquen, se resuelve acá, y esta
   resolución queda escrita en `§5 Contradicciones Encontradas` para
   que la próxima persona no tenga que redescubrirla.
3. **`SPATIAL_EXPERIENCE_MANIFESTO.md`, `PRESENCE_ENGINE.md`,
   `ATTENTION_ENGINE.md`, `libro-01-biblia-del-estudio.md`,
   `vision.md`** — leyes de dominio específico (espacio, presencia,
   atención, objetos, ingeniería del día a día). Todas viven al mismo
   nivel; ninguna es superior a otra dentro de su propio dominio.
4. **`ESTUDIO_MASTER_CONTEXT.md`** dejaría de llamarse "la única fuente
   de verdad" y pasaría a ser lo que realmente es y ya cumple muy
   bien: el resumen de onboarding rápido — el primer documento que lee
   alguien nuevo, no el que zanja un desacuerdo.

Esto no es diseño de juego, es gobierno de documentos — pero un
estudio que no puede decidir qué libro manda tampoco puede sostener un
mundo coherente durante veinte años. Se nombra en `§5` como decisión
pendiente de ratificación porque cambia el rol de documentos que el
usuario ya escribió, y esa no es una llamada que me corresponda cerrar
sola.

---

## 1. ¿Qué es El Estudio?

Ya está bien contestado. `WORLD_FOUNDATIONS.md`: *"El Estudio no
organiza información. Acompaña la transformación de una persona."*
`vision.md`: *"No estamos construyendo una aplicación. Estamos
construyendo un lugar."* Nada que agregar acá supera lo ya escrito —
repetirlo con otras palabras sería el tipo de documento bonito que
este sprint pidió evitar.

La única precisión que vale la pena añadir, porque ninguno de los
documentos existentes la dice con estas palabras exactas: **El Estudio
es un lugar que también, incidentalmente, hace cosas útiles.** No un
conjunto de funciones útiles disfrazadas de lugar. El orden de esa
frase no es estético — es la prueba que separa cada decisión futura de
diseño (ver `§2`).

## 2. ¿Qué NO es El Estudio?

Ya está bien contestado en `libro-01` (Las Cosas que Nunca Existirán)
y `ESTUDIO_MASTER_CONTEXT.md`. Una adición real: **El Estudio no es
necesariamente el camino más rápido para hacer algo.** Eso es una
decisión de diseño consciente, no un efecto secundario a disculpar —
pero tiene un costo real que ningún documento anterior admite todavía
(ver la tensión de accesibilidad en `§5`).

## 3. ¿Qué significa habitar un software?

Contestado con precisión quirúrgica por `SPATIAL_EXPERIENCE_MANIFESTO.md`
(I–IV) y narrado en `LIVING_THE_STUDIO.md`. No hace falta una versión
nueva de esto. Lo que sí falta es la pregunta inversa, que nadie hizo
todavía: **¿qué significa dejar de habitarlo por un momento, sin
irse?** Ver `§5`, tensión de accesibilidad — un habitante real de una
casa a veces solo necesita revisar algo desde la puerta sin entrar.

## 4. ¿Qué convierte un objeto en un objeto interactivo?

`SPATIAL_EXPERIENCE_MANIFESTO.md` V ya lo resuelve para el caso
general: un objeto se vuelve interactivo cuando ya tendría esa función
en un lugar real, nunca porque una función nueva necesita un lugar
donde vivir. Eso se mantiene.

Falta una prueba operativa, más corta, para el día a día de diseño:

> **La prueba de las dos preguntas.** Un objeto merece interactividad
> si (a) alguien podría tocarlo, abrirlo o usarlo en la vida real sin
> pensarlo dos veces, y (b) hacerlo cambia algo que a la persona le
> importa recordar. Un objeto que cumple (a) pero no (b) — una silla,
> un marco vacío — se queda como decoración legítima. No todo lo que
> se puede tocar debe reaccionar.

## 5. ¿Cuándo un objeto NO debe ser interactivo?

Esta pregunta no tenía respuesta explícita en ningún documento
anterior — es el gap más claro de los diez. Se propone:

- Cuando su única función sería **decorar la decoración**: un objeto
  interactivo cuya interacción no cambia nada real es un botón
  disfrazado de mueble, y `vision.md` ya prohíbe eso para las notas
  encontradas; se generaliza acá a todo objeto.
- Cuando la interacción existiría **solo para justificar su
  presencia** — el objeto se agregó porque "hacía falta algo ahí", no
  porque el lugar ya lo tenía. Esto es lo mismo que prohíbe
  `SPATIAL_EXPERIENCE_MANIFESTO.md` V, aplicado ahora a objetos
  completos y no solo a funciones nuevas.
- Cuando ya existe **otro objeto haciendo la misma pregunta al
  usuario**. Dos objetos que abren la misma clase de acción compiten
  entre sí por atención — y eso ya está prohibido por la ley madre de
  `ATTENTION_ENGINE.md` (una sola cosa puede pesar más que el reposo).
  Se aplica acá también a nivel de affordance, no solo de énfasis
  visual.

## 6. ¿Cuál es la diferencia entre una función y un ritual?

**El gap más importante de los diez.** Ningún documento existente
distingue esto, y el principio de ejemplo #9 ("los objetos representan
rituales, no funciones") asume que la respuesta es "ninguna" — lo cual
se rechaza en `§4` de la evaluación de principios. La distinción real:

> **Un instrumento** resuelve algo rápido, sin ceremonia, y está bien
> que así sea: revisar un precio, archivar una nota cerrada, mirar la
> hora. Un instrumento que se vuelve lento por estética está mal
> diseñado, no es más "habitable" por tardar más.
>
> **Un ritual** es algo que gana significado precisamente por su
> demora y su repetición: escribir en la libreta, dejar algo en la
> biblioteca, ver crecer la planta. Un ritual que se vuelve instantáneo
> por eficiencia deja de ser ritual — se vació.

La regla de diseño que se deriva: **antes de construir un objeto hay
que decidir a cuál de las dos categorías pertenece, preguntando qué
sería en la vida real** — un archivador de metal es un instrumento
(la ficha de `future-furniture.md` ya lo describe como frío, funcional,
sin ceremonia); una libreta es un ritual. Forzar ceremonia sobre un
archivador sería tan falso como forzar velocidad sobre una libreta.
Ningún objeto es automáticamente lo uno o lo otro por ser un mueble.

## 7. ¿Cuándo debe reaccionar el mundo?

Ya resuelto con precisión por `ATTENTION_ENGINE.md` completo: una razón
real (cambió algo, hay una relación pendiente, el momento del día lo
hizo notable), nunca una razón inventada, y como máximo un punto a la
vez. No hace falta reescribirlo. Se añade una sola cosa que
`ATTENTION_ENGINE.md` no cubre porque no es su dominio — cuándo el
mundo puede reaccionar con **urgencia real, no solo énfasis** — ver la
tensión de Trading en `§5`.

## 8. ¿Cuándo NO debe reaccionar el mundo?

Igual de bien resuelto por `ATTENTION_ENGINE.md` ("Qué nunca debe
llamar la atención"). Sin adiciones — sería relleno.

## 9. ¿Cómo debe descubrir el usuario una nueva función?

**Segundo gap real.** Los documentos existentes resuelven muy bien
cómo resurface algo que la persona ya vivió (`vision.md`: "no aparece,
se encuentra; no notifica, espera"), pero ninguno contesta qué pasa
cuando el estudio agrega, por primera vez, un mueble que antes no
existía — el caso de todo lo que hoy vive en `future-furniture.md`.

> **Un mueble nuevo nace ya presente, nunca anunciado.** El día que el
> Libro Contable exista, aparece en la habitación como si siempre
> hubiera estado ahí — no hay insignia de "nuevo", no hay tooltip, no
> hay tour guiado. Se descubre exactamente como se descubre un mueble
> real que no habías notado antes en una casa que ya conocés: porque
> un día mirás para ese lado. La única concesión aceptable a la
> orientación es que un mueble recién nacido puede estar, al principio,
> un poco menos iluminado o un poco más al margen del recorrido
> habitual — nunca más brillante ni más grande. Se gana protagonismo
> con el uso, igual que todo lo demás en este mundo; nunca lo pide de
> entrada.

## 10. ¿Qué nunca deberíamos hacer?

Ya completamente resuelto por `libro-01` (Las Cosas que Nunca
Existirán) y `worldRules.ts`. No hay nada que agregar sin duplicar.

---

## Principios propuestos — evaluados uno por uno

El mandato de este sprint fue juzgar estos principios, no ratificarlos
en bloque.

1. **"Toda función debe tener un hogar físico."** — **Aceptado.** Ya
   es ley en `SPATIAL_EXPERIENCE_MANIFESTO.md` V. Sin cambios.

2. **"Los objetos existen antes que los módulos."** — **Aceptado.**
   Es, en otras palabras, la misma secuencia que el propio usuario
   impuso al pivotar de CSS a dirección de arte ("primero existe la
   habitación, después las capas"). Coherente con `vision.md`
   ("objetos son habitantes, no componentes").

3. **"La habitación es el producto."** — **Refinado, no aceptado tal
   cual.** Tomado literalmente, contradice a `vision.md`: *"La
   habitación es contexto. El escritorio es acción (...) nunca deben
   competir."* Si "la habitación" es el producto, ¿qué es entonces el
   Escritorio, que ya está definido como una zona distinta con reglas
   propias? Se propone: **"El lugar es el producto"** — donde *lugar*
   incluye habitación y escritorio como dos ritmos del mismo mundo, no
   la habitación sola. Es una palabra de diferencia, pero es la
   palabra que evita que este principio choque con una regla ya
   escrita.

4. **"La interfaz es consecuencia del mundo."** — **Aceptado.**
   Formulación exacta de `SPATIAL_EXPERIENCE_MANIFESTO.md` I.

5. **"La curiosidad inicia toda interacción."** — **Refinado.** "Toda"
   es demasiado absoluto: `ATTENTION_ENGINE.md` describe explícitamente
   un segundo motor de inicio, la costumbre ("la persona mira ahí por
   costumbre, igual que en su propia casa sabe dónde está el
   interruptor"), y el objetivo declarado de ese motor es que la
   curiosidad deje de ser necesaria con el tiempo. Se propone:
   **"La curiosidad o la costumbre inician toda interacción — nunca
   una notificación."**

6. **"Ningún objeto pide atención."** — **Contradice una ley ya
   escrita, no solo necesita matiz.** `ATTENTION_ENGINE.md` establece
   como *ley madre* que exactamente un punto puede pesar más que el
   reposo cuando tiene una razón real. "Ningún objeto pide atención"
   tal como está escrito prohíbe eso — sería más estricto que la ley
   ya vigente y la invalidaría sin decirlo. Se propone devolverlo a lo
   que `ATTENTION_ENGINE.md` ya prueba que funciona: **"Ningún objeto
   pide atención sin una razón real — y nunca más de uno a la vez."**

7. **"El silencio comunica."** — **Aceptado.** Reforzado directamente
   por la jerarquía de voz de `vision.md` (Memoria Viva → Biblioteca →
   Manifiesto → Silencio), donde el silencio es explícitamente el
   estado más frecuente por diseño.

8. **"No toda cosa debe ser interactiva."** — **Aceptado, y se le da
   cuerpo real en `§5` de las diez preguntas** (la prueba de las dos
   preguntas), porque tal como estaba propuesto era cierto pero no
   operativo — no decía cómo decidir caso por caso.

9. **"Los objetos representan rituales, no funciones."** —
   **Rechazado tal como está escrito.** Es el principio más peligroso
   de la lista si se aplica sin excepción: fuerza ceremonia sobre
   objetos que en la vida real no la tienen — un archivador no es un
   ritual, es un instrumento frío, y `future-furniture.md` ya lo
   describe así ("metal frío"). Tratar cada mueble como un ritual
   sagrado vuelve precioso lo que debería ser rápido, y eso cansa
   mucho antes de los veinte años que este proyecto se propone
   sobrevivir. Reemplazado por la distinción completa en `§6`
   (instrumento vs. ritual).

10. **"El tiempo deja huellas."** — **Aceptado.** Ya implementado en
    espíritu por `PRESENCE_ENGINE.md` (Evidencias del uso) y por
    `deskMemory.ts` mencionado en `vision.md`.

11. **"El usuario explora. Nunca navega."** — **Refinado, no
    rechazado.** Es verdadera como experiencia y falsa como mecanismo:
    `useCameraRig.ts` llama literalmente a `navigate()` de
    react-router una vez que el paneo termina. Negar eso no fortalece
    el principio, lo vuelve frágil ante cualquiera que lea el código.
    Se propone separar los dos planos explícitamente: **"El usuario
    nunca *experimenta* navegar. Que por debajo el sistema use rutas
    es un detalle de implementación tan invisible para el diseño como
    lo es para la persona que lo usa — el día que deje de serlo, el
    diseño falló, no el código."** Esto es, de hecho, exactamente lo
    que ya exige la prueba de la cámara invisible en
    `SPATIAL_EXPERIENCE_MANIFESTO.md` IV; solo hacía falta decirlo
    también del enrutamiento, no solo de la cámara.

---

## Contradicciones Encontradas

Esta sección es un requisito del sprint, no un anexo cortés. Se listan
las tensiones reales encontradas, incluidas las que no se resuelven
acá.

**1. Cuatro documentos se autodeclaran la máxima autoridad del
proyecto** (`SPATIAL_EXPERIENCE_MANIFESTO.md`, `libro-01`,
`ESTUDIO_MASTER_CONTEXT.md`, `vision.md`). Se propuso una jerarquía en
`§0`, pero es una propuesta, no una resolución unilateral — cambia el
rol de documentos que no escribí yo, y eso necesita ratificación
explícita del usuario antes de considerarse cerrado.

**2. Silencio contra urgencia real, sin resolver.** `ATTENTION_ENGINE.md`
prohíbe el color intenso ("pertenece a la publicidad, no a un lugar
real") y exige que todo énfasis tenga una razón real y nunca escale.
Pero Trading vive en este mundo (estación `pizarra`, ruta `/trading`),
y un movimiento de precio grande es exactamente el tipo de evento que
en la vida real *sí* justificaría color intenso, sonido y urgencia
inmediata — negárselo por regla estética podría hacer que la
herramienta sea peor en el momento exacto en que más importa. No se
resuelve acá si Trading es una excepción declarada a la ley madre de
atención o si debe encontrar otro lenguaje (quizás material en vez de
color: una pizarra que se percibe "cargada" por composición, no por
rojo brillante). Es una decisión de dirección de arte pendiente, no
una que este documento deba forzar.

**3. Inmersión total contra necesidad de consulta rápida.** El
proyecto es mobile-first y explícitamente rechaza ser "el camino más
rápido" como virtud (`§2`). Pero también es, en parte, una herramienta
de trading y hábitos — dominios donde a veces la persona solo necesita
un dato en tres segundos, no una caminata por una habitación. Ningún
documento existente ofrece una "puerta de atrás" legítima para ese
caso sin que se sienta como haber roto el mundo. Nombrado, no resuelto.

**4. Límite físico del espacio a veinte años.** `world-map.md` dice,
con razón, que el mapa "crece cuando el mundo lo confirma, no cuando
el código lo apura" — pero ya hay 5 estaciones construidas y 6 muebles
más documentados en `future-furniture.md` sin construir todavía. Una
habitación real tiene paredes finitas. Ningún documento dice qué pasa
cuando la habitación esté llena: ¿se agregan más habitaciones (una
casa, no un cuarto)? ¿se retiran muebles que perdieron uso, y con qué
criterio no punitivo? Esta es, de las seis, la que más directamente
pone en riesgo la prueba de los veinte años si se ignora demasiado
tiempo.

**5. "El usuario explora, nunca navega" es cierto como experiencia y
falso como mecanismo.** Resuelto en la evaluación de principios (#11)
separando fenomenología de implementación — se deja registrado acá
porque es exactamente el tipo de imprecisión que, sin corregir, un
ingeniero nuevo podría leer como permiso para negar que existe
enrutamiento, lo cual generaría confusión real más adelante.

**6. "Ningún objeto pide atención" contradice la ley madre ya escrita
en `ATTENTION_ENGINE.md`.** Resuelto en la evaluación de principios
(#6) por refinamiento directo, no por votación — cuando un principio
nuevo contradice una ley de dominio ya probada en producción, gana la
ley de dominio, no la propuesta nueva, salvo que se argumente
explícitamente por qué debería cambiar. Acá no se encontró ese
argumento.

---

## Cierre: la prueba de los veinte años

El sprint pidió una prueba de cinco años. La corteza existente del
proyecto (`SPATIAL_EXPERIENCE_MANIFESTO.md` XIII, `LIVING_THE_STUDIO.md`)
ya se comprometió, de forma consistente, con una prueba de **veinte**
años. Usar cinco acá habría sido otra inconsistencia silenciosa del
mismo tipo que este documento existe para cazar — se adopta la de
veinte, ya establecida, en vez de introducir una tercera cifra.

Aplicada: cada sección de este documento sobrevive a esa pregunta
porque ninguna depende de una moda de interfaz, un framework o una
métrica de producto — dependen de qué haría una persona real en un
cuarto real. Las dos secciones que **no** pasarían la prueba todavía
son la #2 (silencio vs. urgencia de Trading) y la #4 (límite físico
del espacio): ambas quedan honestamente abiertas en vez de forzadas a
una respuesta falsa, porque un documento honesto que admite lo que no
resolvió vale más, dentro de veinte años, que uno prolijo que fingió
haberlo hecho.
