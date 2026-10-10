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

## Componentes

Más de 40 componentes con prefijo `X*`, entre ellos:

- **Formularios**: XInput, XInputNumeric, XInputOtp, XInputSearchPerson, XSelect, XTreeSelect, XDatepicker, XCheckbox, XToggle, XSlider, XFile, XImageUpload, XImageCropperUpload
- **Tablas**: XTable, XTableServer (server-side con filtros, exportación Excel y persistencia de columnas), XTableCard
- **Diálogos y feedback**: XDialog, XDialogAction, XNotify, XLoading, XBanner, XHelpTip, XCallout
- **Visualización**: XChart, XBadge, XCard, XLineageTree, XTracking, XPdfPreview, XPdfViewer, XImageViewer
- **Navegación**: XMainMenu, XDropdownMenu, XModulesTreePicker, XNested, XDnd
- **Otros**: XFormatPrice, XPriceCalculator, XTokenDisplay, XVerifiedBadge, Mobile/, PrintTemplates/

Ver [PACKAGES.md](PACKAGES.md) para la arquitectura del ecosistema de paquetes.

## Dependencias

Requiere como peers del proyecto consumidor: `vue ^3`, `quasar ^2`. Declara `vuedraggable` (usada por XDnd/XTableServer).

## Publicar una nueva versión

```bash
git tag vX.Y.Z
git push origin main --tags
```

Luego actualizar el tag en el `package.json` del proyecto consumidor y correr `pnpm install`.
