# XCheckbox

Componente de checkbox que envuelve `QCheckbox` de Quasar con estilos personalizados y soporte para tooltip.

## Instalacion

```vue
<script setup>
import XCheckbox from '@/components/XCheckbox/XCheckbox.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `modelValue` | `Boolean \| Array \| String` | *required* | Valor del checkbox (v-model) |
| `isClassic` | `Boolean` | `false` | Label junto al checkbox (estilo clasico) |
| `label` | `String` | `''` | Texto del label |
| `color` | `String` | `'primary'` | Color del checkbox |
| `disable` | `Boolean` | `false` | Deshabilitar checkbox |
| `indeterminateValue` | `Boolean` | `false` | Valor para estado indeterminado |
| `hint` | `String` | `''` | Texto de ayuda debajo del checkbox |
| `tooltipText` | `String` | `''` | Texto del tooltip |
| `tooltipColor` | `String` | `''` | Color del tooltip |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `Boolean \| Array \| String` | Cambio del valor |

## Slots

| Slot | Descripcion |
|------|-------------|
| default | Etiqueta con marcado propio, junto a la casilla (v2.21.0). Para opciones con mas de un dato: un codigo y un nombre, un nombre y su explicacion. |
| `hint` | Contenido personalizado para el hint |

## Uso Basico

```vue
<template>
  <XCheckbox
    v-model="aceptaTerminos"
    label="Acepto los terminos y condiciones"
  />
</template>

<script setup>
import { ref } from 'vue'

const aceptaTerminos = ref(false)
</script>
```

## Ejemplos

### Checkbox con label superior

```vue
<!-- Default: label arriba del checkbox -->
<XCheckbox
  v-model="activo"
  label="Estado activo"
/>
```

### Checkbox clasico (label al lado)

```vue
<!-- Label junto al checkbox -->
<XCheckbox
  v-model="recuerdame"
  label="Recordar sesion"
  is-classic
/>
```

### Con colores

```vue
<XCheckbox v-model="val1" label="Primary" color="primary" />
<XCheckbox v-model="val2" label="Secondary" color="secondary" />
<XCheckbox v-model="val3" label="Positive" color="positive" />
<XCheckbox v-model="val4" label="Negative" color="negative" />
<XCheckbox v-model="val5" label="Warning" color="warning" />
```

### Con hint

```vue
<XCheckbox
  v-model="newsletter"
  label="Recibir newsletter"
  hint="Te enviaremos noticias semanales"
/>
```

### Con tooltip

```vue
<XCheckbox
  v-model="opcionAvanzada"
  label="Habilitar modo avanzado"
  tooltip-text="Esta opcion activa funciones adicionales"
  tooltip-color="bg-primary"
/>
```

### Checkbox deshabilitado

```vue
<XCheckbox
  v-model="bloqueado"
  label="Opcion bloqueada"
  disable
/>
```

### Lista de checkboxes

```vue
<template>
  <div class="q-gutter-sm">
    <XCheckbox
      v-for="opcion in opciones"
      :key="opcion.value"
      v-model="seleccionados"
      :label="opcion.label"
      :val="opcion.value"
      is-classic
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const opciones = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' }
]

const seleccionados = ref(['email'])
</script>
```

### Estado indeterminado

```vue
<template>
  <XCheckbox
    v-model="selectAll"
    label="Seleccionar todos"
    :indeterminate-value="hasPartialSelection"
    @update:model-value="handleSelectAll"
  />

  <div class="q-ml-md">
    <XCheckbox
      v-for="item in items"
      :key="item.id"
      v-model="item.selected"
      :label="item.name"
      is-classic
    />
  </div>
</template>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.custom-checkbox {
  --x-checkbox-size: 20px;
  --x-checkbox-color: var(--q-primary);
  --x-checkbox-border-color: rgba(0, 0, 0, 0.24);
  --x-checkbox-border-radius: 4px;
  --x-checkbox-label-color: #1d1d1d;
  --x-checkbox-label-font-size: 14px;
  --x-checkbox-hint-color: #757575;
  --x-checkbox-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XCheckbox
    v-model="valor"
    label="Checkbox personalizado"
    class="my-checkbox"
  />
</template>

<style scoped>
.my-checkbox {
  --x-checkbox-size: 24px;
  --x-checkbox-border-radius: 50%;
  --x-checkbox-color: #9c27b0;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-checkbox-size: 22px;
```

## Clases Auxiliares

| Clase | Descripcion |
|-------|-------------|
| `custom-checkbox-sm` | Tamanio pequenio (16px) |
| `custom-checkbox-md` | Tamanio mediano (20px) |
| `custom-checkbox-lg` | Tamanio grande (24px) |
| `custom-checkbox-primary` | Color primario |
| `custom-checkbox-secondary` | Color secundario |
| `custom-checkbox-positive` | Color verde |
| `custom-checkbox-negative` | Color rojo |
| `custom-checkbox-warning` | Color amarillo |
| `custom-checkbox-info` | Color celeste |

## Notas

- Por defecto, el label aparece arriba del checkbox
- Con `is-classic`, el label aparece al lado del checkbox
- Soporta array para multiples selecciones usando el prop `val`
- El tooltip aparece al hacer hover sobre el checkbox

## Prop `help` (v2.4.40)

Muestra un ícono **"?"** con tooltip informativo junto al label (usa [XHelpTip](../XHelpTip/README.md)).

```vue
<XCheckbox label="Incluye IGV" help="El precio ya trae el IGV incluido." />
```
