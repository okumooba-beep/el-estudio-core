# Presence Engine 1.0

### Diseño conceptual del primer motor de El Estudio

> Este documento no implementa nada. Define qué comportamientos del
> mundo son responsables de que una habitación parezca viva sin que
> ocurra nada espectacular. Toda implementación futura de atmósfera,
> luz, clima, sonido o presencia debe poder justificarse contra este
> documento.

La pregunta que este motor responde: **¿qué pequeñas cosas hacen que una
habitación parezca viva?** Nunca "qué efecto agregamos" — siempre "qué
comportamiento del mundo estamos dejando de fingir".

---

## El descubrimiento: no todas las capas pesan igual

La lista de partida tenía diez candidatas. Analizadas una por una, se
ordenan en tres niveles, más un resultado que no se diseña directamente:

- **La raíz.** Tiempo. Es la única fuerza que nadie controla, y de ella
  se derivan todas las demás.
- **Las expresiones.** Luz, Clima, Sonido, Movimiento ambiental y
  Respiración del espacio. Cambian porque el tiempo cambia; son la
  forma visible/audible de esa única causa.
- **Los soportes de memoria.** Materiales, Objetos vivos y Evidencias
  del uso. No cambian solos: son donde el paso del tiempo y el paso de
  la persona quedan grabados.
- **El resultado.** Atmósfera. No es una capa que se programe — es lo
  que una persona percibe cuando las otras nueve funcionan juntas. Se
  audita, nunca se autoriza directamente.

Nueve capas reales, entonces, no diez — Atmósfera se retira de la lista
de entradas y pasa a ser el criterio de salida.

---

## La raíz

### Tiempo

**Qué representa:** el único cambio que nadie dentro de El Estudio
controla; la variable de la que derivan todas las demás capas.

**Qué emoción provoca:** la certeza silenciosa de que el lugar tiene
vida propia, no una vida prestada por quien lo mira.

**Cómo aporta presencia:** sin tiempo real corriendo por debajo,
cualquier otra capa es decorado que se repite igual siempre. Con tiempo
real, cada capa se convierte en evidencia de que algo efectivamente
pasó.

**Pertenece:** la hora real, la fecha real, el tiempo ausente entre una
visita y la siguiente.

**No pertenece:** un cronómetro de sesión, una racha, cualquier reloj
que la persona pueda pausar, adelantar o resetear.

---

## Las expresiones

### Luz

**Qué representa:** la traducción más inmediata del tiempo a algo que
se percibe sin pensar.

**Emoción:** orientación — saber qué momento del día es sin necesitar
mirar un reloj.

**Aporte a la presencia:** cambia despacio y sin pedir permiso; es la
prueba visual más barata y más creíble de que el tiempo pasó de verdad.

**Pertenece:** una curva continua entre día y noche, temperatura de
color, sombras que se alargan o acortan con la hora real.

**No pertenece:** interruptores de "modo", cambios abruptos, cualquier
variación de luz que responda a una acción del usuario en vez de a la
hora.

### Clima

**Qué representa:** la conexión entre El Estudio y un afuera que el
lugar no controla — la prueba de que el mundo no empieza ni termina en
la habitación.

**Emoción:** pertenecer a algo más grande que la tarea del día.

**Aporte a la presencia:** introduce variación que no depende de la
persona, alejando la sensación de mundo hecho a medida.

**Pertenece:** variación atmosférica lenta y coherente con la estación,
visible a través de una ventana.

**No pertenece:** eventos climáticos espectaculares, clima como efecto
puntual, clima que reacciona al estado de ánimo o a los logros de la
persona.

### Sonido

**Qué representa:** la prueba de que el silencio es una decisión, no un
vacío por completar.

**Emoción:** compañía sin exigencia — hay vida cerca, pero no reclama
atención.

**Aporte a la presencia:** un lugar sin ningún sonido de fondo se siente
detenido; uno con el sonido correcto se siente habitado incluso antes de
mirarlo.

**Pertenece:** sonidos ambientales del lugar y del clima — viento, una
hoja, madera, lluvia lejana.

**No pertenece:** sonidos de interfaz, música que dirige el estado de
ánimo, cualquier sonido que anuncie una acción del sistema.

### Movimiento ambiental

**Qué representa:** micro-gestos puntuales de un espacio habitado — algo
que se mueve un poco, en algún punto, sin que nadie lo accione.

**Emoción:** "no estoy solo en esta quietud", sin que nada distraiga.

**Aporte a la presencia:** quiebra la perfección estática que delata una
imagen fija; da textura temporal al primer vistazo, antes de que la
persona haga nada.

