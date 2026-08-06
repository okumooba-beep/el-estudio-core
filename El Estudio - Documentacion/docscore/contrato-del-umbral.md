# CONTRATO DEL UMBRAL

**Documento de arquitectura — El Estudio Core**
Versión 1.1 · Cimiento de todos los módulos

> El Umbral no es un campo de texto. Es la puerta de entrada al Estudio.
> Toda información nace aquí, y desde aquí encuentra su lugar sin interrumpir
> el pensamiento del usuario.

---

## 0. Propósito

El Umbral es el sistema nervioso de El Estudio. Todo entra por acá: tareas, gastos, ideas, reflexiones, operaciones, asuntos abiertos.

Este documento define **qué es una captura, qué es un destino, cómo se calcula la confianza y qué ocurre cuando el sistema no puede decidir**. Es un contrato, no una guía de estilo: si un módulo no lo cumple, no puede ser un destino.

Regla que ordena todo el documento:

> El Umbral no necesita ser inteligente. Necesita ser confiable.
> La inteligencia crece con el tiempo. La confianza no se negocia.

---

## 1. Principios innegociables

1. **El texto original nunca se modifica.** Es la fuente de verdad. Los destinos reciben una *proyección* del texto, jamás su propiedad.
2. **Nada se mueve con confianza baja.** Ante la duda, la captura se queda en el Umbral.
3. **El silencio nunca es consentimiento.** Una propuesta ignorada no se auto-asigna. Nunca.
4. **Toda asignación es reversible.** Siempre, sin pérdida de información, en cualquier momento.
5. **Ninguna decisión bloquea la captura.** Nunca aparece un modal entre el pensamiento y el registro.
6. **Un error silencioso cuesta más que una pregunta.** Preferimos preguntar una vez.

---

## 2. La Captura

Unidad atómica del sistema. Todo lo que existe en El Estudio nació como una Captura.

**Nota de vocabulario.** `Captura` es el nombre *arquitectónico*. La interfaz no lo usa nunca — y de hecho no usa ningún sustantivo: el Umbral no dice "3 capturas sin destino", muestra tres hojas. La mejor palabra de interfaz para esto es ninguna. En el código conviene alinear `Idea` (hoy en `src/types/idea.ts`) con este nombre, porque `Idea` deja de describir el objeto en cuanto lo que capturás es un gasto o un PDF.

```
Captura {
  id              : uuid
  contenido       : Contenido     // inmutable, para siempre
  creado_en       : timestamp
  estado          : EstadoCaptura
  destino         : DestinoId | null
  contexto        : ContextoId[]  // 0..n, ortogonal al destino
  confianza       : float 0..1
  señales         : Señal[]       // por qué se propuso ese destino
  payload         : object | null // datos estructurados extraídos
  completa        : boolean
  historial       : Evento[]      // auditoría de cada cambio
}
```

### El contenido no siempre es texto

```
Contenido =
  | { tipo: 'texto'  , texto: string }
  | { tipo: 'voz'    , audio: Blob, transcripcion: string | null }
  | { tipo: 'imagen' , imagen: Blob, texto_extraido: string | null }
  | { tipo: 'archivo', archivo: Blob, nombre: string, texto_extraido: string | null }
  | { tipo: 'enlace' , url: string, titulo: string | null }
```

**En Core solo existe `texto`.** Las demás variantes no se implementan. Pero el tipo se declara completo desde ahora, porque el costo hoy es cero y el costo de agregarlo después es reescribir el contrato entero.

Regla que se desprende sola: **una modalidad sin texto disponible no tiene señales, y sin señales la confianza es baja.** Una foto recién sacada se queda en el Umbral hasta que exista OCR. No es un caso especial — es la regla general aplicada.

### El contenido es inmutable

Esta es la decisión más importante del documento. Permite reclasificar cualquier captura, en cualquier momento, sin pérdida — y es lo que hace que North Star 333 pueda cambiar la representación sin tocar los datos.

Excepción única y explícita: `transcripcion` y `texto_extraido` se escriben **una sola vez**, cuando el procesamiento termina. Nunca se reescriben. El original (`audio`, `imagen`, `archivo`) no se toca jamás.

