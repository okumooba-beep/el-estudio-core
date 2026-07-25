# LIBRO 01 — La Biblia del Estudio

No estamos construyendo una aplicación.
No estamos construyendo un dashboard.
No estamos construyendo un sistema operativo personal.
No estamos construyendo un organizador.

Estamos construyendo un Estudio.

El lugar al que una persona vuelve cada día para construir su vida.

Este documento no describe funciones. Describe un mundo. Todo lo que
se construya después — cada componente, cada línea de CSS, cada
decisión de producto — debe poder responderle a este documento, nunca
al revés. Si algún día una implementación lo contradice, la
implementación está equivocada. No este documento.

---

## 01 — ¿Qué es el Estudio?

El Estudio es el único lugar donde una persona puede ver su propia
vida sin que se la estén vendiendo, midiendo o gamificando.

No es una herramienta que se usa. Es un sitio que se habita. La
diferencia no es semántica: una herramienta se elige cada vez que hace
falta y se guarda cuando no; un lugar sigue existiendo aunque nadie lo
mire, y por eso, cuando alguien vuelve, no lo "abre" — regresa.

Existe porque una vida entera no cabe en una lista de tareas. Cabe en
un lugar con memoria: donde lo que escribiste ayer sigue ahí, donde un
objeto se gastó un poco porque lo tocaste mil veces, donde la luz de
las cinco de la tarde se ve distinta a la de las diez de la noche
porque así es de verdad, no porque un tema de color lo decidió.

Una persona vuelve al Estudio por la misma razón por la que vuelve a
su escritorio real: porque ya es suyo. No porque el sistema se lo
recuerde, no porque haya una racha que mantener, no porque haya algo
nuevo que ver. Vuelve porque dejó algo ahí y el lugar lo conservó.

Lo que distingue al Estudio de una aplicación no es el diseño. Es la
ausencia. Una aplicación se anuncia: pide permisos, muestra
onboarding, celebra tus logros, te notifica cuando no estás. El
Estudio no hace nada de eso. Nunca compite por tu atención — la
espera.

## 02 — Leyes del Mundo

El estudio ya existe. El usuario simplemente entra.

El tiempo deja evidencia.

Nada aparece sin una razón.

Nada permanece sin un propósito.

Los objetos no se desbloquean. Se descubren.

La IA nunca enseña. La IA recuerda.

El silencio es una decisión, no un vacío por completar.

La luz siempre cuenta la hora — nunca miente, nunca se apaga porque
sí, nunca se enciende porque el usuario llegó.

El estudio nunca intenta llamar la atención. Si algo brilla, es
porque el sol le pega distinto a esa hora — nunca porque el sistema
quiere que lo mires.

La habitación nunca cambia de lugar.

La luz nunca cambia bruscamente.

Todo efecto visual debe existir en una habitación real, o no
pertenece.

Los objetos nunca aparecen por recompensas.

Todo objeto tiene una historia.

Nada cambia sin evidencia: si una marca existe, existe una causa.

Estas leyes ya viven, en parte, en el código
(`src/lib/world/worldRules.ts`). Las que todavía no están escritas ahí
— el silencio como decisión, la luz que cuenta la hora, el estudio que
nunca busca atención — quedan documentadas acá primero. Este libro es
donde las leyes nacen. El código es donde después se cumplen.

## 03 — Materiales

Un lugar se reconoce por lo que está hecho, no por lo que dice. Estos
son los materiales que existen en el Estudio — no para programarlos
pixel por pixel, sino para que ninguna decisión futura los traicione
sin darse cuenta.

Existen: papel, madera, cuero, tela, latón, cerámica, grafito, luz,
sombra, aire.

Son materiales que envejecen bien. Que se manchan, se gastan, se
suavizan con el uso, y por eso se ven mejor con el tiempo, nunca peor.
Ninguno necesita brillar para importar.

Nunca existirán: plástico brillante, vidrio futurista, neones,
cromados, gradientes tecnológicos, cristales flotantes.

Son materiales que no envejecen — se rayan, se ven baratos, o
simplemente no tienen edad porque fingen ser perfectos para siempre.
Un lugar hecho de esos materiales no puede tener historia, porque nada
en ellos está autorizado a cambiar.

## 04 — Los Objetos

No son componentes. Son compañeros. Cada uno debe poder responder por
qué existe, qué historia cuenta, cómo envejece y qué siente el usuario
cuando lo encuentra. Si un objeto no puede responder las cuatro, no
tiene lugar en el Estudio.

**La libreta.**
Existe porque alguien tiene que sostener lo que se escribe cuando
todavía no sabe en qué se va a convertir. Cuenta la historia de que no
se desbloqueó ni se ganó: estaba sobre el escritorio antes de que el
usuario abriera la aplicación por primera vez. Envejece por las manos:
el cuero se afina en la esquina que más se toca, la costura se afloja
un poco cada año, el elástico pierde tensión de tanto abrirla y
cerrarla. Encontrarla se siente como reconocer algo propio que
llevabas tiempo sin mirar — nunca como recibir un objeto nuevo.

