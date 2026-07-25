# Visión

No estamos construyendo una aplicación. Estamos construyendo un lugar.

Esa frase no es una metáfora decorativa: es la regla de la que se
desprenden todas las demás. Antes de escribir código en este proyecto,
léela dos veces y después lee lo que sigue.

## Lo que eso significa en la práctica

**El silencio es el estado por defecto.**
No hay una frase, un consejo o una notificación esperando siempre en
pantalla. La jerarquía de voz (Memoria Viva → Biblioteca de Sabiduría →
Frase del Manifiesto → Silencio) existe precisamente para que el cuarto
estado — no decir nada — sea el más frecuente. Un lugar habitado no
habla todo el tiempo. Ver `src/lib/voice/voiceEngine.ts`.

**La IA nunca enseña. La IA recuerda.**
Ningún componente da consejos. La IA de este proyecto trabaja solo con
evidencia — lo que la persona ya hizo, ya escribió, ya vivió — nunca con
sugerencias sobre lo que debería hacer. Esta regla está protegida con
comentarios en el propio código, en los lugares donde sería más fácil
romperla sin darse cuenta.

**Los objetos tienen historia, no son decoración.**
El sistema de Room Objects (`src/types/roomObject.ts`,
`src/components/room/`) no es gamificación ni logros coleccionables.
Cada objeto es una entidad con posición, estado y condiciones propias.
La libreta es el primer habitante — la arquitectura se pensó para que
agregar el siguiente objeto sea trivial y nunca requiera tocar el
renderer ni los objetos ya existentes.

**Las cosas cambian con el tiempo, no con premios.**
Los futuros Objetos Persistentes evolucionarán lentamente según cuánto
llevan presentes, nunca por puntos, monedas o logros. El tiempo es la
única moneda de este lugar. Ver `src/lib/room/objectEvolution.ts`.

**La luz es una sola verdad continua.**
No hay temas de día/noche que se togglean: hay una curva continua
(`src/lib/light/lightEngine.ts`) que calcula cuánto pesa la ventana fría
y cuánto la lámpara cálida en cada momento. Todo lo demás — colores,
opacidades, transiciones de 60 segundos — se deriva de ese único
cálculo. Un lugar no cambia de golpe; deriva.

**La perfección se rompe a propósito, nunca al azar.**
Sombras menos matemáticas, luz menos uniforme, ciclos de respiración
desfasados entre sí, un grano casi invisible sobre el fondo — nada de
esto es aleatorio en tiempo de ejecución. Son variaciones fijas,
deliberadas, que existen para que la habitación deje de sentirse como
una interfaz renderizada.

**La habitación es contexto. El escritorio es acción.**
La habitación (`src/components/room/`) cambia lentamente y acompaña.
El escritorio (`src/features/workspace/Workspace.tsx`) cambia todo el
tiempo y es donde se trabaja: Nota, Misión, Memoria, Biblioteca,
Reflexión, Objetos persistentes. Nunca deben competir. El Workspace no
importa nada de la habitación ni de la luz — la habitación solo lo
ilumina a través de variables CSS ya globales (`--window-opacity`,
`--lamp-opacity`), nunca al revés y nunca por código.

**Regla del mundo físico.**
Todo efecto visual debe poder responder: "¿existe algo parecido en una
habitación real?" Luz, sombra, papel, cristal, madera, tela, polvo,
desgaste, profundidad, reflejos suaves — sí. Neones, partículas
mágicas, explosiones, confeti, barras de XP, destellos llamativos — no.
Si la respuesta es no, el efecto no pertenece a este proyecto, sin
excepción (ver `src/lib/world/worldRules.ts`).

**Los objetos son habitantes, no componentes.**
Todo objeto futuro debe poder responder dos preguntas: ¿por qué
apareció? y ¿qué historia cuenta? Si no puede responder ambas, no debe
existir. Por eso `reason` y `story` son campos obligatorios en
`RoomObjectDefinition` (`src/types/roomObject.ts`) — la regla está
en el tipo, no solo en este documento.

**Las notas encontradas no notifican, esperan.**
Cuando Memoria Viva exista, lo que resurfacee no debe aparecer como un
popup ni como notificación. Debe sentirse como una pequeña hoja doblada,
olvidada sobre el escritorio, que el usuario encuentra por su cuenta.
No aparece: se encuentra. No notifica: espera.

**No diseñamos interfaces. Diseñamos lugares.**
No diseñamos componentes. Diseñamos objetos. No diseñamos usuarios.
Diseñamos relaciones de largo plazo entre una persona y el lugar donde
organiza su vida. Antes de agregar algo, la pregunta no es "¿qué
funcionalidad falta?" sino "¿qué objeto, con qué historia, merece vivir
acá?".

**Nada cambia sin evidencia.**
Si una marca existe, existe una causa. Si un objeto cambia, existe una
historia detrás — nunca decoración (ver `src/lib/world/worldRules.ts`).
Esta regla ya no es solo de los objetos: el escritorio mismo empieza a
heredarla. No solo lo que está sobre la mesa envejece — la mesa
también podrá recordar, muy tenue, dónde descansó algo durante mucho
tiempo (`src/types/deskMemory.ts`). Hoy no hay ninguna marca todavía,
porque el tiempo real todavía no pasó — y eso es correcto.

**El lugar tiene peso, no efectos.**
Nada flota: todo lo que se ve debe sentirse apoyado, con una sombra que
diga "esto descansa acá" y nunca "esto es una tarjeta de interfaz
suspendida en el aire". La superficie del escritorio nunca se dibuja
explícitamente — se siente por la profundidad, el contraste y la
sombra, nunca por una ilustración de madera o tela. El movimiento sigue
la misma regla: inclinar, asentarse, responder a la luz — nunca
rebotar ni escalar como un botón.

**Mobile First. Desktop Power.**
El teléfono es el compañero diario: es donde este lugar se visita todas
las mañanas, y toda decisión nueva se piensa primero ahí — alcance del
pulgar, velocidad para escribir una Nota, tipografía legible con una
mano. El desktop no es una copia agrandada: es donde se hace trabajo
profundo, con más aire, más calma, más profundidad — nunca más ruido
ni más complejidad de la que ya existe en mobile. Toda decisión futura
de diseño o ingeniería debe poder responder primero desde un teléfono.

## Cómo usar esto

Si estás por agregar algo y no estás seguro de si pertenece acá,
pregúntate: ¿esto hace que el lugar se sienta más vivido, o es una
funcionalidad de producto disfrazada de habitación? Si es lo segundo,
probablemente no va acá todavía — o va, pero como arquitectura
preparada y apagada, no como feature encendida.

No estamos persiguiendo belleza. Estamos persiguiendo pertenencia.