**`historial` se escribe desde el día uno.** Cada corrección del usuario queda registrada. Hoy sirve para auditar; mañana es el conjunto de entrenamiento y evaluación de la IA. No cuesta nada ahora y vale mucho después.

---

## 3. Dos ejes distintos: Destino y Contexto

En los diseños actuales de la Work Table, *Contexto* y *Destino* se están mezclando. Aparecen columnas donde `FINANZAS` es contexto y `Finanzas` es destino, y donde `Okumo`, `Agenda` e `Ideas` figuran como destinos aunque no son módulos de Core.

Eso genera exactamente la migración conceptual que querés evitar. La corrección:

| | **Destino** | **Contexto** |
|---|---|---|
| Qué responde | ¿Qué Espacio se hace cargo? | ¿A qué área de tu vida pertenece? |
| Quién lo define | El sistema (cerrado) | El usuario (abierto) |
| Cuántos hay | Exactamente 7 | Los que hagan falta |
| Cardinalidad | Uno solo | Cero o varios |
| Cuándo crece | Casi nunca | Todo el tiempo |

**Destino = Espacio. Estrictamente.** Hay siete destinos porque hay siete Espacios. Todo lo demás es contexto.

Reescritura de los ejemplos actuales:

| Texto | Destino | Contexto |
|---|---|---|
| Necesito cambiar el aceite del Jeep | Misiones | Auto |
| Gasté $35.000 ayer | Finanzas | — |
| Editar el video de Okumo | Misiones | Okumo |
| Depositar dinero a mi madre | Misiones | Personal |
| Tengo una idea para NODO | Biblioteca | Nodo |
| Esperando la transferencia del cliente | Asuntos | Okumo |

El beneficio es concreto: **abrir un negocio nuevo no requiere un módulo nuevo.** Se crea un contexto y listo. Los destinos permanecen estables mientras tu vida cambia.

---

## 4. Los siete Destinos

| Destino | Recibe | No recibe |
|---|---|---|
| **Misiones** | Acciones concretas que dependen de vos | Cosas que dependen de terceros |
| **Asuntos** | Situaciones abiertas en espera de un tercero | Acciones ejecutables ahora |
| **Cuaderno** | Pensamiento en desarrollo, reflexión | Datos, cifras, tareas |
| **Finanzas** | Movimientos de dinero ya ocurridos | Intenciones de gasto futuro |
| **Hábitos** | Marcas de consistencia recurrente | Acciones únicas |
| **Biblioteca** | Ideas, aprendizajes, referencias sin acción | Cualquier cosa que requiera acción |
| **Trading** | Operaciones de mercado y su expediente | Movimientos financieros comunes |

**El Umbral no es un destino.** Es el estado previo. Una captura "en el Umbral" no está mal clasificada: está esperando.

La distinción más difícil y la que más importa acertar es **Misiones vs Asuntos**. La pregunta que las separa: *¿podés empezarlo vos ahora mismo?* Si sí, Misión. Si dependés de que otro haga algo, Asunto.

---

## 5. El contrato que todo Destino debe implementar

```
interface Destino {
  id: DestinoId
  nombre: string

  // Puntúa una captura. Devuelve 0 si no le corresponde.
  evaluar(contenido) -> { puntuación: 0..1, señales: Señal[] }

  // Extrae los datos estructurados que este destino necesita.
  proyectar(contenido) -> payload

  // Declara qué falta para que la captura esté completa.
  validar(payload) -> { completa: boolean, faltantes: Campo[] }

  // Devuelve la captura al Umbral sin residuos.
  liberar(captura) -> void

  campos_requeridos : Campo[]
  campos_opcionales : Campo[]
}
```

Cuatro consecuencias de este contrato:

- Agregar un módulo nuevo es **implementar esta interfaz**. Nada más. No se toca el Umbral.
- `liberar()` es obligatoria. Si un destino no sabe devolver una captura limpiamente, la reversibilidad se rompe.
- `evaluar()` no conoce a los otros destinos. Puntúa solo. El Umbral compara.
- Cuando llegue la IA, será **un evaluador más** que implementa la misma interfaz. El contrato no cambia. Ese es el punto.

