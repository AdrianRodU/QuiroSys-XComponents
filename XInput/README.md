# XInput

Componente de entrada de texto que envuelve `QInput` de Quasar con estilos y funcionalidades personalizadas.

## Instalacion

```vue
<script setup>
import XInput from '@/components/XInput/XInput.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `modelValue` | `String \| Number` | `''` | Valor del input (v-model) |
| `isClassic` | `Boolean` | `false` | Usa label flotante dentro del input |
| `dense` | `Boolean` | `true` | Modo compacto |
| `error` | `String` | `null` | Mensaje de error a mostrar |
| `autofocus` | `Boolean` | `false` | Auto-focus al montar |
| `isRequired` | `Boolean` | `false` | Muestra asterisco de requerido |
| `bgColor` | `String` | `'white'` | Fondo del control (color Quasar/CSS). Invisible sobre fondos blancos; evita que el input se mimetice sobre un card/banner de color. `''` para el comportamiento clásico (transparente). |

Ademas, soporta todos los atributos de `QInput` de Quasar como `label`, `type`, `placeholder`, `disabled`, `readonly`, etc.

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `String \| Number` | Emitido al cambiar el valor |
| `input` | `Event` | Evento nativo de input |
| `change` | `Event` | Evento nativo de change |

## Slots

| Slot | Descripcion |
|------|-------------|
| `before` | Contenido antes del input |
| `after` | Contenido despues del input |
| `prepend` | Icono/contenido dentro del input (izquierda) |
| `append` | Icono/contenido dentro del input (derecha) |
| `hint` | Texto de ayuda debajo del input |
| `error` | Mensaje de error personalizado |
| `counter` | Contador de caracteres |
| `loading` | Indicador de carga |

## Uso Basico

```vue
<template>
  <XInput
    v-model="email"
    label="Correo electronico"
    type="email"
    placeholder="ejemplo@correo.com"
  />
</template>
```

## Ejemplos

### Input con label externo (default)

```vue
<XInput
  v-model="nombre"
  label="Nombre completo"
  placeholder="Ingrese su nombre"
/>
```

### Input con label flotante (clasico)

```vue
<XInput
  v-model="nombre"
  label="Nombre completo"
  is-classic
/>
```

### Input de password

```vue
<XInput
  v-model="password"
  label="Contrasena"
  type="password"
/>
```

El componente automaticamente agrega el toggle de visibilidad para inputs tipo password.

### Input con error

```vue
<XInput
  v-model="email"
  label="Email"
  :error="errors.email"
  @focus="errors.email = null"
/>
```

### Input requerido

```vue
<XInput
  v-model="campo"
  label="Campo obligatorio"
  is-required
/>
```

### Input con iconos

```vue
<XInput v-model="busqueda" label="Buscar">
  <template #prepend>
    <q-icon name="search" />
  </template>
</XInput>

<XInput v-model="monto" label="Monto">
  <template #append>
    <span class="text-grey-6">PEN</span>
  </template>
</XInput>
```

### Input no denso (large)

```vue
<XInput
  v-model="texto"
  label="Input grande"
  :dense="false"
/>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-input {
  --x-input-height: 40px;
  --x-input-height-dense: 32px;
  --x-input-border-color: rgba(0, 0, 0, 0.24);
  --x-input-border-color-focus: var(--q-primary);
  --x-input-border-color-error: var(--q-negative);
  --x-input-border-radius: 4px;
  --x-input-label-color: #757575;
  --x-input-placeholder-color: #9e9e9e;
  --x-input-font-size: 14px;
  --x-input-padding-x: 8px;
  --x-input-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XInput
    v-model="valor"
    label="Input personalizado"
    class="custom-input"
  />
</template>

<style scoped>
.custom-input {
  --x-input-border-radius: 20px;
  --x-input-border-color-focus: #ff5722;
  --x-input-height-dense: 40px;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
// Antes de importar el componente
$x-input-height: 44px;
$x-input-height-dense: 36px;
$x-input-label-color: #333;
$x-border-radius: 8px;
```

## Caracteristicas Especiales

### Toggle de Password

Para inputs con `type="password"`, el componente automaticamente muestra un icono para alternar la visibilidad de la contrasena.

### Label con Asterisco

Cuando `is-required="true"`, se muestra un asterisco rojo junto al label. Esto es solo visual y no activa validacion nativa del navegador.

### Modo Clasico vs Default

- **Default**: El label aparece arriba del input como un `<label>` separado
- **Clasico** (`is-classic`): El label flota dentro del input al estilo Material Design

## Prop `help` (v2.4.40)

Muestra un ícono **"?"** con tooltip informativo junto al label (usa [XHelpTip](../XHelpTip/README.md)).

```vue
<XInput label="Incluye IGV" help="El precio ya trae el IGV incluido." />
```
