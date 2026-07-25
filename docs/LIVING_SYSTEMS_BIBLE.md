# Living Systems Bible 1.0

### Los procesos invisibles que hacen posible todo lo demás

> `WORLD_FOUNDATIONS.md` ya dijo el porqué. `WORLD_DESIGN_PRINCIPLES.md`
> ya dijo qué puede existir. `EXPERIENCE_BIBLE.md` ya dijo qué se
> siente. `MOMENTS_BIBLE.md` ya dijo qué instantes merecen recordarse.
> Ninguno de los cuatro contesta cómo sigue funcionando el mundo el
> resto del tiempo — el que es, con enorme diferencia, la mayor parte
> de su existencia: cuando nadie lo mira. Este documento contesta eso.

## Antes de empezar: un documento que faltaba en el contexto

El contexto de este sprint no menciona `PRESENCE_ENGINE.md` ni
`ATTENTION_ENGINE.md` — pero ambos ya existen en `docs/` y ambos son
directamente el territorio de este documento. `PRESENCE_ENGINE.md` ya
resolvió, con mucha precisión, nueve capas de presencia (una raíz —
Tiempo—, cinco expresiones, tres soportes de memoria) y ya estableció
que Atmósfera no se diseña directamente, se audita. `ATTENTION_ENGINE.md`
ya resolvió las leyes de a quién le toca pesar más en cada instante.
Repetir cualquiera de los dos acá sería exactamente el error que el
sprint anterior encontró con los cuatro documentos que se
autodeclaraban constitución: trabajo duplicado que, tarde o temprano,
diverge de sí mismo sin que nadie lo note.

Este documento no reemplaza a ninguno de los dos — los usa como
cimiento y construye donde ellos se detienen. La relación completa
entre los seis documentos, dicha una sola vez para que nadie tenga que
volver a inferirla:

```
WORLD_FOUNDATIONS      → por qué existe este mundo
WORLD_DESIGN_PRINCIPLES → qué puede existir en él (reglas)
LIVING_SYSTEMS_BIBLE    → qué procesos lo mantienen corriendo (sistemas)
PRESENCE_ENGINE         → qué de esos procesos se percibe como vida (atmósfera)
ATTENTION_ENGINE        → a qué le toca pesar más en cada instante
EXPERIENCE_BIBLE        → qué se siente habitar todo lo anterior
MOMENTS_BIBLE           → qué instantes de todo eso se vuelven recuerdo
```

Cada documento es la consecuencia natural del anterior, nunca su
competencia. Este documento vive entre las reglas y la atmósfera: las
reglas dicen qué está permitido, este documento dice qué mecanismo
concreto hace que lo permitido siga sucediendo sin que nadie lo
accione, y `PRESENCE_ENGINE.md` dice cómo se percibe el resultado.

---

## Reflexión obligatoria: seis palabras, no una

- **Estado** — un hecho verdadero en este instante (qué hora es, cuánto
  creció la planta, cuánto se usó un objeto). No hace nada por sí
  mismo: es una fotografía, no un proceso.
- **Comportamiento** — una respuesta local y puntual de una sola cosa
  ante un estado (una hoja se marchita si hace tiempo que no llueve).
  No necesita sostenerse en el tiempo por sí mismo; puede ser una regla
  aplicada una vez.
- **Mecánica** — un comportamiento que una persona puede accionar
  repetidamente y a voluntad. Es, casi por definición, vocabulario de
  videojuego con recompensa incorporada — y por eso este proyecto
  debería sospechar de cualquier "mecánica" nueva antes de aceptarla:
  la pregunta correcta nunca es "qué mecánica agregamos" sino "qué
  ya haría este objeto sin que nadie lo convierta en un juego".
- **Regla** — un límite sobre lo que puede o no puede existir. Es
  estática: no corre, no produce estados nuevos, solo los acota. Es el
  territorio ya cubierto por `WORLD_DESIGN_PRINCIPLES.md`.
- **Sistema** — un proceso que sigue produciendo estados nuevos con el
  paso del tiempo real, exista o no alguien mirando. Es el territorio
  de este documento.
