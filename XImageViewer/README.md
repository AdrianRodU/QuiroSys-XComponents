# XImageViewer

Visor de fotos a pantalla completa: la imagen se ve **encima de la pantalla**, con su título, su subtítulo y su **X**.
Pensado para vouchers de pago, fotos del cierre de caja y comprobantes de gastos, donde lo que importa es **leer** la
foto (fecha, monto, número de operación) sin descargarla.

Componente propio, **sin dependencias externas**: solo usa el `QDialog` de Quasar. Los íconos van en SVG, así que no
depende del juego de íconos que cargue cada proyecto.

## Instalación

```vue
<script setup>
import XImageViewer from '@quirosys/x-components/XImageViewer/XImageViewer.vue'
</script>
```

## Qué hace

| Acción | Cómo |
|--------|------|
| Cerrar | La X, `Esc` o un clic fuera de la foto |
| Acercar y alejar | Botones, rueda del ratón (hacia donde apunta el cursor), doble clic o doble toque, dos dedos, teclas `+` y `-` |
| Moverse por la foto acercada | Arrastrar |
| Tamaño real (100 %) | Clic en el porcentaje (otro clic vuelve a ajustar) |
| Ajustar a la pantalla | Botón o tecla `0` |
| Girar | Botón o tecla `R` (las fotos de celular suelen llegar giradas). El giro se recuerda por foto mientras el visor esté abierto |
| Descargar | Botón; el nombre sale de `filename` y la extensión del tipo real del archivo |
| Varias fotos | Flechas en pantalla, teclas `←` y `→`, deslizar con el dedo, y un contador `2 / 5` |

Además: muestra "Cargando…" mientras llega la foto; si falla, un aviso con **Reintentar**; si lo que llega no es una
imagen (un PDF, por ejemplo), lo dice y ofrece **Descargar**. Respeta la preferencia de "reducir movimiento" del
sistema. "Ajustar a la pantalla" nunca agranda una foto chica más allá de su tamaño real.

## El componente no hace llamadas por su cuenta

Igual que `XPdfPreview`, **no hace HTTP**: quien lo usa le entrega un `fetcher`, así cada aplicación trae la foto con
su propio axios (token, interceptores, permisos). `fetcher(item, index)` puede resolver:

- un **`Blob`** (se convierte a *object URL* y se libera al cerrar), o
- un **string** con una URL directa (por ejemplo, una URL firmada).

Si un item ya trae `src`, no hace falta `fetcher`.

## Uso

```vue
<script setup>
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import XImageViewer from '@quirosys/x-components/XImageViewer/XImageViewer.vue'

const viewerRef = ref(null)

function verVouchers(pagos, pagoElegido) {
  viewerRef.value.open({
    items: pagos.map((p) => ({
      key: p.id,
      title: `${p.metodo} · S/ ${p.monto}`,
      subtitle: `B002-29090 · Op. ${p.operacion}`,
      filename: `voucher-${p.id}`,          // sin extensión: la pone el visor según el archivo
    })),
    index: pagos.findIndex((p) => p.id === pagoElegido.id),
    fetcher: async (item) => (await api.get(`/pagos/${item.key}/voucher`, { responseType: 'blob' })).data,
  })
}
</script>

<template>
  <x-image-viewer ref="viewerRef" />
</template>
```

Una sola foto, sin lista:

```js
viewerRef.value.open({ title: 'Cierre de caja', subtitle: 'Los Olivos · 30/09/2026', src: urlFirmada })
```

## Métodos (por `ref`)

| Método | Descripción |
|--------|-------------|
| `open(options)` | Abre el visor. Ver las opciones abajo. Llamarlo con el visor abierto lo reemplaza por la lista nueva. |
| `close()` | Lo cierra. |

### Opciones de `open`

| Opción | Tipo | Descripción |
|--------|------|-------------|
| `items` | `Array` | Las fotos. Cada una: `{ key, title, subtitle, filename, src }` (todo opcional salvo que debe haber `src` o un `fetcher`). Puedes agregar tus propios campos: el item vuelve tal cual al `fetcher` y a los eventos. |
| `index` | `Number` | Con cuál empieza (por defecto, la primera). |
| `fetcher` | `Function` | `async (item, index) => Blob \| string`. Se llama una vez por foto mientras el visor esté abierto. |
| `title`, `subtitle`, `filename`, `src`, `key` | — | Atajo para una sola foto, sin `items`. |

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `downloadable` | `Boolean` | `true` | Muestra el botón de descargar. |
| `rotatable` | `Boolean` | `true` | Muestra el botón de girar. |
| `preload` | `Boolean` | `true` | Con varias fotos, pide por adelantado la anterior y la siguiente. |
| `maxScale` | `Number` | `8` | Acercamiento máximo, en veces el tamaño real de la foto. |
| `labels` | `Object` | `{}` | Textos propios; se mezclan con los de fábrica (ver abajo). |

### Textos (`labels`)

`viewer`, `close`, `previous`, `next`, `zoomIn`, `zoomOut`, `actualSize`, `fit`, `rotate`, `download`, `loading`,
`loadError`, `notImage`, `retry`, y las funciones `counter(actual, total)` y `counterLabel(actual, total)`.

```vue
<x-image-viewer ref="viewerRef" :labels="{ loadError: 'No se pudo cargar el voucher.' }" />
```

## Eventos

| Evento | Argumentos | Cuándo |
|--------|------------|--------|
| `open` | `(index, item)` | Al abrir. |
| `change` | `(index, item)` | Al pasar a otra foto. |
| `download` | `(item, index)` | Al descargar. |
| `close` | — | Al terminar de cerrarse (también con `Esc`). |

## Notas

- Va montado una sola vez por pantalla (`<x-image-viewer ref="…" />`) y se abre por código; no usa `v-model`.
- Se puede abrir encima de un `XDialog`: `Esc` cierra solo el visor.
- Un voucher en **PDF** no se dibuja aquí: usa `XPdfPreview`. Si llega uno, el visor lo avisa y deja descargarlo.
- Los estilos van dentro del componente (prefijo `x-image-viewer`): no hace falta tocar `index.scss`.

Primera versión: v2.21.0 (modal "Pagos" del ERP: ver el voucher de un pago sin descargarlo).
