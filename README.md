# @quirosys/x-components

Componentes compartidos QuiroSys — **Vue 3 + Quasar v2**. Librería de UI usada por los frontends SPA de QuiroSys (system y tenant).

## Instalación

Se instala directamente desde este repositorio de GitHub, **pineado por tag**:

```json
"dependencies": {
    "@quirosys/x-components": "github:AdrianRodU/QuiroSys-XComponents#v2.4.53"
}
```

```bash
pnpm install
```

> Nota: la versión efectiva es la del **tag de GitHub**, no el campo `version` del `package.json` del paquete (puede ir rezagado).

## Uso

```js
import { XInput, XSelect, XTableServer, XDialog } from '@quirosys/x-components'
```

Los estilos base se importan desde `index.scss` / `_variables.scss`, con temas en `themes/`.

## Modo oscuro (desde v2.27.0)

Quasar activa el modo oscuro con la clase `body--dark`. Sus colores viven en un solo archivo,
[themes/tokens.scss](themes/tokens.scss), como variables CSS (`--x-surface`, `--x-text-muted`, `--x-border`,
`--x-primary-text`, `--x-positive-soft`, `--x-tone-blue-text`...; la lista completa está al inicio del archivo). Reglas:

- **Un color fijo se escribe con su token y el color claro de respaldo**: `background: var(--x-surface, #ffffff)`. En
  claro el token no existe y rige el respaldo (nada cambia); en oscuro rige la paleta. Vale igual en los estilos en
  línea (`:style="{ background: 'var(--x-surface-2, #f8f8f8)' }"`).
- **Nada de bloques `.body--dark` por pantalla o por componente**: un color nuevo del modo oscuro se agrega en
  `tokens.scss`. Solo el tema ajusta ahí las piezas de Quasar que no tienen un color propio.
- **Las clases de color de Quasar se adaptan solas**: `bg-white`, `bg-grey-1..4`, `text-grey-5..10`, los fondos suaves
  `bg-<color>-1..3` y los textos `text-<color>-7..10` se remapean en `tokens.scss` a la superficie, el texto y un tinte
  del color. Una pantalla que usa esas clases como roles no necesita nada más.
- **Campos**: XInput, XSelect y XInputNumeric usan `bg-color="x-field"` por defecto (blanco en claro, el fondo de campo
  en oscuro). No pasar `bg-color="white"`.
- **Logos que sube cada empresa**: en oscuro, `x-logo-plate` los pone sobre una placa clara (un anillo de sombra: no
  cambia el tamaño) y `x-logo-white` los pinta enteros en blanco, solo para logos con fondo transparente (con fondo
  propio saldría un rectángulo blanco). En claro no hacen nada.
- **Colores que vienen de los datos** (la marca de una procedencia, el color de un tipo): no son tokens. Se pasan en
  `--x-data-color`, se pintan con `var(--x-data-color-dark, var(--x-data-color))` y la clase `x-data-color`; en oscuro
  uno oscuro se aclara conservando su tono. XTableServer ya lo hace con las celdas de ícono y de texto con color CSS.
- **Texto blanco sobre un color sólido** (botones, insignias con fondo de color) se queda así: el sólido no cambia.

El proyecto activa el modo con `$q.dark.set(true)`; la preferencia y en qué pantallas se permite son del proyecto.

## Formularios para tocar (desde v2.34.0)

Para un formulario que se llena con el dedo y que leen personas de cualquier edad (la ficha del paciente del ERP), sin
estilos propios encima de los X*:

- **Clase `x-touch`** ([themes/touch.scss](themes/touch.scss)) en el contenedor del formulario. Dentro, los campos llevan
  la pregunta arriba en 16 px y negrita (con `:is-classic="false"`), texto de 16 px, esquinas de 12 px, borde de 1.5 px y
  el error debajo del campo con su ícono; los XButton, 48 px de alto (los redondos, 44 × 44); foco visible con el teclado
  y sin animaciones si el celular pide menos movimiento. Fuera de la clase nada cambia. Se importa después del tema:
  `@import '@quirosys/x-components/themes/touch';`. Un diálogo vive fuera de la página: su tarjeta también lleva la clase.
- **`XButtonToggle` con `pill`**: cada opción es una píldora suelta y la elegida lleva borde y fondo suave del primario y
  ✓ (el color solo no basta). Los colores salen del primario y de los tokens; `error` pinta de rojo las opciones de una
  pregunta obligatoria sin responder. Alto en `--x-button-toggle-pill-height` (44 px; 48 dentro de `x-touch`).

```vue
<x-button-toggle v-model="answer" pill :error="missing" size="16px" spread
  :options="[{ label: 'No', value: false }, { label: 'Sí', value: true }]" option-label="label" option-value="value" />
```