### Dónde se registran los destinos

El Umbral **no importa ningún destino**. Recorre un registro:

```
class DestinoRegistry {
  register(destino: Destino): void
  all(): readonly Destino[]
}
```

`app/shell` registra los siete destinos en el momento de composición, igual que ya hace con `ProviderRegistry` para los proveedores de clasificación. El Umbral conoce la *interfaz*, nunca las implementaciones.

**Por qué un registro y no un event bus.** Un bus es fire-and-forget: `emit()` devuelve `void` y no hay forma de recolectar respuestas sin convertirlo en RPC. Pero el problema real es otro: **emitir sin suscriptores no deja rastro**. Si un destino no se registra por un error de composición, el Umbral clasificaría con menos evaluadores y nunca se enteraría — errores silenciosos, exactamente lo que el documento entero existe para evitar. Con un registro podés afirmar `all().length === 7` y fallar ruidosamente si no.

Además, la detección de conflictos (§6, regla 3) necesita **todas las puntuaciones a la vez** para saber si hubo empate. Eso es una comparación, no una reacción.

El desacoplamiento que un bus daría, el registro ya lo da. Lo que el bus sacrificaría —determinismo, testeo, y saber que faltó alguien— no es negociable acá.

---

## 6. Señales y cálculo de confianza

La confianza no es un número mágico: se deriva de **cuántas señales independientes coinciden y qué tan fuertes son**.

### Tipos de señal

| Tipo | Peso | Ejemplo |
|---|---|---|
| **Estructural** | Alto | Un monto (`$150.000`), una fecha, un ticker, un horario |
| **Sintáctica** | Medio-alto | Infinitivo inicial → Misiones · Pretérito en 1ª persona → Finanzas · Interrogación o "siento que" → Cuaderno |
| **Léxica** | Medio | Verbos y sustantivos del léxico de cada destino |
| **Histórica** | Variable | El usuario ya corrigió capturas parecidas hacia otro destino |

### Reglas de composición

```
1. base           = puntuación de la señal más fuerte
2. convergencia   = +0.15 por cada señal adicional que apunta al mismo destino
3. conflicto      = si dos destinos superan 0.5, la confianza se limita a MEDIA
4. corrección     = una corrección previa del usuario sobre un patrón idéntico
                    sobrescribe el resultado
5. piso           = si ningún destino supera 0.35 → BAJA, sin propuesta
```

**La regla 3 es la más importante.** Un conflicto nunca resuelve en alta, por muy fuerte que sea el ganador. "Pagué el gimnasio" dispara Finanzas *y* podría cerrar un Hábito: eso se pregunta, no se adivina.

### Umbrales

| Confianza | Rango | Comportamiento |
|---|---|---|
| Alta | ≥ 0.85 | Asignación automática |
| Media | 0.35 – 0.85 | Propuesta visible, sin mover nada |
| Baja | < 0.35 | Permanece en el Umbral, sin propuesta |

Estos tres números son la única perilla del sistema. Ajustarlos es ajustar el carácter del Umbral: subirlos lo vuelve más prudente y más silencioso; bajarlos lo vuelve más audaz y más propenso a molestar. Empezá **prudente**. Es más fácil ganarse la confianza que recuperarla.

---

## 7. Los tres comportamientos

### Confianza alta → asignación silenciosa

La captura se asigna sola. Aparece con la etiqueta `AUTO` y su destino visible.

- Sin modal. Sin confirmación. Sin interrupción.
- La etiqueta `AUTO` es la manera del sistema de decir *"esto lo decidí yo"* — hace la decisión auditable de un vistazo.
- Reversible siempre: tocar el destino lo cambia.

### Confianza media → propuesta adjunta

La captura **se queda en el Umbral** con una propuesta inline:

```
Gasté plata en el súper
  ¿Finanzas?   Confirmar · Cambiar destino
```

- La propuesta está *adjunta a la captura*, no es un diálogo que interrumpe.
- Si el usuario la ignora, **no pasa nada**. La captura sigue en el Umbral, indefinidamente.
- Si el conflicto fue entre dos destinos, la propuesta ofrece **los dos**, no solo el ganador.

