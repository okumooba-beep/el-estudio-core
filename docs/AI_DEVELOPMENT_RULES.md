# AI DEVELOPMENT RULES

## Propósito

Estas reglas son permanentes.

No describen un sprint.

Describen cómo cualquier IA debe trabajar dentro del proyecto El Estudio.

Siempre deben respetarse.

---

# 1. Filosofía

El Estudio NO es una aplicación.

Es un lugar.

Toda decisión debe reforzar esa idea.

Antes de implementar cualquier cambio preguntarse:

> "¿Hace que El Estudio sea un lugar más habitable?"

Si la respuesta es no, no implementar ese cambio.

---

# 2. Consumo de tokens

El proyecto prioriza el menor consumo posible de contexto.

Antes de analizar código:

1. Consultar Graphify.
2. Usar únicamente:

   * graphify affected
   * graphify explain
   * graphify search (solo si hace falta)
3. Abrir únicamente los archivos necesarios.
4. Nunca recorrer el proyecto completo.
5. Nunca releer archivos que Graphify ya explica.

Si Graphify responde una pregunta, no abrir el archivo.

---

# 3. Alcance

Trabajar únicamente sobre el objetivo del sprint.

No hacer mejoras "ya que estamos".

No hacer limpieza general.

No hacer refactors globales.

No modificar módulos no relacionados.

---

# 4. Reutilización

Siempre reutilizar antes de crear.

Antes de crear:

* componente
* hook
* servicio
* helper
* animación
* estilo
* mueble

buscar si ya existe algo equivalente.

---

# 5. Arquitectura

No romper la arquitectura existente.

No introducir nuevas dependencias salvo que sean imprescindibles.

No duplicar lógica.

Mantener coherencia con el Furniture System.

---

# 6. Experiencia

Priorizar siempre:

Lugar > Pantallas

Muebles > Funciones

Presencia > Animaciones

Habitabilidad > Productividad

Reducir carga mental antes que agregar capacidades.

---

# 7. Diseño

No agregar:

* dashboards nuevos
* widgets
* badges
* gamificación
* banners
* tarjetas innecesarias
* métricas decorativas

Cada elemento debe justificar su existencia.

---

# 8. Implementación

Elegir siempre la solución que ofrezca:

* mayor impacto
* menor complejidad
* menos archivos modificados
* menos líneas modificadas
* mayor reutilización

---

# 9. Calidad

Antes de finalizar:

* verificar build
* verificar lint
* comprobar que no haya errores TypeScript
* confirmar que no se rompieron funcionalidades existentes

---

# 10. Entregable

Al finalizar cada sprint informar:

* archivos detectados por Graphify
* archivos modificados
* motivo de cada cambio
* limitaciones encontradas
* posibles siguientes pasos

No implementar esos siguientes pasos.

Solo sugerirlos.

---

# 11. Regla más importante

Cuando exista una decisión entre:

* agregar una nueva función

o

* hacer que El Estudio se sienta más vivo

Siempre gana la segunda opción.

# 12. Evolución incremental

Nunca intentar completar una visión completa en un único sprint.

Cada sprint debe:

- resolver un solo objetivo
- modificar el menor número posible de archivos
- aprovechar Graphify para limitar el alcance
- dejar build y lint limpios
- ser reversible
- servir como base para el siguiente sprint

Si una idea requiere múltiples etapas, implementar únicamente la primera etapa con mayor impacto y menor complejidad.

Siempre priorizar progreso constante sobre cambios masivos.

# 13. Regla del 80/20

En cada sprint, identificar primero el 20% de cambios que producirán el 80% del impacto.

Implementar únicamente esos cambios.

No perseguir perfección.

El Estudio crecerá mediante muchos pequeños sprints, no mediante grandes reescrituras.

---

# 14. Calidad de Entregables

Antes de entregar cualquier propuesta, diseño, prompt o implementación:

- Analizar internamente posibles mejoras.
- Integrarlas si aportan valor.
- Entregar una única versión consolidada.
- No presentar una primera versión para luego corregirla en el mismo mensaje.
- Explicar únicamente las decisiones de diseño tomadas y sus motivos.

El objetivo es reducir la carga cognitiva del usuario.

La IA debe asumir el trabajo de síntesis y decisión antes de entregar una respuesta.