## Tablas de informe (desde v2.35.0)

Para una tabla con muchas columnas de números (un informe), XTable suma lo siguiente sin cambiar las tablas que ya lo
usan:

- **`header-groups`**: una fila arriba de la cabecera que agrupa columnas seguidas (`[{ label, columns, help }]`), con
  una línea vertical entre grupos. Las columnas que no están en un grupo ocupan las dos filas de la cabecera.
- **Columnas fijas**: `sticky: 'left'` en la primera columna y `sticky: 'right'` en la última. Quedan a la vista al
  desplazar en horizontal y lo de en medio se desliza.
- **`summary`**: fila de total al pie, con un valor por nombre de columna (slots `summary-cell-{name}` y `mobile-summary`).
- **`mobile-below`**: desde qué ancho pasa a tarjetas (`sm`, `md`, `lg` o `xl`). Sin la prop, como siempre: celular,
  tablet o bajo 1440 px. El slot `mobile-row` dibuja la tarjeta entera.
- **`compact`**: celdas de 7 × 10 px y números de ancho fijo.
- Columnas con `help` ("?" en la cabecera), y slots `top-row` y `bottom-row` para filas propias.
- `@row-click` también en escritorio (antes solo en las tarjetas), con la mano al pasar y con Enter desde el teclado.

```vue
<x-table compact mobile-below="md" row-key="key" :rows="rows" :summary="totals" @row-click="openPerson"
  :header-groups="[{ label: 'R2 / RV2', columns: ['r2_closes', 'r2_rate', 'r2_amount'], help: 'Cierres, tasa y monto' }]"
  :columns="[
    { name: 'name', label: 'Persona', field: 'name', align: 'left', sticky: 'left' },
    { name: 'r2_closes', label: 'Cierres', field: 'r2_closes', align: 'right' },
    { name: 'r2_rate', label: 'Tasa', field: 'r2_rate', align: 'right' },
    { name: 'r2_amount', label: 'S/', field: 'r2_amount', align: 'right' },
    { name: 'total', label: 'Total', field: 'total', align: 'right', sticky: 'right' },
  ]" />
```

## Estado vacío e insignias (desde v2.36.0)

- **XEmptyState**: el estado vacío de la casa fuera de una tabla (ícono, título, texto y botones), con el aspecto del
  vacío de XTable. Ver `XEmptyState/README.md`.
- **XBadge** con `color`: sin `is-lighten-color` ahora sale con fondo suave y el texto en el color (antes, fondo y texto
  del mismo color: la etiqueta no se veía). `is-lighten-color="false"` da fondo fuerte con texto blanco. Acepta
  `positive` y `negative` (los nombres de Quasar). Un color que no se puede pintar (`orange-8`) sale gris y avisa en la
  consola.

## Componentes

Más de 40 componentes con prefijo `X*`, entre ellos:

- **Formularios**: XInput, XInputNumeric, XInputOtp, XInputPhone (teléfono con código de país), XInputSearchPerson, XSelect, XTreeSelect, XDatepicker, XCheckbox, XToggle, XButtonToggle (opciones en grupo o en píldoras), XSlider, XFile, XImageUpload, XImageCropperUpload
- **Tablas**: XTable (local; grupos de columnas, columnas fijas y fila de total para informes), XTableServer (server-side con filtros, exportación Excel y persistencia de columnas), XTableCard
- **Diálogos y feedback**: XDialog, XDialogAction, XNotify, XLoading, XBanner, XHelpTip, XCallout, XSaveBar (barra de guardado pegada arriba: estado, Descartar y Guardar), XEmptyState (estado vacío fuera de una tabla)
- **Visualización**: XChart, XBadge, XCard, XLineageTree, XTracking, XPdfPreview, XPdfViewer, XImageViewer, XPhoneLink (teléfono con bandera y WhatsApp), XFieldCheck (el check verde de los campos con valor)
- **Navegación**: XMainMenu, XDropdownMenu, XModulesTreePicker, XNested, XDnd
- **Otros**: XFormatPrice, XPriceCalculator, XTokenDisplay, XVerifiedBadge, XCoupon (cupón para recortar: oferta, código y vigencia), Mobile/, PrintTemplates/

Ver [PACKAGES.md](PACKAGES.md) para la arquitectura del ecosistema de paquetes.

## Dependencias

Requiere como peers del proyecto consumidor: `vue ^3`, `quasar ^2`. Declara `vuedraggable` (usada por XDnd/XTableServer).

## Publicar una nueva versión

```bash
git tag vX.Y.Z
git push origin main --tags
```

Luego actualizar el tag en el `package.json` del proyecto consumidor y correr `pnpm install`.
