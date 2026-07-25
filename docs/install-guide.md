# Guía de instalación

Esta guía no es documentación técnica del proyecto — es la guía operativa
para instalar LifeOS de verdad en un teléfono y en desktop. Se actualiza
cuando cambie el proceso, no cuando cambie el código.

## Lo primero que hay que entender (si no leés nada más, leé esto)

Un navegador solo ofrece instalar una PWA de verdad — ícono real, modo
standalone, Service Worker, funcionamiento offline — cuando el sitio se
sirve por **HTTPS**, o por `localhost` en la misma máquina. Por diseño de
seguridad de Android y iOS, **una IP local por HTTP plano
(`http://192.168.x.x:puerto`) no cumple ese requisito.** El teléfono va a
poder *ver* la página, pero el navegador puede negarse a instalarla como
app real, o instalarla como un simple acceso directo sin Service Worker.

Por eso esta guía tiene dos caminos distintos:

- **Camino A — Probar hoy mismo** (recomendado para verificar esta
  implementación ahora): un túnel HTTPS temporal hacia tu propia
  computadora. Dura mientras la computadora esté prendida y el comando
  corriendo.
- **Camino B — Vivir ahí todos los días** (recomendado para el uso
  diario que pediste en la Implementación 05): subir la carpeta `dist/`
  a un hosting estático gratuito con HTTPS permanente. No depende de que
  tu computadora esté prendida.

Para *verificar* esta implementación alcanza con el Camino A. Para
*usarla todos los días*, vas a necesitar el Camino B tarde o temprano.

---

## Antes de empezar: generar la versión de producción

El servidor de desarrollo (`npm run dev`) **no** registra el Service
Worker — eso solo pasa en la build de producción. Para probar offline,
ícono, splash y modo standalone de verdad, siempre corré:

```bash
cd C:\Users\DELL\Documents\lifeos
npm run build
npm run preview -- --host
```

`--host` hace que el servidor escuche en todas las interfaces de red, no
solo en `localhost` — es lo que permite que el teléfono, en la misma
Wi-Fi, se conecte a tu computadora.

Vite va a imprimir algo como:

```
  ➜  Local:   http://localhost:4173/
  ➜  Network: http://192.168.1.5:4173/
```

Anotá la línea `Network:` — esa es la URL que usa el teléfono. (Tu IP
puede no ser exactamente `192.168.1.5`; usá la que Vite te imprima a vos
en ese momento.)

Si Windows te muestra un aviso del Firewall de Windows Defender la
primera vez ("¿Permitir que Node.js se comunique en redes privadas?"),
tenés que aceptarlo — si lo bloqueás, el teléfono no va a poder conectarse
aunque el comando esté corriendo.

---

## Camino A — Túnel HTTPS temporal (para probar hoy)

Esto te da una URL `https://algo.trycloudflare.com` o similar, que
apunta a tu `npm run preview` de recién, pero por HTTPS real. Con eso el
teléfono va a poder instalar la PWA de verdad, no un acceso directo.

Con `npm run preview -- --host` corriendo en una terminal, abrí **otra**
terminal y ejecutá:

```bash
npx --yes localtunnel --port 4173
```

Te va a dar una URL como `https://tame-lion-42.loca.lt`. Abrí esa URL
desde el teléfono. La primera vez, localtunnel muestra una página
intermedia pidiendo que confirmes ("Click to continue") — es normal,
tocá el botón y vas a llegar a LifeOS.

*(Si preferís no depender de localtunnel, la alternativa es instalar
`cloudflared` y correr `cloudflared tunnel --url http://localhost:4173`
— no pide cuenta, pero requiere instalar el programa primero.)*

Cuando cierres esa terminal, el túnel se cae — es temporal a propósito.

---

## Camino B — Hosting permanente (para el uso diario)

Cuando quieras que LifeOS esté disponible todos los días sin depender de
tu computadora prendida, la forma más simple sin necesitar cuenta previa
ni Git:

1. Generá la build: `npm run build` (deja todo listo en la carpeta
   `dist/`).
2. Entrá a **https://app.netlify.com/drop** desde el navegador de tu
   computadora.
