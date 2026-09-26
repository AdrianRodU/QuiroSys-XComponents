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

## Componentes

Más de 40 componentes con prefijo `X*`, entre ellos:

- **Formularios**: XInput, XInputNumeric, XInputOtp, XInputSearchPerson, XSelect, XTreeSelect, XDatepicker, XCheckbox, XToggle, XFile, XImageUpload, XImageCropperUpload
- **Tablas**: XTable, XTableServer (server-side con filtros, exportación Excel y persistencia de columnas), XTableCard
- **Diálogos y feedback**: XDialog, XDialogAction, XNotify, XLoading, XBanner, XHelpTip, XCallout
- **Visualización**: XChart, XBadge, XCard, XLineageTree, XTracking, XPdfPreview, XPdfViewer
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
