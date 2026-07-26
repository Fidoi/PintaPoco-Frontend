# PintaPoco

Lienzo de dibujo en el navegador con galería pública. Dibujas, publicas, y la
obra queda en una URL propia que se puede compartir.

**[Ver demo](#)** · Next.js 15 · React 19 · React Konva · Vercel Blob

<!-- Sustituir por un GIF de ~10s: dibujar, publicar, abrir la obra desde la galería. -->

![Demo](./docs/demo.gif)

---

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local   # añade tu BLOB_READ_WRITE_TOKEN
pnpm dev                     # http://localhost:3002
```

Sin token la aplicación arranca igual: el lienzo funciona y la galería avisa de
que no hay almacenamiento conectado.

## Arquitectura

**No hay backend ni base de datos.** Las Server Actions escriben directamente en
Vercel Blob, y el catálogo se deriva de `list()`. El título viaja dentro del
propio nombre del fichero (`drawings/<id>__<título>.webp`), que es exactamente lo
que permite prescindir de una tabla.

```
src/
├── actions/     Mutaciones ('use server'). Solo saveDrawing.
├── data/        Lecturas ('server-only'). Nunca expuestas como endpoint.
├── lib/         Lógica pura: nombres de fichero, validación, rate limit.
├── config/      Techo de almacenamiento, paginación, obras destacadas.
└── components/  UI.
```

La separación `actions/` vs `data/` es deliberada: un Server Action es un
endpoint RPC accesible desde el cliente. Las funciones de lectura no necesitan
serlo, así que viven aparte marcadas con `server-only`, que convierte un import
accidental desde cliente en un error de build.

### Decisiones que merecen explicación

**Konva se carga con `dynamic(..., { ssr: false })`.** La librería toca `window`
al construirse, así que rompería el render de servidor. El efecto secundario es
que su build de Node importa el paquete nativo `canvas`, y el empaquetador
resuelve ese import aunque nunca se ejecute — de ahí el alias a `false` en
`next.config.ts`, duplicado para webpack y Turbopack. La alternativa era
instalar decenas de MB de binarios para renderizar en servidor algo que solo se
dibuja en el navegador.

**El detalle de obra es una ruta real con modal interceptado.** `/d/[id]` existe
como página completa; `app/@modal/(.)d/[id]` la intercepta cuando la navegación
viene de la galería. Misma URL, dos presentaciones, un solo componente
`DrawingDetail`. Compartir el enlace abre la página; hacer clic abre el modal.

**El lienzo tiene coordenadas propias.** Se dibuja siempre en un espacio lógico
de 1200×675 (16:9 exacto) y el `Stage` se escala para mostrarse. Así un trazo
hecho en móvil y otro en escritorio producen la misma obra, y la exportación
mide 1600px independientemente de la pantalla.

**El ajuste es a los dos ejes.** Con el lienzo dentro de una página que hacía
scroll bastaba con medir el ancho. A pantalla completa el alto también está
acotado, así que la escala es `min(ancho/1200, alto/675)`: en una ventana ancha y
baja, escalar solo por ancho dejaría el dibujo cortado por abajo. La primera
medida se lee de forma síncrona con `clientWidth/clientHeight` en un
`useLayoutEffect`, de modo que no hay un fotograma a tamaño equivocado antes de
que salte el `ResizeObserver`.

**El zoom multiplica sobre la escala de ajuste**, no la sustituye. Así el 100% es
siempre "lo que cabe en pantalla" —la referencia que el usuario ya tiene en la
cabeza al entrar— y la exportación sigue midiendo 1600px, porque el `pixelRatio`
se calcula contra el ancho visible real y se cancela con el zoom.

**El área de dibujo se mide en un elemento aparte del que hace scroll.** Al
ampliar aparece la barra de desplazamiento; si se midiera el propio contenedor,
esa barra encogería el área útil, recalcularía la escala y el lienzo temblaría.
Un `div` absoluto e invisible sobre la misma caja resuelve el bucle.

**Ctrl+rueda se registra con un listener nativo no pasivo.** React marca
`onWheel` como pasivo, así que `preventDefault` no surtiría efecto y el navegador
haría zoom de la página entera por encima del nuestro.

**El historial es la única fuente de verdad.** Los trazos visibles se derivan de
`historial[pasoActual]` en vez de vivir en su propio estado, lo que elimina por
construcción los desfases al deshacer.

**Voltear transforma los puntos, no la vista.** Se podría aplicar una escala
negativa al `Stage` y quedaría igual en pantalla, pero entonces el volteo no
entraría en el historial ni saldría en la exportación. Invertir las coordenadas
reales lo convierte en un paso más: se deshace con Ctrl+Z y se publica volteado
sin lógica aparte.

**Se exporta WebP con calidad 0.8** en vez de PNG. Un dibujo de líneas planas
pasa de ~300 KB a ~40 KB: siete veces más obras en el mismo plan gratuito.

## Diseño

Amable y sin ceremonia. Es una aplicación para hacer garabatos, y la interfaz no
debería aparentar más de lo que es.

**Un solo acento, y solo en la interfaz.** El violeta (`#6366F1`) vive en
botones, estado activo y foco. Las tarjetas de la galería se quedan neutras: si
el marco tuviera color, competiría con el de los dibujos y el visitante juzgaría
mal los suyos.

**Una tipografía redondeada** (Nunito) para todo, más monoespaciada únicamente
en el valor hexadecimal del color, que se lee mejor con ancho fijo. Dos fuentes,
no cinco.

**Marco blanco alrededor de cada obra.** Separa el dibujo del fondo y hace que
incluso un garabato se lea como algo puesto ahí a propósito — que importa cuando
el contenido lo suben desconocidos.

**El estudio es una aplicación, la galería es una página.** El estudio ocupa la
pantalla completa y no hace scroll: barra de documento arriba, mesa de trabajo en
el centro, panel de herramientas acoplado al lado. La galería y el detalle son
páginas normales, con su pie y su scroll. Por eso el pie no vive en el layout
raíz — lo monta cada página que hace scroll — y la cabecera tiene `h-16`
explícito: el estudio necesita restar exactamente su alto para calcular el suyo.

**Mesa de trabajo más oscura que el lienzo.** La hoja blanca se lee como un
objeto apoyado encima en vez de como el fondo de la página. Es lo que hace
cualquier editor de imagen, y ayuda a juzgar los colores claros.

**Panel acoplado, no tarjeta flotante.** En un editor a pantalla completa las
herramientas son parte del marco de la aplicación, no contenido dentro de ella.
Tiene scroll propio para que una ventana baja no las corte.

**Control segmentado para las herramientas.** Pincel, goma y pipeta son
mutuamente excluyentes; agruparlas en un raíl único lo comunica visualmente sin
que haga falta leer el estado de cada botón.

**Un solo control de grosor, el de la herramienta activa.** Antes había dos
sliders siempre visibles y solo uno tenía efecto: se podía mover "Goma" con el
pincel en la mano sin que pasara nada. Cada herramienta conserva su grosor
propio —un borrador quiere ser más gordo que un pincel— pero solo se muestra el
que aplica, con una muestra circular del tamaño real al lado.

**Dos colores guardados, uno activo.** Alternar entre la tinta y un color de
relleno es el gesto más repetido al dibujar, y no debería costar volver a
buscarlo en la rueda. El primer clic sobre una muestra la selecciona; el segundo
abre el selector — así elegir cuál usar no abre un diálogo que nadie pidió.
`X` los intercambia, y el atajo enmudece mientras hay un campo de texto enfocado
para no cambiar el color al escribir el título.

**"Limpiar" vive lejos de los iconos.** Borrar el lienzo no puede estar a un
píxel de deshacer, que es lo que se pulsa cada dos minutos.

**Solo modo claro, a propósito.** Comprometerse con un único aspecto evita la
plomería de clases de tema y el parpadeo al cargar, a cambio de nada que este
proyecto necesite.

### Límites y coste

Todo el proyecto corre en capas gratuitas: Vercel Hobby (uso no comercial) más
~1 GB de Blob. Para no salirse:

- **FIFO**: superadas 200 obras se borra la más antigua (`MAX_DRAWINGS`).
- **Validación de subida**: máximo 2 MB y comprobación de la cabecera RIFF/WEBP
  del binario, no del prefijo `data:` que escribe el cliente.
- **Rate limit** de 5 subidas por minuto e IP.

El rate limit vive en memoria del proceso, así que en serverless cada instancia
tiene su propio contador: frena el clic repetido y el spam accidental, no a un
atacante decidido. Para eso haría falta un contador compartido, que no compensa
en un proyecto de esta escala.

### Moderación

La galería acepta subidas anónimas. `FEATURED_IDS` en `src/config/gallery.ts`
controla qué obras aparecen en "Destacadas", que es lo primero que ve el
visitante. Las páginas de obra individual llevan `noindex`: se muestran, pero no
se indexa contenido de terceros bajo el dominio.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Desarrollo con Turbopack en el puerto 3002 |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint |

## Despliegue

Importar el repo en Vercel, crear un store en **Storage → Blob** y conectarlo al
proyecto. `BLOB_READ_WRITE_TOKEN` se inyecta solo.