3. Arrastrá la carpeta `dist/` completa a esa página.
4. Netlify te da una URL `https://algo-al-azar.netlify.app` con HTTPS
   real y permanente, gratis.
5. Abrí esa URL desde el teléfono e instalá la PWA desde ahí — esa va a
   ser tu URL de todos los días.

Cada vez que quieras actualizar LifeOS ahí, repetís: `npm run build` →
arrastrar `dist/` de nuevo a la misma página de Netlify Drop (te deja
actualizar el mismo sitio). Esto no requiere que decidamos ahora una
estrategia de deploy definitiva — es la opción más simple para empezar a
vivir en el producto ya, sin bloquear nada a futuro.

---

## ANDROID — paso a paso

1. **Levantar el proyecto:**
   `npm run build` y después `npm run preview -- --host` (ver arriba).
2. **Conseguir la URL para el teléfono:** la línea `Network:` que Vite
   imprime en la terminal (Camino A: mejor pasarla por
   `npx localtunnel --port 4173` para tener HTTPS real).
3. **Acceder desde el teléfono:** abrí **Chrome** en Android y pegá la
   URL. Confirmá que ves la habitación, no un error de conexión.
4. **Instalar la PWA:**
   - Tocá los **tres puntos** (⋮) arriba a la derecha de Chrome.
   - Buscá la opción **"Instalar aplicación"** o **"Agregar a pantalla
     de inicio"**. Si Chrome detectó que es instalable, va a mostrar el
     nombre "LifeOS" y el ícono oscuro con el punto celeste.
   - Confirmá. Android la instala como una app real (WebAPK), no como
     un simple bookmark.
5. **Verificar que quedó instalada de verdad:**
   - Andá al cajón de aplicaciones (app drawer) del teléfono, no a
     Chrome — LifeOS debería aparecer ahí como una app más, con su
     propio ícono.
   - Abrila desde ahí. **No debería aparecer la barra de direcciones de
     Chrome ni los botones de navegador** — eso es el modo standalone
     funcionando.
   - En Ajustes → Aplicaciones, buscá "LifeOS": si aparece listada como
     app independiente (no como parte de Chrome), quedó instalada
     correctamente.

## IPHONE — paso a paso

En iOS, Safari **no tiene un botón de instalar automático** — instalar
una PWA es siempre manual, vía "Compartir". Esto es una limitación de
Apple, no de LifeOS.

1. **Levantar el proyecto y conseguir la URL:** igual que en Android
   (pasos 1 y 2 de arriba). Es indispensable usar el Camino A o B
   (HTTPS real) — Safari es todavía más estricto que Chrome con HTTP
   plano por IP local para instalar la PWA correctamente.
2. **Acceder desde el teléfono:** abrí **Safari** (tiene que ser Safari,
   no Chrome ni otro navegador — en iOS solo Safari puede instalar PWAs
   al Home Screen con Service Worker) y pegá la URL.
3. **Instalar la PWA:**
   - Tocá el ícono de **Compartir** (el cuadrado con la flecha hacia
     arriba), en la barra inferior de Safari.
   - Deslizá la lista de opciones hacia abajo y elegí **"Agregar a
     pantalla de inicio"** ("Add to Home Screen").
   - Vas a ver una vista previa con el ícono oscuro y el nombre
     "LifeOS" — confirmá tocando **"Agregar"** arriba a la derecha.
4. **Verificar que quedó instalada de verdad:**
   - Volvé a la pantalla principal del teléfono — el ícono de LifeOS
     debería estar ahí, junto a tus otras apps.
   - Abrilo tocando ese ícono (no desde Safari). Debería aparecer una
     pantalla de carga breve con el fondo oscuro del ícono (el splash
     que genera iOS automáticamente a partir del ícono y el color del
     manifest) y **sin la barra de direcciones ni los botones de
     Safari** — eso confirma el modo standalone.
   - Si volvés a abrir Safari y ves la misma URL en una pestaña normal,
     con barra de navegador visible, eso es Safari — no es la app
     instalada. Lo que verificás es siempre el ícono en la pantalla de
     inicio, nunca una pestaña de Safari.

## DESKTOP — Chrome y Edge

