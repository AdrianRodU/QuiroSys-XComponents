# XToggle

Componente de interruptor (switch/toggle) que envuelve `QToggle` de Quasar con estilos personalizados.

## Instalacion

```vue
<script setup>
import XToggle from '@/components/XToggle/XToggle.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `modelValue` | `Boolean \| Array \| String` | *required* | Valor del toggle (v-model) |
| `isClassic` | `Boolean` | `true` (`formDefaults.isClassic`) | Label junto al toggle; en `false`, el label va arriba |
| `label` | `String` | `''` | Texto del label |
| `color` | `String` | `'primary'` | Color cuando esta activo (cualquier color de Quasar: `teal`, `purple`, `grey-7`...) |
| `disable` | `Boolean` | `false` | Deshabilitar toggle |
| `indeterminateValue` | `Boolean` | `false` | Valor para estado indeterminado |
| `hint` | `String` | `''` | Texto de ayuda debajo del toggle |
| `tooltipText` | `String` | `''` | Texto del tooltip |
| `tooltipColor` | `String` | `''` | Color del tooltip |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `Boolean \| Array \| String` | Cambio del valor |

## Slots

| Slot | Descripcion |
|------|-------------|
| `hint` | Contenido personalizado para el hint |

## Uso Basico

```vue
<template>
  <XToggle
    v-model="notificaciones"
    label="Recibir notificaciones"
  />
</template>

<script setup>
import { ref } from 'vue'

const notificaciones = ref(true)
</script>
```

## Ejemplos

### Toggle con label superior

```vue
<!-- is-classic en false: label arriba del toggle -->
<XToggle
  v-model="modoOscuro"
  :is-classic="false"
  label="Modo oscuro"
/>
```

### Toggle clasico (label al lado)

```vue
<!-- Label junto al toggle -->
<XToggle
  v-model="activo"
  label="Activar servicio"
  is-classic
/>
```

### Con colores

```vue
<XToggle v-model="val1" label="Primary" color="primary" />
<XToggle v-model="val2" label="Secondary" color="secondary" />
<XToggle v-model="val3" label="Positive" color="positive" />
<XToggle v-model="val4" label="Negative" color="negative" />
<XToggle v-model="val5" label="Warning" color="warning" />
```

### Con hint

```vue
<XToggle
  v-model="autoGuardado"
  label="Auto-guardado"
  hint="Guarda automaticamente cada 5 minutos"
/>
```

### Con tooltip

```vue
<XToggle
  v-model="modoAvanzado"
  label="Modo avanzado"
  tooltip-text="Habilita opciones adicionales para usuarios expertos"
  tooltip-color="bg-dark"
/>
```

### Toggle deshabilitado

```vue
<XToggle
  v-model="premium"
  label="Funciones premium"
  disable
/>
```

### En configuracion

```vue
<template>
  <q-list>
    <q-item>
      <q-item-section>
        <q-item-label>Notificaciones por email</q-item-label>
        <q-item-label caption>Recibir resumen diario</q-item-label>
      </q-item-section>
      <q-item-section side>
        <XToggle v-model="config.emailNotif" />
      </q-item-section>
    </q-item>

    <q-item>
      <q-item-section>
        <q-item-label>Notificaciones push</q-item-label>
        <q-item-label caption>Alertas en tiempo real</q-item-label>
      </q-item-section>
      <q-item-section side>
        <XToggle v-model="config.pushNotif" />
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { ref } from 'vue'

const config = ref({
  emailNotif: true,
  pushNotif: false
})
</script>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-toggle {
  --x-toggle-width: 36px;
  --x-toggle-height: 20px;
  --x-toggle-color: var(--q-primary);
  --x-toggle-track-color: rgba(0, 0, 0, 0.38);
  --x-toggle-thumb-color: #fafafa;
  --x-toggle-border-radius: 10px;
  --x-toggle-label-color: #1d1d1d;
  --x-toggle-label-font-size: 14px;
  --x-toggle-hint-color: #757575;
  --x-toggle-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XToggle
    v-model="valor"
    label="Toggle personalizado"
    class="my-toggle"
  />
</template>

<style scoped>
.my-toggle {
  --x-toggle-width: 50px;
  --x-toggle-height: 28px;
  --x-toggle-border-radius: 14px;
  --x-toggle-color: #9c27b0;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-toggle-width: 40px;
$x-toggle-height: 22px;
```

## Clases Auxiliares

| Clase | Descripcion |
|-------|-------------|
| `x-toggle-sm` | Tamanio pequenio (30x16px) |
| `x-toggle-md` | Tamanio mediano (36x20px) |
| `x-toggle-lg` | Tamanio grande (48x26px) |
| `x-toggle-primary` | Color primario |
| `x-toggle-secondary` | Color secundario |
| `x-toggle-positive` | Color verde |
| `x-toggle-negative` | Color rojo |
| `x-toggle-warning` | Color amarillo |
| `x-toggle-info` | Color celeste |

## Diferencia con XCheckbox

| Caracteristica | XToggle | XCheckbox |
|----------------|---------|-----------|
| Uso tipico | On/Off, configuraciones | Selecciones multiples |
| Feedback visual | Inmediato (switch) | Click discreto |
| Semantica | Activar/desactivar | Seleccionar/deseleccionar |

## Notas

- Por defecto, el label aparece arriba del toggle
- Con `is-classic`, el label aparece al lado
- Ideal para configuraciones y preferencias de usuario
- El tooltip aparece al hacer hover sobre el toggle
