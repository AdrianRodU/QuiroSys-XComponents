# XFile

Componente de seleccion de archivos que envuelve `QFile` de Quasar con estilos personalizados.

## Instalacion

```vue
<script setup>
import XFile from '@/components/XFile/XFile.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `modelValue` | `File \| Array` | `null` | Archivo(s) seleccionado(s) (v-model) |
| `label` | `String` | `''` | Label flotante |
| `placeholder` | `String` | `''` | Texto placeholder |
| `multiple` | `Boolean` | `false` | Permitir multiples archivos |
| `outlined` | `Boolean` | `true` | Estilo outlined |
| `rules` | `Array` | `[]` | Reglas de validacion |
| `errorMessage` | `String` | `''` | Mensaje de error |
| `clearable` | `Boolean` | `false` | Mostrar boton limpiar |
| `accept` | `String` | `''` | Tipos de archivo aceptados |
| `isRequired` | `Boolean` | `false` | Campo obligatorio: asterisco rojo en la etiqueta, como XInput (solo marca, no valida). v2.20.0 |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `File \| Array` | Cambio de archivo(s) |
| `clear-error` | - | Limpiar mensaje de error |

## Uso Basico

```vue
<template>
  <XFile
    v-model="archivo"
    label="Seleccionar archivo"
  />
</template>

<script setup>
import { ref } from 'vue'

const archivo = ref(null)
</script>
```

## Ejemplos

### Solo imagenes

```vue
<XFile
  v-model="imagen"
  label="Imagen"
  accept="image/*"
/>
```

### Solo PDFs

```vue
<XFile
  v-model="documento"
  label="Documento PDF"
  accept=".pdf"
/>
```

### Multiples tipos

```vue
<XFile
  v-model="archivo"
  label="Documento"
  accept=".pdf,.doc,.docx,.xls,.xlsx"
/>
```

### Multiples archivos

```vue
<XFile
  v-model="archivos"
  label="Archivos"
  multiple
  clearable
/>
```

### Con validacion

```vue
<template>
  <XFile
    v-model="archivo"
    label="Certificado"
    accept=".cer,.pfx,.p12"
    :rules="[
      val => !!val || 'Archivo requerido',
      val => val?.size < 5000000 || 'Maximo 5MB'
    ]"
    :error-message="errors.archivo"
    @clear-error="errors.archivo = ''"
  />
</template>
```

### Con placeholder

```vue
<XFile
  v-model="archivo"
  placeholder="Haga clic para seleccionar un archivo"
  accept="image/*"
  clearable
/>
```

### En un formulario

```vue
<template>
  <q-form @submit="handleSubmit">
    <XInput v-model="nombre" label="Nombre" />
    
    <XFile
      v-model="foto"
      label="Foto de perfil"
      accept="image/png,image/jpeg"
      :rules="[val => !!val || 'Foto requerida']"
    />
    
    <XButton type="submit" label="Guardar" />
  </q-form>
</template>

<script setup>
import { ref } from 'vue'

const nombre = ref('')
const foto = ref(null)

async function handleSubmit() {
  const formData = new FormData()
  formData.append('nombre', nombre.value)
  formData.append('foto', foto.value)
  
  await api.post('/usuarios', formData)
}
</script>
```

### Subida con preview

```vue
<template>
  <div>
    <XFile
      v-model="imagen"
      label="Imagen"
      accept="image/*"
      @update:model-value="generatePreview"
    />
    
    <img v-if="preview" :src="preview" class="q-mt-md" style="max-width: 200px" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const imagen = ref(null)
const preview = ref('')

function generatePreview(file) {
  if (file) {
    preview.value = URL.createObjectURL(file)
  } else {
    preview.value = ''
  }
}
</script>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-file {
  --x-file-height: 32px;
  --x-file-border-color: rgba(0, 0, 0, 0.24);
  --x-file-border-color-focus: var(--q-primary);
  --x-file-border-color-error: var(--q-negative);
  --x-file-border-radius: 4px;
  --x-file-label-color: #757575;
  --x-file-icon-color: var(--q-primary);
  --x-file-font-size: 14px;
  --x-file-placeholder-color: #9e9e9e;
  --x-file-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XFile
    v-model="archivo"
    label="Archivo personalizado"
    class="custom-file"
  />
</template>

<style scoped>
.custom-file {
  --x-file-border-radius: 20px;
  --x-file-icon-color: #9c27b0;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-file-icon-color: #ff5722;
$x-input-height-dense: 36px;
```

## Clases Auxiliares

| Clase | Descripcion |
|-------|-------------|
| `x-file-large` | Altura mayor (40px) |
| `x-file-multiple` | Estilos para chips de archivos |
| `x-file-dropzone` | Estilo drag & drop |
| `x-file-dragover` | Estado cuando se arrastra sobre el area |

## Tipos de Accept Comunes

| Tipo | Valor |
|------|-------|
| Imagenes | `image/*` |
| Solo PNG/JPG | `image/png,image/jpeg` |
| PDFs | `.pdf` o `application/pdf` |
| Word | `.doc,.docx` |
| Excel | `.xls,.xlsx` |
| Certificados | `.cer,.pfx,.p12` |
| Cualquiera | `*` |

## Notas

- El icono de clip (paperclip) indica el area de seleccion
- Usa `clearable` para permitir quitar el archivo seleccionado
- Para subir archivos, usa `FormData` como se muestra en los ejemplos
- El prop `accept` filtra los archivos en el dialogo de seleccion