**La lámpara.**
Existe porque un estudio real nunca depende de un interruptor que el
usuario tiene que accionar: la luz cálida ya está encendida cuando
llegás, como si llevara toda la tarde ahí. Cuenta la historia de todas
las noches que acompañó sin que nadie se lo pidiera. Envejece en su
carácter, no en su forma: con los años, su luz podría temblar apenas,
como una llama vieja que ya no es perfectamente estable, nunca de
forma que se note conscientemente. Sentirla encendida es sentir que
todavía hay tiempo para volver a esto hoy.

**La taza.**
Existe para acompañar el trabajo, nunca para medirlo — no cuenta
tazas de café, no lleva una racha. Cuenta la historia de las horas
largas sentado ahí. Envejece dejando una marca tenue en la madera del
escritorio, un anillo que se nota solo si uno sabe mirarlo, y con los
años una leve mella en el borde. Encontrarla se siente como la prueba
silenciosa de que alguien trabaja ahí de verdad, no como un logro que
desbloqueaste.

**La planta.**
Existe porque el Estudio necesita algo vivo, no solo objetos que
esperan. Cuenta la historia de cuánto tiempo real pasó desde la
última visita — sin decirlo, sin un contador, sin una notificación
de "che, no volviste". Envejece creciendo muy lento cuando hay
constancia, y marchitándose apenas, nunca de golpe ni de forma
punitiva, cuando pasa mucho tiempo sin que nadie vuelva. Encontrarla
distinta se siente como el Estudio notando tu ausencia sin
reprochártela — nunca como una barra de progreso que bajó.

**El lápiz.**
Existe apoyado sobre el escritorio, listo, sin punta que se gaste
nunca del todo — porque el Estudio nunca debe ponerle una fricción
artificial a la idea de escribir. Cuenta la historia de que escribir
acá siempre fue posible, incluso antes de que llegaras. Envejece en
la madera, no en la utilidad: con los años, el barniz se opaca un
poco donde siempre se lo sostiene. Encontrarlo se siente como una
invitación silenciosa, nunca como una herramienta que hay que
"equipar" primero.

**El reloj.**
Existe para contar el tiempo real, nunca el tiempo de la sesión —
nunca un cronómetro de productividad. Cuenta la historia de que sigue
andando exista o no exista alguien mirándolo. Envejece en su sonido:
un tic que, con los años, podría volverse un poquito menos regular,
casi imperceptible, nunca lo suficiente como para notarse a
propósito. Sentirlo andar se siente como aterrizar en la hora que es
de verdad, no en la hora que a una app le conviene que sea.

**La biblioteca.**
Existe para guardar lo que el usuario mismo decidió que valía la pena
recordar — nunca contenido externo, nunca lecturas sugeridas por un
algoritmo. Cuenta la historia de una idea a la vez: nunca se llena de
golpe. Envejece con los lomos: el sol les va sacando color de a poco,
como a cualquier libro real que pasó años en la misma repisa.
Encontrarla llena, con el tiempo, se siente como reconocer el propio
criterio — "esto lo construí yo", nunca "esto me lo recomendaron".

**El mapa.**
Existe para ubicar dónde está una persona dentro de su propio
recorrido — nunca como un GPS, nunca como un dashboard de métricas
por cumplir. Cuenta la historia de los caminos que ya se anduvieron,
no de los objetivos que faltan tachar. Envejece amarillándose y
marcándose en los pliegues de tanto consultarlo. Encontrarlo se
siente como dar un paso atrás para ver el conjunto — nunca como
ansiedad por cuánto falta.

## 05 — El Tiempo

El tiempo nunca recompensa. Nunca castiga. Nunca felicita. Nunca
juzga.

El tiempo solamente deja pequeñas evidencias: una esquina más clara,
una costura más floja, un lomo más pálido, una marca de café que
antes no estaba. Nunca un mensaje que diga "llevás siete días
seguidos". El Estudio no lleva la cuenta de tu constancia — conserva
lo que tu constancia dejó atrás, que es una cosa completamente
distinta.

## 06 — El Sonido

No existen sonidos de interfaz. No hay click, no hay ding, no hay
success, no hay notification. Ninguno de esos sonidos pertenece a un
lugar real, y el Estudio es, ante todo, un lugar real.

El paisaje sonoro del Estudio se parece más al silencio de una
habitación habitada que a la respuesta de un sistema. Una hoja que se
mueve apenas. El cuero de la libreta al abrirse un poco. Un lápiz que
se apoya sobre la madera. Una silla que se acomoda. El viento muy
suave contra una ventana. Lluvia lejana, no la de encima. Un reloj
antiguo, discreto, que uno escucha solo si se queda quieto a
propósito.

