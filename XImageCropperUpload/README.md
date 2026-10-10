# XImageCropperUpload

Subida de imagen con recorte (cropperjs 1.6.2). El padre recibe la imagen recortada (`Blob`) en `change` y decide
cuándo subirla.

Tres variantes:

- `inline` (por defecto): fila con miniatura, texto y botón para limpiar.
- `card`: la imagen completa; al pasar el mouse, Cambiar / Reubicar / Eliminar.
- `avatar` (v2.27.0): la foto de una persona en un círculo, con cámara y "Subir foto / Cambiar / Quitar". Sin foto
  muestra las iniciales. El recorte es cuadrado con guía redonda y sale en JPG de 400 × 400.

En el diálogo de recorte (v2.27.0) hay una barra para acercar y un botón para girar 90°. La rueda del mouse también
acerca, con los mismos topes.

## Uso: foto de una persona (`avatar`)

```vue
<script setup>
import XImageCropperUpload from '@quirosys/x-components/XImageCropperUpload/XImageCropperUpload.vue'

const photoRef = ref(null)
const photoUrl = ref(null)     // URL que da el servidor
const uploading = ref(false)

// Subir al momento (p. ej. "Mi perfil")
const onPhoto = async (blob) => {
  if (!blob) return             // null = deshizo una foto que no se guardó
  uploading.value = true
  const fd = new FormData()
  fd.append('photo', blob, 'foto.jpg')
  const { data } = await api.post('/auth/profile/photo', fd)
  photoUrl.value = data.data.photo_url   // al cambiar previewUrl, la vista previa local se descarta sola
  uploading.value = false
}
</script>

<template>
  <x-image-cropper-upload
    ref="photoRef"
    variant="avatar"
    size="96px"
    :preview-url="photoUrl"
    initials="JN"
    :loading="uploading"
    @change="onPhoto"
    @remove="quitarFoto"
  />
</template>
```

En un formulario que guarda todo junto, se guarda el `Blob` de `change` y se sube con "Guardar".

## Uso: logo o imagen (`card`)

```vue
<x-image-cropper-upload
  variant="card"
  :preview-url="logoUrl"
  :loading="loadingLogo"
  label="Click para subir logo"
  height="160px"
  :can-reposition="!!logo.original"
  :crop-data="logo.crop || null"
  :original-loader="loadLogoOriginal"
  @change="onLogoChange"
  @remove="deleteLogo"
/>
```

## Props

| Prop             | Tipo       | Default                         | Descripción |
|------------------|------------|---------------------------------|-------------|
| `variant`        | `String`   | `'inline'`                      | `inline`, `card` o `avatar` |
| `previewUrl`     | `String`   | `null`                          | Imagen guardada (URL del servidor) |
| `label`          | `String`   | `'Click para subir imagen'`     | Texto de `inline` y `card` |
| `hint`           | `String`   | `null`                          | Texto secundario (en `inline`/`card`, por defecto los formatos y el peso) |
| `accept`         | `String`   | PNG, JPG, WEBP y SVG            | Formatos aceptados; en `avatar`, sin SVG |
| `maxSizeMb`      | `Number`   | `2` (`avatar`: `10`)            | Peso máximo del archivo elegido (la foto de un celular se reduce al recortarla) |
| `withCrop`       | `Boolean`  | `true`                          | `false` = sin recorte |
| `loading`        | `Boolean`  | `false`                         | Spinner sobre la imagen (`card` y `avatar`) |
| `height`         | `String`   | `'200px'`                       | Alto de `card` |
| `previewRatio`   | `Number`   | `null`                          | Proporción de `card` (gana sobre `height`) |
| `aspectRatio`    | `Number`   | `null` (libre)                  | Proporción del recorte; en `avatar`, siempre 1 |
| `cropMaxWidth`   | `Number`   | `600` (`avatar`: `400`)         | Ancho máximo de la imagen recortada |
| `cropMaxHeight`  | `Number`   | `600` (`avatar`: `400`)         | Alto máximo de la imagen recortada |
| `cropMimeType`   | `String`   | `'image/png'` (`avatar`: JPG)   | Formato de la imagen recortada |
| `cropQuality`    | `Number`   | `0.92` (`avatar`: `0.9`)        | Calidad (JPG y WEBP) |
| `fillColor`      | `String`   | `'#ffffff'`                     | Fondo de lo transparente al guardar en JPG |
| `cropTitle`      | `String`   | "Recortar imagen" / "Recortar foto" | Título del diálogo de recorte |
| `round`          | `Boolean`  | solo en `avatar`                | Guía redonda en el recorte (se guarda cuadrada) |
| `canReposition`  | `Boolean`  | `false`                         | Muestra "Reubicar" (requiere `originalLoader`) |
| `cropData`       | `Object`   | `null`                          | Encuadre guardado que "Reubicar" restaura |
| `originalLoader` | `Function` | `null`                          | `async () => Blob` con la imagen original |
| `size`           | `String`   | `'96px'`                        | Diámetro de `avatar` |
| `initials`       | `String`   | `''`                            | Lo que muestra `avatar` sin foto (sin iniciales, un ícono de persona) |
| `removable`      | `Boolean`  | `true`                          | `avatar`: ofrece "Quitar" cuando hay foto |
| `disable`        | `Boolean`  | `false`                         | `avatar`: solo mirar, sin cámara ni acciones |

## Eventos

| Evento   | Payload | Descripción |
|----------|---------|-------------|
| `change` | `(blob, meta)` | Imagen recortada. `meta` = `{ cropData, originalFile, repositioned }` (`null` para SVG o sin recorte). `blob` = `null` cuando se deshace una imagen que todavía no se guardó |
| `remove` | — | Quitar la imagen guardada (`previewUrl`): el padre la borra o la marca para borrar |

## Métodos (por `ref`)

| Método                | Descripción |
|-----------------------|-------------|
| `triggerFileInput()`  | Abre el selector de archivos |
| `repositionCurrent()` | Abre el recorte con la imagen original y su encuadre |
| `reset()`             | Olvida la imagen elegida y vuelve a mostrar `previewUrl` |
| `blob`                | La última imagen recortada (o `null`) |

## Notas

- Cuando `previewUrl` cambia (el padre ya subió la imagen, o es otro registro), la vista previa local se descarta
  y "Quitar" vuelve a referirse a la imagen guardada.
- En `avatar`, "Quitar" sobre una foto nueva que todavía no se guardó dice "Deshacer" y vuelve a la guardada.
- El SVG no se recorta: se entrega tal cual.
- Modo oscuro: en `inline` y `card` con imagen, y en el recorte de `inline`/`card`, el logo se ve sobre la placa
  clara del tema (`--x-logo-plate`): los logos se diseñan para fondo claro y uno con letras oscuras se perdía. La foto
  de `avatar` y su recorte redondo siguen sobre la superficie oscura. En claro nada cambia.
- v2.27.0 reemplaza la copia local que tenía el ERP (`src/components/XImageCropperUpload`), con la misma API.