**Pertenece:** una hoja que tiembla apenas, polvo en un rayo de luz, una
cortina que se mece un poco.

**No pertenece:** movimiento que busca atención, partículas decorativas,
loops que se repiten de forma reconocible y mecánica.

### Respiración del espacio

**Qué representa:** un pulso único, continuo y casi imperceptible que
atraviesa todo el lugar a la vez — no el movimiento de un objeto, sino
del espacio entero.

**Emoción:** la certeza de que nada está congelado, incluso cuando nada
visible se mueve.

**Aporte a la presencia:** es la diferencia entre una fotografía y un
lugar. Sin este pulso de fondo, incluso las otras capas pueden leerse
como estáticas entre un cambio y el siguiente.

**Pertenece:** variaciones lentísimas y levemente desfasadas de luz u
opacidad general, tan sutiles que no se registran conscientemente.

**No pertenece:** cualquier "respiración" que se perciba como una
animación. Si se nota como movimiento, ya perdió su función.

---

## Los soportes de memoria

### Materiales

**Qué representa:** el vocabulario físico del que está hecho todo lo
demás. Determina cómo cada otra capa se manifiesta: cómo reciben luz,
cómo envejecen, qué sonido devuelven.

**Emoción:** solidez, permanencia — cosas que se sienten reales porque
se comportan como su material real se comportaría.

**Aporte a la presencia:** sin un material creíble detrás, ninguna otra
capa convence. Con él, hasta un cambio mínimo — una sombra distinta
sobre madera — resulta creíble.

**Pertenece:** papel, madera, cuero, tela, latón, cerámica, grafito:
sustancias que envejecen bien.

**No pertenece:** cualquier material sin referencia física real —
plástico brillante, cristal futurista, superficies que no podrían
ensuciarse ni gastarse nunca.

### Objetos vivos

**Qué representa:** algo que cambia con su propio ritmo, no con el del
usuario — prueba de que el lugar sostiene procesos que no dependen de
que alguien los mire.

**Emoción:** cuidado, responsabilidad silenciosa — "si no vuelvo, algo
lo nota".

**Aporte a la presencia:** rompe la idea de que todo en el mundo espera
en pausa. Algo sigue su propio reloj biológico aunque nadie interactúe
con él.

**Pertenece:** una planta, o cualquier elemento con ciclo propio de
crecimiento y marchitamiento lento y no punitivo.

**No pertenece:** cualquier ser vivo cuyo estado dependa de una tarea
cumplida, una racha o una recompensa.

### Evidencias del uso

**Qué representa:** la huella que deja específicamente la persona,
distinta de la que deja el solo paso del tiempo — la firma de su
presencia sobre el lugar.

**Emoción:** reconocimiento — "esto es mío porque yo lo hice así".

**Aporte a la presencia:** sin esta capa, el lugar envejecería igual
para cualquiera. Con ella, envejece distinto según quién lo habitó y
cómo.

**Pertenece:** marcas de contacto repetido, desgaste proporcional al uso
real, objetos que cambian según la relación específica que tuvieron con
esa persona.

**No pertenece:** cualquier marca que aparezca por logro, puntaje o
cumplimiento de un objetivo.

---

## El resultado

### Atmósfera

Atmósfera no se autoriza directamente — se audita. Es lo que una
persona siente al entrar, y solo existe si las nueve capas anteriores
están coordinadas entre sí: la misma hora contada por la luz, el sonido
y el clima; el mismo tiempo ausente reflejado en los objetos vivos y en
las evidencias de uso. Ninguna tarea de diseño puede tener como entrada
"mejorar la atmósfera" — solo puede tener como entrada una de las nueve
capas. Atmósfera es la nota final, nunca el ingrediente.

---

## Estado real hoy

Sin describir implementación: dos de las nueve capas ya tienen un motor
propio funcionando en el proyecto — Luz, y la pareja Objetos
vivos/Evidencias del uso. Las cinco restantes — Clima, Sonido,
Movimiento ambiental, Respiración del espacio y el refinamiento de
Materiales como sistema — siguen siendo, por ahora, solo esta
definición conceptual.

---

## Criterio para todo lo que venga después

Antes de construir cualquier pieza nueva de presencia, debe poder
ubicarse en una sola de las nueve capas — nunca en "atmósfera" en
general — y responder sus cinco preguntas: qué representa, qué emoción
provoca, cómo aporta presencia, qué pertenece y qué no. Si no puede
ubicarse en ninguna capa, todavía no es parte de este motor. Si mejora
la atmósfera sin pasar por ninguna capa, es sospechosa por definición:
la atmósfera no se toca directamente.