- **Simulación** — lo que se percibe cuando varios sistemas corren a la
  vez de forma mutuamente consistente durante el tiempo suficiente. No
  se diseña directamente — es exactamente lo mismo que
  `PRESENCE_ENGINE.md` ya dijo de Atmósfera, un nivel más abajo: se
  audita, nunca se autoriza.

## Segunda reflexión: mundo vivo contra mundo reactivo

Un mundo reactivo solo cambia como respuesta a una acción de la
persona — como un video que solo avanza mientras alguien lo mira. Un
mundo vivo tiene su propio curso por defecto, y la presencia de la
persona es apenas una entrada más entre varias (el tiempo real, el
clima real), nunca la única ni la principal. La prueba es simple: si
todo lo que este mundo hace depende de que alguien esté tocando algo,
no está vivo — está en pausa disfrazada de vida. Esto no es una idea
nueva: ya es la ley VII de `SPATIAL_EXPERIENCE_MANIFESTO.md` ("el lugar
sigue existiendo sin vos"). Lo nuevo que aporta este documento es el
mecanismo: **cómo se construye un sistema que cumple esa ley sin
necesitar que nada corra activamente mientras nadie mira.**

### El hallazgo central: sistemas recalculables contra sistemas acumulativos

Hay dos formas honestas de que un sistema "siga existiendo" cuando
nadie observa, y confundirlas es el error técnico-conceptual más común
en este tipo de proyectos.

Un **sistema recalculable** no necesita correr en ningún lado mientras
está ausente: su estado es una función pura del tiempo real y de
información externa verificable (qué hora es, qué clima hizo). No
hace falta que nada "esté corriendo" durante la ausencia — alcanza con
volver a preguntarle al mundo real la próxima vez que alguien llega.
La luz de este proyecto ya funciona así, y es la prueba de que este
patrón no es teoría: es más simple, más honesto y automáticamente
cumple la ley de existir sin ser observado, porque nunca dependió de
ser observado para calcularse.

Un **sistema acumulativo**, en cambio, no puede recalcularse desde el
tiempo real solo — depende de una historia específica de lo que
realmente pasó (qué se usó, cuánto, de qué forma), y esa historia hay
que conservarla, porque no se puede reconstruir preguntándole la hora
al mundo. El desgaste causado por una persona específica es de esta
familia. Todo sistema nuevo que se proponga en este proyecto debería
clasificarse primero en una de las dos familias — confundir una
acumulativa con una recalculable es exactamente el tipo de error que
produce, años después, un sistema que "no recuerda lo que debería" o
que "recuerda cosas que nunca deberían haberse guardado".

---

## 1. Qué significa que un lugar siga existiendo cuando nadie lo mira

Significa que, al volver, el estado del mundo es indistinguible de lo
que habría sido si alguien lo hubiera estado observando todo el
tiempo — sin que eso requiera que algo estuviera efectivamente
corriendo en el vacío. Para los sistemas recalculables, esto es casi
gratis: la verdad ya estaba disponible afuera (el reloj, el clima). Para
los acumulativos, requiere haber guardado con honestidad lo que
realmente ocurrió mientras había alguien presente para causarlo — nunca
inventar actividad durante la ausencia.

## 2. Qué debería seguir ocurriendo aunque nadie vuelva en un año

Todo lo recalculable: la luz siguiendo su curva diaria, el clima
siguiendo su curso real, la vida de un objeto vivo avanzando su propio
ciclo natural (crecer, marchitarse despacio, nunca morir de forma
punitiva). Ninguno de estos necesita a la persona para tener sentido
— tienen sentido porque son verdaderos, la persona los confirma al
volver, no los produce.

## 3. Qué nunca debería ocurrir sin una persona presente

Todo lo que implique un juicio sobre la vida de esa persona: escribir
algo en su nombre, reorganizar algo que ella dejó en un lugar
específico, decidir que algo "ya no importa" y quitarlo de su alcance,
iniciar o cerrar algo que ella no empezó. La distinción exacta: los
sistemas de este documento pueden cambiar *cómo se ve* el mundo sin
permiso; ninguno puede cambiar *qué significa* algo para esa persona
sin que ella lo haya causado primero.

## 4. Cómo transcurre el tiempo, desde la percepción

No como un contador que avanza — como una sola corriente continua de
la que todo lo demás deriva sin saltos. La persona nunca debería poder
señalar el instante exacto en que "cambió de fase": el día se vuelve
tarde, la tarde se vuelve noche, sin que exista un punto de corte
identificable. Un sistema de tiempo que produce saltos perceptibles ya
dejó de comportarse como tiempo real y empezó a comportarse como una
máquina de estados con nombres (día/noche) — y eso es, precisamente,
lo que este proyecto ya decidió no ser.

## 5. Qué cambia con cada frecuencia, y por qué

- **Todos los días:** lo recalculable de ciclo corto — luz, y clima si
  el mundo tiene acceso a clima real. Cambia todos los días porque su
  fuente (el sol, el clima) también lo hace.
- **Todos los meses:** los ciclos de vida lenta — el crecimiento de un
  objeto vivo, la estación del año reflejada en lo que se ve por la
  ventana. Cambia a este ritmo porque su fuente real (biología,
  estaciones) también es de ese ritmo — no porque el diseño haya
  elegido un mes como unidad arbitraria.
- **Todos los años:** la acumulación de evidencia de uso real y el
  desplazamiento de qué está en el centro de la atención de la
  persona contra qué ya pasó al fondo. Cambia a este ritmo porque
  necesita mucha historia acumulada antes de volverse visible — es,
  literalmente, lo único que no puede apurarse.
- **Nunca cambia:** la identidad de lo que cada cosa es (un escritorio
  siempre es un escritorio, nunca muta de función), las leyes que
  gobiernan el mundo, y la ubicación de lo que la persona puso en un
  lugar — salvo que ella misma lo mueva. Estas tres cosas son la parte
  del mundo que le da a la memoria espacial algo estable contra qué
  medir todo lo demás; si ellas también cambiaran, nada más tendría
  un punto fijo de comparación.

## 6. Cómo envejecen los objetos (significado, no textura)

Un objeto no envejece "más": envejece *distinto según quién lo usó*.
La diferencia real entre el desgaste universal (el tiempo solo) y el
desgaste personal (esta persona, este uso) ya está bien establecida en
`PRESENCE_ENGINE.md` (Materiales contra Evidencias del uso) — se cita,
no se repite. Lo que este documento agrega es la consecuencia
sistémica: un objeto que envejeciera igual para cualquiera no
necesitaría un sistema acumulativo en absoluto, le alcanzaría con uno
recalculable. El hecho de que el desgaste real requiera memoria
específica es, en sí mismo, la prueba de que ahí sí hace falta guardar
historia, no solo consultar el reloj.

## 7. Cómo envejecen los espacios

Un espacio no envejece de forma pareja — envejece con una topografía
propia: algunos puntos acumulan mucho contacto (donde la persona
efectivamente vuelve una y otra vez) y otros permanecen casi
intactos. Con los años, esa distribución dispareja de desgaste dibuja,
sin que nadie la programe a propósito, un mapa de dónde estuvo
realmente la atención de esa persona durante su vida ahí. Es un
sistema derivado, no uno nuevo: es la suma espacial de todos los
objetos individuales envejeciendo según el punto 6.

## 8. Cómo envejece la memoria (a nivel de sistema, no de experiencia)

`MOMENTS_BIBLE.md` ya describe cómo se siente esto; acá va el
mecanismo. La memoria no envejece por desvanecimiento — envejece por
**reordenamiento de prioridad**, nunca por eliminación. Algo que no
volvió a importar en mucho tiempo debería perder derecho a resurgir
espontáneamente, pero nunca perder su existencia — y ese derecho
debería poder recuperarse por completo si el presente vuelve a
parecerse a las condiciones que lo hicieron relevante una vez, no solo
por el paso de más tiempo. `ATTENTION_ENGINE.md` ya insinúa la mitad
de esto ("lo antiguo se vuelve parte del reposo"); acá se completa la
otra mitad: viejo no es lo mismo que irrelevante para siempre.

## 9. Equilibrio — cómo se evita el caos con los años

Esta es la pregunta que ningún documento anterior contestó todavía, y
es probablemente la más importante de las dieciocho. Un mundo que solo
sabe acumular —objetos, desgaste, memorias, muebles futuros ya
documentados en `future-furniture.md`— tiene, matemáticamente, un solo
destino posible sin un contrapeso: desbordar el espacio finito que ya
se identificó como riesgo en `WORLD_DESIGN_PRINCIPLES.md` y
`MOMENTS_BIBLE.md`. La única salida honesta, sin recurrir a borrado
forzado (que rompe confianza) ni a espacio infinito (que rompe la
metáfora de habitación real), es separar dos cosas que hasta ahora
este proyecto trató como una sola: **existencia** y **prominencia**.

> **El olvido con gracia.** Todo sistema acumulativo necesita un
> mecanismo por el cual lo que dejó de importar puede retirarse de
> primer plano —de la vista, del espacio activo, de la prioridad de
> resurgimiento— sin dejar jamás de existir en algún lugar accesible.
> Nada se borra nunca. Pero no todo lo que existe tiene derecho a
> seguir ocupando lugar visible para siempre. Esta es, con estas
> palabras, una revisión real a un supuesto que los documentos
> anteriores dieron por sentado: que "nada se pierde" significaba que
> todo debía permanecer igual de presente. No es así — puede
> permanecer y, aun así, retirarse.

## 10. Sistemas que generan calma

- Un sistema donde, en cualquier instante, como máximo una sola cosa
  puede pesar más que el resto — ya establecido por la ley madre de
  `ATTENTION_ENGINE.md`, citado acá como el sistema, no la emoción,
  que produce calma.
- Un sistema donde ningún cambio tiene una velocidad mínima menor a
  "lento" — nada ocurre de forma instantánea, sin excepción, sin
  importar cuán conveniente sea que algo cambie rápido en un caso
  puntual.
- Un sistema de amplitud acotada: todo valor que representa urgencia,
  ánimo o intensidad tiene un techo fijo que ningún evento puntual
  puede perforar. Sin este techo, tarde o temprano algo va a "necesitar"
  superarlo por una buena razón puntual, y ese día la calma deja de
  ser una garantía y pasa a ser una tendencia.

## 11. Sistemas que generan pertenencia

El sistema central es la **exclusividad de autoría**: nada en el
mundo de una persona puede cambiar de apariencia o de significado por
una acción de otra persona, ni por un dato agregado del comportamiento
de otros usuarios. Ningún objeto puede reaccionar a "lo que hace la
mayoría" ni a ninguna comparación externa. Esto no está escrito
explícitamente en ningún documento anterior — hoy es cierto solo
porque el proyecto todavía no tiene ninguna función social o agregada,
no porque exista una regla que lo proteja a propósito. Se propone
como regla explícita antes de que exista la tentación de agregar la
primera función de ese tipo.

## 12. Sistemas que generan continuidad

Un único reloj autoritativo del que dependen todos los demás sistemas
— nunca relojes independientes por función, que eventualmente se
desincronizan entre sí. Y la permanencia posicional ya establecida por
`ATTENTION_ENGINE.md`: nada cambia de lugar sin una razón que la
persona pueda atribuir. Ambos son, en el fondo, el mismo principio
aplicado a dos dimensiones distintas — el tiempo y el espacio deberían
tener, cada uno, una sola fuente de verdad, nunca varias compitiendo.

## 13. Sistemas que producen recuerdos sin intentar producirlos

Exactamente los sistemas recalculables y acumulativos descritos
arriba, siempre que su único objetivo declarado sea mantener un
estado verdadero — nunca "generar un momento memorable". La luz no
existe para crear recuerdos; existe para ser verdadera, y precisamente
por serlo, produce recuerdos como efecto secundario (ver
`MOMENTS_BIBLE.md`, §7-9). Un sistema cuyo objetivo explícito fuera
"producir recuerdos" ya dejó de ser un sistema y se convirtió, sin que
nadie lo haya decidido conscientemente, en una fábrica de eventos.

## 14. Sistemas que permiten descubrir sin agregar contenido nuevo

**La recombinación perceptual.** El mismo conjunto finito de
ingredientes (la posición del sol, el clima real de hoy, la estación,
el estado de desgaste acumulado, qué está o no en primer plano según
el olvido con gracia) puede combinarse en tantas configuraciones
distintas, gracias a la variabilidad real del calendario y el clima,
que la sensación de "esto no lo había visto así antes" sigue
ocurriendo durante años sin que se agregue un solo objeto nuevo. La
frescura no viene de más contenido — viene de que las mismas piezas
rara vez coinciden dos veces exactamente igual.

## 15. Sistemas que producen experiencias distintas sin romper identidad

Si se respeta la exclusividad de autoría (§11), la variación entre dos
personas ya emerge sola: cada mundo solo refleja la historia real de
quien lo habita, así que dos historias distintas producen,
automáticamente, dos mundos que se sienten distintos — sin que haga
falta ningún sistema de personalización explícito. La identidad del
mundo se mantiene porque las *reglas* que generan esa variación son
idénticas para cualquiera; lo único que cambia es la vida vivida
adentro. Mismo motor, distinta biografía — nunca motores distintos.

## 16. Sistemas que deben permanecer invisibles para siempre

El cálculo detrás de la luz, el mecanismo del olvido con gracia, y
cualquier regla de equilibrio de amplitud. Los tres comparten una
razón: en el momento en que alguien puede describir su fórmula
("ah, entonces a las X hora siempre pasa Y"), esa persona empieza a
optimizar el mundo en vez de habitarlo — y un mundo que se puede
optimizar ya se convirtió, para quien descubrió el truco, en un
sistema de juego con reglas explotables.

## 17. Qué tan visible rompe la ilusión de vida

El umbral no es "visible o invisible" — es **previsible o no
previsible**. La luz puede notarse (de hecho, debe notarse) sin
romper nada, porque nunca es exactamente igual dos días seguidos. El
peligro aparece cuando un sistema se vuelve tan regular que alguien
puede predecir su próximo estado exacto: ese es el momento en que deja
de sentirse como un mundo y empieza a sentirse como una interfaz con
un patrón de fondo.

## 18. Coherencia entre todos los sistemas

El mismo problema que ya obligó, en `WORLD_DESIGN_PRINCIPLES.md`, a
resolver cuál documento gobierna a cuál — pero ahora a nivel de
sistemas en vez de textos. La única forma de que un sistema nuevo, en
diez años, no termine evolucionando en una dirección propia y
divergente es que **todo sistema nuevo tenga que derivar del mismo
reloj único** (nunca inventar su propio tiempo) y pase por las mismas
tres preguntas antes de aceptarse: ¿existe aunque nadie lo mire?, ¿es
recalculable o necesita memoria real, y se construyó como tal a
propósito?, ¿tiene un techo de amplitud, o podría, con el tiempo,
crecer sin límite? Un sistema que no pueda contestar las tres todavía
no pertenece a este mundo — sin importar cuán bien resuelto esté en
todo lo demás.

---

## Ejercicio 1 — Los sistemas vivos fundamentales

Ya establecidos, se citan sin repetir su desarrollo:

1. **El reloj único** — la raíz de la que depende todo lo demás.
2. **La luz continua** — la traducción más inmediata del reloj a algo
   perceptible.
3. **El clima real** — la prueba de que el mundo no termina en la
   habitación.
4. **El crecimiento con vida propia** — algo que sigue su propio ritmo
   biológico, no el de quien lo mira.
5. **El desgaste acumulado por uso real** — la firma personal sobre el
   paso del tiempo.

Nuevos, desarrollados en este documento:

6. **El olvido con gracia** — lo que deja de importar se retira de
   prominencia sin dejar nunca de existir.
7. **La exclusividad de autoría** — nada cambia por causa de otra
   persona ni de un dato agregado.
8. **La recombinación perceptual** — variedad real a partir de piezas
   finitas, nunca de contenido nuevo.
9. **El equilibrio de amplitud** — ningún valor de urgencia o
   intensidad puede crecer sin techo.
10. **La coherencia por raíz común** — todo sistema nuevo se ancla al
    mismo reloj y pasa por las mismas tres preguntas de admisión.

## Ejercicio 2 — Los cinco que sostienen todo

**El reloj único.** Sin él, ningún otro sistema tiene de dónde derivar
— literalmente no habría raíz, y `PRESENCE_ENGINE.md` ya probó que sin
esa raíz todo lo demás es decorado repetido, no vida.

**El desgaste acumulado por uso real.** Sin él, el mundo envejecería
igual para cualquiera, y la pertenencia — el objetivo central de todo
el proyecto — perdería su única fuente sistémica real.

**El olvido con gracia.** Sin él, cualquier proyecto que dure de
verdad veinte años colapsa contra el espacio finito o rompe la
confianza con un borrado forzado. Es, de los diez, el que más
directamente decide si el proyecto puede sobrevivir a su propia
promesa de duración.

**La exclusividad de autoría.** Sin ella, tarde o temprano un dato
ajeno se filtra en el mundo de una persona, y ese día deja de ser su
lugar y pasa a ser una plataforma con usuarios.

**La coherencia por raíz común.** Sin ella, cada sistema nuevo que se
agregue en los próximos veinte años puede, con toda buena intención,
evolucionar en su propia dirección — exactamente el mismo problema que
ya produjo cuatro documentos que se creían la única constitución del
proyecto, ahora a nivel de sistemas en lugar de texto.

## Ejercicio 3 — Cinco ideas que sonarían bien y no lo son

1. **Un sistema de recomendación basado en lo que hacen otros
   usuarios.** Rompe la exclusividad de autoría de inmediato y
   convierte un lugar personal en una plataforma con métricas
   comparativas.
2. **Un puntaje agregado de consistencia de hábitos.** Es una
   recompensa con nombre de sistema — exactamente la mecánica que ya
   se rechazó para la estación de Hábitos en documentos anteriores.
3. **Eventos estacionales programados por calendario de marketing**
   (decoración de temporada activada por fecha de campaña, no por
   clima real). Es un evento disfrazado de sistema — su fuente de
   verdad no es el mundo real, es un cronograma editorial.
4. **Sincronización en la nube que resetea el desgaste a un estado
   prolijo en cada dispositivo nuevo.** Prioriza conveniencia técnica
   sobre continuidad real — borra evidencia de uso genuina por
   comodidad de implementación, el mismo error que el olvido con
   gracia existe para prevenir, solo que aplicado sin ninguna gracia.
5. **Reordenamiento automático de objetos para verse mejor en una
   captura de pantalla.** Rompe la permanencia espacial que
   `ATTENTION_ENGINE.md` ya protege, y subordina la memoria real de
   dónde estaba cada cosa a la performance visual de un instante.

## Ejercicio 4 — Auditoría honesta

**Ya existen de verdad, en producción:** el reloj único y la luz
continua — `lightEngine.ts` calcula esto hoy como una función pura del
momento real, exactamente el patrón recalculable descrito en este
documento.

**Solo existen como intención, no como sistema funcionando:** el
desgaste acumulado por uso real (existe un tipo de datos pensado para
esto, `deskMemory.ts`, pero la propia lore del proyecto admite que
"hoy no hay ninguna marca todavía, porque el tiempo real todavía no
pasó"); el crecimiento con vida propia de un objeto vivo, mencionado en
varios documentos pero sin un mecanismo descrito todavía; la
exclusividad de autoría, que hoy es cierta solo porque no existe
ninguna función social todavía, no porque exista una regla explícita
que la proteja.

**Todavía no sabemos cómo construir:** el olvido con gracia no tiene
ningún precedente concreto en el proyecto de cómo se vería sin
sentirse como un borrado — es, hoy, una necesidad identificada, no una
solución. El equilibrio de amplitud tampoco tiene, todavía, ningún
techo definido en ningún lugar del proyecto — es una intención de
estilo ("nunca de golpe"), no un límite formal.

## Ejercicio 5 — Veinte años después, si se elimina un sistema

**Desaparecería sin que nadie lo note, al principio:** la coherencia
por raíz común. Ningún efecto inmediato ocurre el día que un sistema
nuevo deja de pasar por las tres preguntas de admisión — el daño es
acumulativo y solo se vuelve visible años después, cuando alguien
note que partes distintas del mundo ya no se sienten como el mismo
lugar, sin poder señalar un solo momento en que algo se rompió.

**Destruiría la sensación de vida de inmediato:** el reloj único y la
luz continua. El instante en que la luz deje de reflejar la hora real,
todo lo demás pierde su ancla — `PRESENCE_ENGINE.md` ya lo advierte:
sin esa raíz, cualquier otra capa es decorado que se repite igual
siempre. No hay gradualidad posible en esta pérdida: se nota en la
primera visita después del cambio.

## Ejercicio 6 — Future Opportunities

**Cohabitación de más de una persona en el mismo mundo.** Todo lo
diseñado hoy asume una sola persona por mundo. El día que dos personas
compartan un mismo lugar, la exclusividad de autoría (§11) deja de ser
una regla simple y se vuelve una pregunta abierta: ¿de quién es el
desgaste cuando dos personas usan el mismo objeto? Merece su propio
documento completo — no una respuesta apurada acá, y conecta
directamente con el territorio de "herencia" que `MOMENTS_BIBLE.md` ya
había señalado sin desarrollar.

**Estados terminales reales.** Hoy ningún sistema del proyecto puede
llegar a un punto del que no se puede volver — todo lo vivo se
marchita pero nunca muere de verdad. `MOMENTS_BIBLE.md` ya señaló esto
desde el ángulo emocional (la categoría de lo irreversiblemente
perdido); este documento confirma que, además, es un problema de
sistemas sin resolver: no existe hoy ningún mecanismo formal para un
estado del que no haya retorno. Sigue siendo territorio para un
documento futuro, no para una decisión tomada de paso acá.

**Un documento propio para el equilibrio de amplitud.** Qué tan grande
puede ser un cambio percibido antes de sentirse como un salto es, hoy,
una intuición de estilo repetida en varios documentos ("nunca de
golpe") sin un marco unificado que la sostenga. Merece su propio
desarrollo dedicado en algún sprint futuro.

---

## System Risks

No riesgos técnicos — decisiones de diseño aparentemente pequeñas que
convertirían este mundo vivo en una interfaz con efectos:

1. **El olvido con gracia se implementa como un borrado silencioso.**
   Si algún día la persona busca algo y descubre que ya no está,
   ningún grado de "seguía existiendo técnicamente en algún lado" va a
   reparar la confianza rota en ese instante.
2. **El equilibrio de amplitud se relaja "solo por esta vez" para una
   función que parece merecerlo.** Es el mismo patrón de excepciones
   acumuladas que ya se identificó como riesgo en `EXPERIENCE_BIBLE.md`
   — acá aplicado a un límite numérico en vez de a una decisión de
   copy, lo cual lo hace más fácil de justificar y, por eso, más
   peligroso.
3. **La recombinación perceptual se vuelve previsible.** Si la
   variedad diaria empieza a sentirse como una rotación reconocible en
   vez de una coincidencia real, la gente deja de experimentarla como
   parte del mundo y empieza a leerla como el algoritmo mostrando
   variedad a propósito.
4. **La exclusividad de autoría se filtra sin que nadie decida
   romperla conscientemente**, el día que se agregue cualquier
   función social o comparativa por una razón que en el momento
   parezca completamente ajena a este tema.
5. **La coherencia por raíz común se abandona bajo presión de
   plazos** — "este sistema nuevo no tiene tiempo de pasar por las
   tres preguntas, lo hacemos aparte por ahora." Ese "por ahora" es,
   con altísima probabilidad, permanente — es exactamente el patrón
   que ya produjo, a nivel de documentos, el problema de las cuatro
   constituciones.

---

## Prueba final

Si se eliminaran absolutamente todas las animaciones, todos los
sonidos y toda la iluminación — ¿los sistemas descritos acá seguirían
existiendo?

Sí, sin excepción. Ninguno de los diez sistemas de este documento *es*
luz, sonido o animación — todos esos son, como ya estableció
`PRESENCE_ENGINE.md`, apenas expresiones posibles de una raíz que
sigue siendo verdadera aunque nada la muestre: el tiempo real sigue
pasando, el uso real sigue acumulándose, lo que dejó de importar
sigue retirándose de prominencia, nada sigue cambiando por causa de
otra persona. Quitar toda la presentación no apaga ningún sistema —
solo apaga los canales por los que esos sistemas se vuelven visibles.
Un sistema que dejara de existir sin su presentación nunca fue un
sistema: era presentación con vocabulario de sistema. Esa es,
exactamente, la línea que separa todo lo escrito acá de una interfaz
con buenos efectos.
