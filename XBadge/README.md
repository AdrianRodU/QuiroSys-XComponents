# XBadge

Componente de etiqueta/badge que envuelve `QBadge` de Quasar con estilos y variantes personalizadas.

## Instalacion

```vue
<script setup>
import XBadge from '@/components/XBadge/XBadge.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `label` | `String` | `''` | Texto del badge |
| `color` | `String` | `null` | Color propio: un nombre del mapa (`green`, `orange`, `yellow`, `teal`, `grey`, `success`, `danger`…; también `positive` y `negative` de Quasar) o un color CSS (hex, rgb). Un nombre que no se puede pintar (p. ej. `orange-8`) sale gris y avisa en la consola. |
| `isLightenColor` | `Boolean` | sin pasar | Con `color`: sin pasarlo (o `true`), fondo suave y texto en el color; `false`, fondo fuerte y texto blanco (desde v2.36.0; antes, sin pasarlo, fondo y texto salían del mismo color). |
| `variant` | `String` | `'light'` | `'light'` (fondo suave) o `'solid'` (fondo fuerte y texto blanco). |
| `type` | `String` | `null` | Tipo predefinido de estilo |

### Tipos Disponibles

- `success` - Verde para estados exitosos
- `danger` / `error` - Rojo para errores
- `warning` - Amarillo para advertencias
- `info` - Celeste para informacion
- `primary` - Color primario de la app
- `secondary` - Color secundario
- `neutral` / `default` - Gris neutro

## Uso Basico

```vue
<template>
  <XBadge label="Activo" type="success" />
</template>
```

## Ejemplos

### Tipos predefinidos

```vue
<XBadge label="Completado" type="success" />
<XBadge label="Error" type="danger" />
<XBadge label="Pendiente" type="warning" />
<XBadge label="Informacion" type="info" />
<XBadge label="Principal" type="primary" />
<XBadge label="Inactivo" type="neutral" />
```

### Color propio

```vue
<!-- Fondo suave y texto en el color (desde v2.36.0, también sin is-lighten-color) -->
<XBadge label="doc. pendiente" color="orange" />
<XBadge label="Soft" color="#1976d2" is-lighten-color />

<!-- Fondo fuerte y texto blanco -->
<XBadge label="Pagado" color="green" variant="solid" />
```

### En una tabla

```vue
<template>
  <q-table :rows="users" :columns="columns">
    <template #body-cell-status="props">
      <q-td :props="props">
        <XBadge
          :label="props.row.status"
          :type="getStatusType(props.row.status)"
        />
      </q-td>
    </template>
  </q-table>
</template>

<script setup>
function getStatusType(status) {
  const types = {
    'Activo': 'success',
    'Inactivo': 'neutral',
    'Pendiente': 'warning',
    'Rechazado': 'danger'
  }
  return types[status] || 'default'
}
</script>
```

### Con clases adicionales

```vue
<!-- Tamanios -->
<XBadge label="Small" type="success" class="x-badge-sm" />
<XBadge label="Medium" type="success" class="x-badge-md" />
<XBadge label="Large" type="success" class="x-badge-lg" />

<!-- Outlined -->
<XBadge label="Outlined" type="primary" class="x-badge-outlined" />

<!-- Pill (bordes redondeados) -->
<XBadge label="Pill" type="info" class="x-badge-pill" />

<!-- Dot (solo circulo) -->
<XBadge type="success" class="x-badge-dot" />
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-badge {
  --x-badge-padding: 4px 8px;
  --x-badge-font-size: 12px;
  --x-badge-border-radius: 4px;
  --x-badge-font-weight: 500;
  --x-badge-line-height: 1.4;
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XBadge label="Custom" type="success" class="custom-badge" />
</template>

<style scoped>
.custom-badge {
  --x-badge-padding: 6px 16px;
  --x-badge-border-radius: 20px;
  --x-badge-font-size: 14px;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-badge-padding: 6px 10px;
$x-badge-font-size: 13px;
$x-badge-border-radius: 6px;
```

## Clases Auxiliares

| Clase | Descripcion |
|-------|-------------|
| `x-badge-sm` | Tamanio pequenio |
| `x-badge-md` | Tamanio mediano (default) |
| `x-badge-lg` | Tamanio grande |
| `x-badge-outlined` | Solo borde, sin fondo |
| `x-badge-pill` | Bordes completamente redondeados |
| `x-badge-dot` | Solo circulo indicador |
| `x-badge-with-icon` | Para badges con iconos |

## Uso con Iconos

```vue
<XBadge type="success" class="x-badge-with-icon">
  <template #default>
    <q-icon name="check" />
    Verificado
  </template>
</XBadge>
```

## Notas

- El fondo suave usa `lightenColor` de `@esolutions/js-utils` (aclara colores hex)
- Un color que no es del mapa ni un color CSS (p. ej. `orange-8`, `amber-8`, `blue-grey-7`) sale gris y deja un aviso en la consola (una vez por nombre): antes salía con el fondo azul por defecto de QBadge o sin fondo
- Los tipos predefinidos usan los colores de Quasar (`$x-positive`, `$x-negative`, etc.)
- El badge aplica `margin: 0 !important` para evitar espaciados no deseados