Nada de esto se implementa todavía — esto es la filosofía, no el
componente. Pero cualquier sonido que se agregue en el futuro tiene
que responder primero a una pregunta: ¿esto es el silencio de un
lugar real, o es una interfaz avisando que hizo algo? Si es lo
segundo, no pertenece.

## 07 — La Luz

La luz no ilumina la interfaz. Ilumina el estudio.

Responde al tiempo real del día — eso ya existe
(`src/lib/light/lightEngine.ts`): una sola curva continua, nunca un
interruptor entre "modo día" y "modo noche". Con el tiempo debería
responder también a las estaciones, no solo a la hora, y a la
atmósfera del lugar — un día nublado se siente distinto a uno
despejado, aunque sea la misma hora. Eso todavía no existe: queda
anotado acá como dirección, no como tarea pendiente de sprint.

Lo que la luz nunca hace es responder al usuario. No se enciende
porque alguien abrió la aplicación. No cambia de humor porque
completaste algo. Es la hora que la mueve, nunca la persona.

## 08 — Los Olores

Si el Estudio existiera de verdad, olería a papel viejo y a cuero
tibio. A grafito recién usado. Al polvo cálido que levanta una lámpara
encendida hace rato. A madera con un poco de barniz. De fondo, muy
lejos, a lluvia — nunca a la lluvia de encima, siempre a la de otro
lado de la ventana.

Nunca olería a plástico nuevo, ni a nada "limpio" en el sentido en que
lo está un local recién inaugurado. Un lugar que huele a nuevo es un
lugar que todavía no fue vivido.

Esta pregunta no tiene una respuesta técnica y nunca la va a tener —
el Estudio no puede oler a nada, literalmente. Pero obliga a diseñar
distinto: cada textura, cada sombra, cada sonido que se agregue de acá
en adelante debería poder pertenecer al mismo lugar que huele a esto.
Si algo no encaja con este olor imaginado, probablemente tampoco
encaja con el resto.

## 09 — La Temperatura

La temperatura emocional del Estudio nunca es fría. Nunca es
tecnológica. Nunca es artificial.

Se siente tranquila. Se siente como un refugio: el lugar al que uno
va cuando el resto del día fue demasiado, no un lugar más que exige
algo. Ninguna decisión de diseño, por pequeña que sea, debería subirle
la temperatura al usuario. Si una pantalla nueva genera urgencia,
ansiedad o la sensación de estar siendo evaluado, no importa cuán útil
sea — está mal, y hay que rehacerla.

## 10 — La Voz

No es la voz de la IA. Es la voz del Estudio — la IA es apenas una de
sus facultades, la memoria; el Estudio habla con mucho más que eso: con
la luz, con los objetos, con lo que decide no decir.

Guarda silencio la mayoría del tiempo. Un lugar habitado no comenta
todo lo que ve, y el silencio ya está protegido en código
(`src/lib/voice/voiceEngine.ts`, `src/lib/phrases/phraseEngine.ts`) como
el estado más frecuente, no como una ausencia por resolver.

Recuerda cuando trae de vuelta algo que la propia persona ya escribió
o ya vivió — nunca un consejo generado, nunca una sugerencia sobre lo
que debería hacer. La IA nunca enseña. La IA recuerda.

Acompaña sin hablar: a través de la luz que ya está encendida, del
objeto que ya está ahí, de la hoja que sigue apoyada sobre el
escritorio. La compañía del Estudio casi nunca necesita palabras.

No dice absolutamente nada casi siempre. Ese es el estado por
defecto, no la excepción — y es exactamente lo que lo distingue de una
aplicación, que siempre tiene algo para mostrarte.

## 11 — Las Cosas que Nunca Existirán

Badges. XP. Niveles. Insignias. Confeti. Celebraciones. Barras de
progreso llamativas. Notificaciones invasivas. Gamificación. Coach
motivacional. Comparaciones sociales. Tablas de clasificación.

Todo aquello que rompa la calma.

No porque sean ideas ingenuas — porque todas parten de la misma
premisa equivocada: que una persona vuelve a un lugar porque el lugar
la premia. En el Estudio, una persona vuelve porque el lugar la
recuerda. Son dos mundos distintos, y esta lista es la frontera entre
ellos.

## 12 — El Propósito

Existo porque una vida no se organiza en una lista de pendientes.

No te apuro. No te felicito. No llevo la cuenta de cuántos días
seguidos volviste, porque no es una carrera y nunca lo fue.

Estaba acá antes de que llegaras la primera vez, y voy a seguir
estando cuando cierres la puerta esta noche. No desaparezco cuando no
me mirás — sigo siendo el mismo lugar, con la misma luz que le
corresponde a esta hora, con tu libreta en el mismo lugar donde la
dejaste.

No te voy a decir qué hacer con tu vida. Eso no me corresponde. Lo
único que hago es guardar lo que vos ya decidiste, y devolvértelo
cuando lo necesites encontrar de nuevo.

Existo para que tengas un lugar al que volver que no te pida nada a
cambio, salvo que vuelvas.
