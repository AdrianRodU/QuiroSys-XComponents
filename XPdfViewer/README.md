# XPdfViewer

Visor de PDF embebido basado en [`@embedpdf/vue-pdf-viewer`](https://www.embedpdf.com/) — motor **PDFium compilado a WebAssembly**, que corre dentro de un *shadow DOM*. Sobre ese visor, el componente añade un **header propio** (nombre + cerrar) y un **overlay de acciones** (selector de formato, imprimir, descargar), y apaga por defecto los controles del toolbar interno que no se necesitan. Se estira a su contenedor (`width/height: 100%`), así que se usa suelto o dentro de un `XDialog`.

> **Motor:** PDFium/WASM vía `@embedpdf/vue-pdf-viewer`. **No usa pdf.js.**

> **Theme:** el toolbar interno de embedpdf sigue automáticamente el modo oscuro de la app (`$q.dark.isActive`), no el del sistema operativo. Sin prop para configurarlo — es siempre así.

## Instalación

```vue
<script setup>
import XPdfViewer from '@quirosys/x-components/XPdfViewer/XPdfViewer.vue'
</script>
```

Requiere `@embedpdf/vue-pdf-viewer` como dependencia del proyecto consumidor.

## Qué recibe

El componente **solo necesita la URL de un PDF ya generado** (`src`). Todo (páginas, zoom, panorámica, selección) lo maneja el motor embedpdf en el navegador. El zoom/panorámica/navegación de páginas viven en el **toolbar interno de embedpdf** (siempre visible); el resto de features se activan con props (todas off por defecto).

### Qué debe servir el backend en `src`

La URL de `src` tiene que devolver el **PDF crudo**, no un envoltorio:

- **`Content-Type: application/pdf`** con los **bytes del PDF** en el cuerpo. El motor (PDFium/WASM) espera el binario; **no** admite JSON, base64 dentro de un objeto, ni HTML.
- Servido **inline** (`Content-Disposition: inline`, o sin ese header), **no** como `attachment` — el archivo se muestra en el visor, no se fuerza una descarga. El botón *Descargar* del componente ya se encarga de bajarlo con el `filename` correcto.
- **Un archivo por formato**: si manejas varias presentaciones (p. ej. A4 y ticket 80 mm), el backend expone una **URL distinta por formato**; el componente muestra la que reciba en `src` (ver el ejemplo de `formats` más abajo).
- **Red / auth**: si el endpoint vive en otro origen, debe permitir **CORS**. La descarga usa `fetch(src, { credentials: 'include' })`, así que si el PDF requiere sesión/cookies, habilita credenciales en el endpoint.

> **Ejemplo (backend Laravel de intipos):** `GET /api/document/print/{table}/{external_id}/{format}` genera el PDF con **mpdf** y lo devuelve con `response()->file($temp)` (Laravel emite `application/pdf` inline); se cachea en storage tras la primera vez. `format` es `a4` o `ticket`, y de ahí salen los campos `url_pdf` / `url_pdf_ticket` que consumen los *finish dialogs*.

### Props

#### Contenido
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `src` | `String` | — (**requerido**) | URL del PDF. Al cambiar, el visor **se remonta** (`:key="src::zoom"`) porque embedpdf carga el documento una sola vez al montarse. |
| `filename` | `String` | `'documento.pdf'` | Nombre mostrado en el header y usado al **descargar**. |

#### Header (barra superior propia)
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `showHeader` | `Boolean` | `true` | Muestra el header con nombre + botón cerrar. |
| `hideClose` | `Boolean` | `false` | Oculta el botón cerrar (emite `close`). |

#### Overlay de acciones (arriba a la derecha)
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `showActions` | `Boolean` | `true` | Muestra el overlay (formatos + imprimir + descargar). |
| `hidePrint` | `Boolean` | `false` | Oculta **Imprimir** (usa un iframe oculto con el PDF → `window.print`). |
| `hideDownload` | `Boolean` | `false` | Oculta **Descargar** (`fetch(src, credentials:'include')` → Blob → `<a download>`). |

#### Selector de formato (A4 / Ticket / A5…)
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `formats` | `Array` | `[]` | Opciones `[{ value, label }]`. Se pinta un botón por opción a la izquierda de Imprimir, **solo si hay más de una**. |
| `activeFormat` | `String` | `null` | Valor del formato activo (resalta su botón). |

> El componente **no regenera el PDF** al cambiar de formato: solo emite `update:activeFormat`. Quien lo consume decide cómo volver a pedir el documento en ese formato y actualiza `src` (y normalmente `zoom`).

#### Zoom inicial
| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `zoom` | `String \| Number` | `'fit-width'` | Modo `'fit-width'` / `'fit-page'` / `'automatic'` (ZoomMode de embedpdf) o un **número** como factor (`2` = 200%). Útil porque `fit-width` se ve bien en A4 pero es enorme en un ticket de ~70 mm. |

#### Toolbar de embedpdf (opt-in — todas `false` por defecto)
Activan secciones del toolbar interno que vienen ocultas:

| Prop | Habilita |
|------|----------|
| `showDocumentMenu` | Menú hamburguesa (izquierda) |
| `showPageSettings` | Ajustes de página |
| `showModeTabs` | Pestañas View / Annotate / Shapes… |
| `showOverflowMenu` | Menú "⋮" de desborde |
| `showSearch` | Panel de búsqueda |
| `showSidebar` | Barra lateral + comentarios |
| `showAnnotations` | Anotaciones + formas |
| `showForms` | Formularios |
| `showRedaction` | Redacción + seguridad |
| `showRotate` | Rotar página |
| `showCapture` | Captura de documento / herramientas |
| `showInsert` | Insertar |

> Print y Export del toolbar interno están **siempre apagados** (se reemplazan por los botones propios del overlay). Zoom + panorámica + puntero del toolbar interno están **siempre visibles**.

### Eventos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `close` | — | Botón cerrar del header. El padre decide qué hacer (cerrar el diálogo, etc.). |
| `update:activeFormat` | `value` | Se eligió un formato del selector. |

> Esta versión **no** expone métodos por `ref` (no hay `defineExpose`): las acciones se disparan desde los botones del overlay o con las props.

## Uso básico

```vue
<template>
  <XPdfViewer
    :src="pdfUrl"
    :filename="pdfFilename"
    @close="show = false"
  />
</template>

<script setup>
import { ref } from 'vue'
import XPdfViewer from '@quirosys/x-components/XPdfViewer/XPdfViewer.vue'

const pdfUrl = ref('https://mi-api.test/document/download/pdf/UUID')
const pdfFilename = ref('B001-123.pdf')
const show = ref(true)
</script>
```

## Ejemplos

### A4 vs Ticket con el selector de formato

El backend suele exponer dos PDFs (A4 y ticket). Se listan en `formats` y, al cambiar, se actualiza `src` + `zoom`:

```vue
<template>
  <XPdfViewer
    :src="urlActual"
    :filename="filename"
    :formats="[{ value: 'a4', label: 'A4' }, { value: 'ticket', label: 'Ticket' }]"
    :active-format="formato"
    :zoom="formato === 'ticket' ? 2 : 'fit-width'"
    @update:active-format="formato = $event"
    @close="show = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue'

const formato = ref('a4')
const urls = { a4: record.url_pdf, ticket: record.url_pdf_ticket }
const urlActual = computed(() => urls[formato.value])
const filename = ref('B001-123.pdf')
const show = ref(true)
</script>
```

> En intipos, los *finish dialogs* (POS, Dispatch, OrderNote…) suelen pasar un **único `src`** ya elegido según `printing_format` del establecimiento (`url_pdf` o `url_pdf_ticket`), sin usar el selector integrado. Ambos enfoques son válidos.

### Dentro de un XDialog

```vue
<XDialog v-model="show" :show-button-ok="false" is-full-height>
  <template #content>
    <x-pdf-viewer :src="pdfUrl" :filename="pdfFilename" @close="show = false" />
  </template>
</XDialog>
```

> El visor ocupa `width/height: 100%` con `flex` interno: el contenedor padre debe darle alto (por eso encaja en `is-full-height` de `XDialog`).

### Solo lectura (sin imprimir/descargar) o embebido sin header

```vue
<x-pdf-viewer :src="pdfUrl" :hide-print="true" :hide-download="true" />

<x-pdf-viewer :src="pdfUrl" :show-header="false" />
```