### Confianza baja → silencio

La captura queda en el Umbral, sin propuesta, sin etiqueta, sin ruido. El sistema no dice nada porque no tiene nada que decir.

Esto no es un fallo: es el comportamiento correcto. Un Umbral con capturas sin clasificar es un Umbral honesto.

---

## 8. Máquina de estados

```
                    ┌──────────────┐
   captura ───────► │  EN_UMBRAL   │ ◄──── liberar()
                    └──────┬───────┘
                           │ evaluar()
              ┌────────────┼────────────┐
           baja          media         alta
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │EN_UMBRAL │ │PROPUESTA │ │ASIGNADA  │
        │(silencio)│ │(en Umbral)│ │  (AUTO) │
        └──────────┘ └────┬─────┘ └────┬─────┘
                          │ confirmar  │
                          └────────────┤
                                       ▼
                              ┌─────────────────┐
                              │  EN_DESTINO     │
                              │ completa / no   │
                              └────────┬────────┘
                                       │ el módulo la cierra
                                       ▼
                                 ┌──────────┐
                                 │ CERRADA  │
                                 └──────────┘
```

Transiciones prohibidas:

- `EN_UMBRAL (baja)` → `ASIGNADA` sin acción del usuario. **Nunca.**
- `PROPUESTA` → `ASIGNADA` por expiración de tiempo. **Nunca.**
- Cualquier estado → borrado. Nada se borra: las cosas se cierran o se archivan.

---

## 9. Reglas v1 — tabla concreta

Determinista, sin IA. Español rioplatense.

| Destino | Señales estructurales | Señales sintácticas | Léxico |
|---|---|---|---|
| **Finanzas** | Monto con `$` o "pesos"/"dólares" | Pretérito 1ª pers. | gasté, pagué, compré, cobré, transferí, deposité, me salió, salió |
| **Misiones** | — | Infinitivo inicial · "tengo que" · "necesito" | llamar, comprar, enviar, terminar, arreglar, cambiar, revisar, mandar |
| **Asuntos** | — | Gerundio de espera | esperando, pendiente de, me tienen que, quedó en, a la espera, todavía no |
| **Trading** | Ticker · par de divisas · precio de entrada | — | long, short, entrada, stop, take profit, cerré la operación, apalancamiento |
| **Hábitos** | Marca temporal recurrente | — | medité, entrené, leí, dormí, corrí (+ frecuencia declarada) |
| **Cuaderno** | — | Interrogación · 1ª pers. reflexiva | siento que, creo que, me pregunto, no entiendo por qué, estuve pensando |
| **Biblioteca** | URL · referencia bibliográfica | — | idea para, aprendí que, anotar que, guardar, referencia, concepto |

**Casos que deben resolver en MEDIA o BAJA** — son la prueba de fuego de la implementación:

| Texto | Por qué es ambiguo | Resultado esperado |
|---|---|---|
| Pagué el gimnasio | Finanzas + posible Hábito | Media, ofrece ambos |
| Tengo que hablar con el contador | Misión, pero depende de un tercero | Media, ofrece Misiones y Asuntos |
| El Jeep | Sin verbo, sin estructura | Baja, silencio |
| Cerré la operación en verde | Trading + Finanzas | Media, ofrece ambos |
| Comprar café | Misión, o gasto ya hecho | Media, prevalece Misiones (infinitivo) |
| Me quedé pensando en lo de ayer | Cuaderno, señal débil | Media |

---

## 10. Capturas incompletas

**Una captura puede llegar a su destino sin estar completa.** Esto es central para mantener el Umbral limpio.

> "Gasté plata en el súper" → Finanzas, **sin monto**.

La captura **va a Finanzas** marcada como incompleta. No vuelve al Umbral: el destino es correcto, solo faltan datos.

Cada módulo debe saber renderizar sus capturas incompletas. Finanzas las muestra sin monto y permite completarlo después. Misiones muestra misiones sin fecha. Trading muestra operaciones sin cierre.

La regla: **el Umbral resuelve *dónde*, el módulo resuelve *qué falta*.** Son dos preguntas distintas y no deben mezclarse.