1. Abrí la URL (`http://localhost:4173` si estás en la misma
   computadora que corre `npm run preview`, o la URL de HTTPS si
   preferís probar igual que en el teléfono).
2. **Chrome:** en la barra de direcciones, a la derecha, aparece un
   ícono de instalar (una pantalla con una flecha hacia abajo). Si no lo
   ves, abrí el menú ⋮ → **"Instalar LifeOS..."**.
3. **Edge:** el mismo ícono aparece en la barra de direcciones, o desde
   el menú `···` → **"Apps"** → **"Instalar este sitio como una
   aplicación"**.
4. Confirmá. LifeOS se abre en su propia ventana, sin barra de
   direcciones, con su propio ícono en la barra de tareas / dock y en el
   menú de aplicaciones del sistema operativo.

---

## Verificaciones de configuración (ya hechas, quedan documentadas acá)

| Punto | Estado | Detalle |
|---|---|---|
| Manifest válido | ✓ | `id`, `scope`, `start_url`, `lang: 'es'`, `display: 'standalone'` — todos presentes y coherentes entre sí. |
| Service Worker registrado | ✓ | `registerSW.js` llama `navigator.serviceWorker.register('/sw.js', { scope: '/' })` en `window.load`. Verificado leyendo el archivo generado. |
| Scope / Start URL | ✓ | Ambos `/`, consistentes con que la app vive en la raíz del dominio. |
| Display | ✓ | `standalone`. |
| Theme Color | ✓ | Fijo en el manifest (`#100D0F`, para el splash del sistema) y además corregido en vivo por `applyLight.ts` según la hora real. |
| Maskable icons | ✓ | El círculo de la marca ocupa ~36% del ícono — muy por debajo del 80% que definen "zona segura", así que ningún launcher lo recorta mal. |
| Apple icons | ✓ | `apple-touch-icon.png` 180×180, cuadrado sin esquinas redondeadas propias (iOS aplica su propia máscara). |
| Offline | ✓ | Verificado con `vite preview`: el Service Worker precachea 10 archivos y tiene un `NavigationRoute` que sirve `index.html` para cualquier ruta sin conexión. |
| Cache | ✓ | `cleanupOutdatedCaches()` + `skipWaiting()` + `clientsClaim()` — las versiones viejas del Service Worker no quedan pisando la nueva. |
| Safe areas | ✓ | Arriba, abajo, izquierda y derecha (`env(safe-area-inset-*)`) en el contenido principal y en la barra inferior — cubre notch, isla dinámica y rotación. |
| Standalone | Pendiente de confirmación física | El código pide `display: standalone`; solo un teléfono real puede confirmar que el sistema operativo lo respeta. Ver checklist abajo. |

---

## Checklist física — la tenés que marcar vos

Ningún build ni ningún linter puede confirmar esto por vos. Instalá la
app siguiendo la guía de arriba y anotá cada casillero a medida que lo
probás. Si algo falla, decímelo con el detalle de qué pasó — lo arreglo
y volvemos a verificar juntos.

```
□ Abrí la aplicación desde el ícono en la pantalla de inicio.
□ No vi la barra de direcciones ni los botones del navegador al abrirla.
□ Cerré completamente la aplicación (deslizar para cerrarla, no solo minimizar).
□ La abrí nuevamente desde el ícono.
□ Apagué el WiFi y los datos móviles.
□ La abrí otra vez con todo apagado — cargó igual.
□ Escribí una Nota estando sin conexión.
□ Volví a activar la conexión.
□ Reinicié el teléfono por completo.
□ Verifiqué que el ícono seguía ahí después de reiniciar.
□ La abrí después de reiniciar — la Nota que escribí sin conexión seguía guardada.
□ Probé escribir una Nota con el teclado abierto — el botón "Guardar" seguía visible y alcanzable.
□ Roté el teléfono a horizontal y volví a vertical.
□ Revisé que el contenido no quedara tapado por el notch / isla dinámica / barra de estado.
□ Cambié el modo oscuro del sistema y volví a abrir la app.
```

Cuando termines de marcarla, esa evidencia es exactamente lo que va en
`docs/experience-log.md` — no hace falta un documento nuevo para esto,
esa plantilla ya está pensada para este momento.
