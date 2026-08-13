# XSelect

Componente de seleccion que envuelve `QSelect` de Quasar con soporte para busqueda remota, filtrado local y opciones personalizadas.

## Instalacion

```vue
<script setup>
import XSelect from '@/components/XSelect/XSelect.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `bgColor` | `String` | `'white'` | Fondo del control (color Quasar/CSS). Invisible sobre fondos blancos; evita que el select se mimetice sobre un card/banner de color. `''` para el comportamiento clásico (transparente). |
| `includeAllOption` | `Boolean` | `false` | Agrega opcion "Todos" al inicio |
| `isClassic` | `Boolean` | `false` | Usa label flotante dentro del select |
| `dense` | `Boolean` | `true` | Modo compacto |
| `optionValue` | `String` | `'id'` | Propiedad para el valor de cada opcion |
| `optionLabel` | `String` | `'name'` | Propiedad para el label de cada opcion |
| `remoteUrl` | `String` | `null` | URL para busqueda remota |
| `filters` | `Object` | `{}` | Filtros adicionales para busqueda remota |
| `filterLocal` | `Boolean` | `false` | Habilita filtrado local de opciones |
| `showAddNewOption` | `Boolean` | `false` | Muestra opcion "Agregar nuevo" |
| `addNewLabel` | `String` | `'Agregar nuevo'` | Texto de la opcion agregar |
| `addNewIcon` | `String` | `'add_circle_outline'` | Icono de la opcion agregar |
| `addNewClass` | `String` | `'text-primary'` | Clase CSS de la opcion agregar |
| `minChars` | `Number` | `2` | Caracteres minimos para busqueda remota |
| `enforceMinChars` | `Boolean` | `true` | Forzar minimo de caracteres |
| `innerThrottleMs` | `Number` | `0` | Throttle interno en ms |
| `clearAfterSelect` | `Boolean` | `false` | Limpiar input despues de seleccionar |
| `preserveResults` | `Boolean` | `false` | Preservar resultados al cerrar |
| `keepInputAfterSelect` | `Boolean` | `false` | Mantener texto del input al seleccionar |
| `blurOnSelect` | `Boolean` | `true` | Quitar foco al seleccionar |
| `closeOnBlur` | `Boolean` | `true` | Cerrar dropdown al perder foco |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `any` | Valor seleccionado (v-model) |
| `click-new` | - | Click en opcion "Agregar nuevo" |
| `select` | `Object` | Objeto completo de la opcion seleccionada |
| `error` | `Error` | Error en busqueda remota |

## Metodos Expuestos

```javascript
const selectRef = ref(null)

// Enfocar el select
selectRef.value.focus()

// Mostrar/ocultar popup
selectRef.value.showPopup()
selectRef.value.hidePopup()

// Limpiar input
selectRef.value.clearInput()

// Reset completo
selectRef.value.reset()
```

## Uso Basico

```vue
<template>
  <XSelect
    v-model="selectedId"
    label="Seleccione una opcion"
    :options="opciones"
  />
</template>

<script setup>
const opciones = [
  { id: 1, name: 'Opcion 1' },
  { id: 2, name: 'Opcion 2' },
  { id: 3, name: 'Opcion 3' }
]
</script>
```

## Ejemplos

### Select con opcion "Todos"

```vue
<XSelect
  v-model="filtro"
  label="Estado"
  :options="estados"
  include-all-option
/>
```

### Select con filtrado local

```vue
<XSelect
  v-model="paisId"
  label="Pais"
  :options="paises"
  filter-local
  option-value="codigo"
  option-label="nombre"
/>
```

### Select con busqueda remota

```vue
<XSelect
  v-model="clienteId"
  label="Buscar cliente"
  remote-url="clientes/search"
  :min-chars="3"
  @select="handleClienteSelect"
/>
```

### Select con opcion "Agregar nuevo"

```vue
<XSelect
  v-model="categoriaId"
  label="Categoria"
  :options="categorias"
  show-add-new-option
  add-new-label="Crear categoria"
  @click-new="openCategoriaModal"
/>
```

### Select multiple

```vue
<XSelect
  v-model="tagsIds"
  label="Tags"
  :options="tags"
  multiple
  use-chips
/>
```

### Obtener objeto completo al seleccionar

```vue
<XSelect
  v-model="productoId"
  label="Producto"
  :options="productos"
  @select="producto => console.log(producto)"
/>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-select {
  --x-select-height: 40px;
  --x-select-border-color: rgba(0, 0, 0, 0.24);
  --x-select-border-color-focus: var(--q-primary);
  --x-select-border-color-error: var(--q-negative);
  --x-select-border-radius: 4px;
  --x-select-label-color: #757575;
  --x-select-font-size: 14px;
  --x-select-dropdown-max-height: 300px;
  --x-select-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XSelect
    v-model="valor"
    label="Select personalizado"
    class="custom-select"
    :options="opciones"
  />
</template>

<style scoped>
.custom-select {
  --x-select-border-radius: 20px;
  --x-select-dropdown-max-height: 400px;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-select-height: 44px;
$x-select-dropdown-max-height: 350px;
$x-border-radius: 8px;
```

## Caracteristicas Especiales

### Busqueda Remota

Cuando se configura `remote-url`, el componente hace peticiones POST a `/store/{remoteUrl}` con los filtros y el valor de busqueda.

### Throttle Interno

Usa `inner-throttle-ms` para limitar las peticiones al servidor durante la escritura rapida.

### Preservar Resultados

Con `preserve-results`, los resultados de la ultima busqueda se mantienen al reabrir el dropdown.

### Opcion Agregar Nuevo

La opcion "Agregar nuevo" aparece al final de la lista y emite el evento `click-new` para abrir un modal de creacion.

## Prop `help` (v2.4.40)

Muestra un ícono **"?"** con tooltip informativo junto al label (usa [XHelpTip](../XHelpTip/README.md)).

```vue
<XSelect label="Incluye IGV" help="El precio ya trae el IGV incluido." />
```