---

## 11. Capturas que nunca encuentran destino

> *"Comprar un mejor escritorio."* Tres meses. Nunca la clasificaste. ¿Qué pasa?

**Nada. Y esa es la respuesta definitiva.**

No caducan. No se archivan solas. No se limpian. No hay recordatorio, no hay revisión semanal, no hay "tenés 47 capturas sin clasificar".

Tres razones:

1. **Una fecha de vencimiento es una deadline, y una deadline es presión.** Todo el producto existe para no ejercer presión.
2. **Una captura sin clasificar no es deuda.** Es un pensamiento que todavía no maduró. Que "comprar un mejor escritorio" siga ahí después de tres meses es *comportamiento correcto*: no estabas listo para decidir, y el sistema respetó eso.
3. **Archivar solo a los 90 días es el mismo pecado que asignar solo a los 9 segundos**, más lento. Ambos son el sistema decidiendo por vos porque no reaccionaste. El principio 3 no tiene fecha de expiración.

### Pero entonces el Umbral se vuelve un depósito

Sí — si el Umbral tuviera que ser puerta *y* bandeja a la vez. Ese es el error de encuadre que la pregunta expone.

La solución no es limitar cuántas capturas **existen**. Es limitar cuántas se **ven**:

- El Umbral muestra solo las últimas. El resto sigue viva, íntegra, intacta — simplemente no está sobre el escritorio.
- Existe una forma de ver la pila completa, pero **solo si vas a buscarla**. Abrirla es un acto deliberado, como ponerse a ordenar papeles.
- **Nunca un contador.** Un número al lado del Umbral convierte tu propio pensamiento en una bandeja de entrada con notificaciones. Un contador es presión disfrazada de información.

Esto ya está resuelto en el código: `DeskPaperStack` muestra un máximo de 3 hojas físicas mientras todas siguen vivas en IndexedDB, y su propio comentario declara *"nunca una fila, nunca un contador, nunca scroll"*. La política correcta ya estaba implementada antes de estar escrita.

**La regla, en una línea:** el Umbral limita la visibilidad, nunca la existencia.

---

## 12. Corrección y aprendizaje

Cuando el usuario cambia un destino:

1. Se registra en `historial`: texto, destino propuesto, destino elegido, señales que fallaron.
2. Se genera una **regla de corrección** para patrones idénticos.
3. La regla de corrección tiene prioridad sobre las reglas base (regla 4 de composición).

Esto le da a Core una forma primitiva pero real de aprendizaje sin IA: si corregís dos veces que "cargué nafta" va a Finanzas y no a Misiones, deja de equivocarse.

Y cuando llegue la IA, ese historial ya es tu set de evaluación. Vas a poder medir si el modelo mejora o empeora respecto de las reglas, en lugar de creerlo.

---

## 13. Fuera de alcance en v1

Explícitamente **no** entra en Core:

- Clasificación por IA (v2 — el contrato ya está listo para recibirla)
- Múltiples destinos para una misma captura
- Capturas de voz o imagen
- Reglas definidas por el usuario
- Sincronización entre dispositivos

---

## 14. Criterios de aceptación

El Contrato del Umbral está implementado cuando:

- [ ] Una captura nunca pierde su contenido original, pase lo que pase
- [ ] Una captura sin destino sigue intacta después de tres meses, sin haber sido tocada ni contada
- [ ] Ninguna captura con confianza baja cambia de lugar sin acción del usuario
- [ ] Una propuesta ignorada durante una semana sigue siendo una propuesta
- [ ] Todo destino puede devolver una captura al Umbral sin residuos
- [ ] Los seis casos ambiguos de la sección 9 resuelven en media o baja
- [ ] Cada corrección queda registrada en el historial
- [ ] Agregar un octavo destino es registrarlo en `app/shell`, sin modificar ni una línea del Umbral
- [ ] El sistema falla ruidosamente si un destino no se registró
- [ ] Capturar un pensamiento no dispara ningún modal, nunca

Ese último punto es el que hay que defender con más terquedad. Todo lo demás es arquitectura; ese es el producto.
