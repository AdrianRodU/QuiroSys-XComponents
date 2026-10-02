# XDatepicker

Componente de selector de fecha que combina `QInput` y `QDate` de Quasar con formato personalizable.

## Instalacion

```vue
<script setup>
import XDatepicker from '@/components/XDatepicker/XDatepicker.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `modelValue` | `String \| null` | `''` | Valor de la fecha (v-model) |
| `isClassic` | `Boolean` | `false` | Usa label flotante dentro del input |
| `dense` | `Boolean` | `true` | Modo compacto |
| `outlined` | `Boolean` | `true` | Estilo outlined |
| `clearable` | `Boolean` | `false` | Mostrar boton para limpiar |
| `error` | `String` | `null` | Mensaje de error |
| `valueMask` | `String` | `'YYYY-MM-DD'` | Formato del valor (v-model) |
| `displayMask` | `String` | `'DD/MM/YYYY'` | Formato de visualizacion |
| `options` | `Function` | `null` | Funcion para habilitar/deshabilitar fechas |
| `isRequired` | `Boolean` | `false` | Campo obligatorio: asterisco rojo en la etiqueta, como XInput (solo marca, no valida). Tambien en `XTimepicker` (v2.18.0) |
| `defaultYearMonth` | `String` | `null` | Mes que muestra el calendario al abrirse cuando el campo esta vacio (`'YYYY/MM'`). Sin el, abre en el mes actual: si `options` solo deja elegir fechas de un mes anterior, todos los dias salian apagados (v2.22.0) |
| `navigationMinYearMonth` | `String` | `null` | Mes mas antiguo al que deja navegar el calendario (`'YYYY/MM'`) (v2.22.0) |
| `navigationMaxYearMonth` | `String` | `null` | Mes mas reciente al que deja navegar el calendario (`'YYYY/MM'`) (v2.22.0) |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `String` | Cambio del valor |
| `change` | `String` | Cambio del valor (alias) |

## Uso Basico

```vue
<template>
  <XDatepicker
    v-model="fecha"
    label="Fecha de nacimiento"
  />
</template>

<script setup>
import { ref } from 'vue'

const fecha = ref('')
</script>
```

## Ejemplos

### Formato personalizado

```vue
<!-- Guardar en formato ISO, mostrar en formato local -->
<XDatepicker
  v-model="fecha"
  label="Fecha"
  value-mask="YYYY-MM-DD"
  display-mask="DD/MM/YYYY"
/>

<!-- Formato americano -->
<XDatepicker
  v-model="fecha"
  label="Date"
  value-mask="YYYY-MM-DD"
  display-mask="MM/DD/YYYY"
/>
```

### Con limpieza

```vue
<XDatepicker
  v-model="fecha"
  label="Fecha opcional"
  clearable
/>
```

### Con validacion de error

```vue
<XDatepicker
  v-model="fechaInicio"
  label="Fecha de inicio"
  :error="errors.fechaInicio"
/>
```

### Limitar fechas disponibles

```vue
<template>
  <XDatepicker
    v-model="fecha"
    label="Fecha futura"
    :options="onlyFutureDates"
  />
</template>

<script setup>
import { date } from 'quasar'

// Solo fechas futuras
function onlyFutureDates(dateString) {
  const today = date.formatDate(new Date(), 'YYYY/MM/DD')
  return dateString >= today
}

// Solo dias laborables (lun-vie)
function onlyWeekdays(dateString) {
  const d = date.extractDate(dateString, 'YYYY/MM/DD')
  const dayOfWeek = d.getDay()
  return dayOfWeek !== 0 && dayOfWeek !== 6
}

// Rango de fechas
function dateRange(dateString) {
  return dateString >= '2024/01/01' && dateString <= '2024/12/31'
}
</script>
```

### En un formulario

```vue
<template>
  <q-form @submit="handleSubmit">
    <XDatepicker
      v-model="form.fechaInicio"
      label="Fecha de inicio"
      :error="errors.fechaInicio"
    />

    <XDatepicker
      v-model="form.fechaFin"
      label="Fecha de fin"
      :options="minFechaFin"
      :error="errors.fechaFin"
    />

    <XButton type="submit" label="Guardar" />
  </q-form>
</template>

<script setup>
import { ref, computed } from 'vue'

const form = ref({
  fechaInicio: '',
  fechaFin: ''
})

// Fecha fin debe ser mayor o igual a fecha inicio
const minFechaFin = computed(() => {
  return (dateString) => {
    if (!form.value.fechaInicio) return true
    return dateString >= form.value.fechaInicio.replace(/-/g, '/')
  }
})
</script>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-input-datepicker {
  --x-datepicker-height: 32px;
  --x-datepicker-border-color: rgba(0, 0, 0, 0.24);
  --x-datepicker-border-color-focus: var(--q-primary);
  --x-datepicker-border-color-error: var(--q-negative);
  --x-datepicker-border-radius: 4px;
  --x-datepicker-label-color: #757575;
  --x-datepicker-icon-color: var(--q-primary);
  --x-datepicker-font-size: 14px;
  --x-datepicker-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <XDatepicker
    v-model="fecha"
    label="Fecha personalizada"
    class="custom-datepicker"
  />
</template>

<style scoped>
.custom-datepicker {
  --x-datepicker-border-radius: 20px;
  --x-datepicker-icon-color: #ff5722;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-datepicker-icon-color: #9c27b0;
$x-input-height-dense: 36px;
$x-border-radius: 8px;
```

## Formatos de Mascara

El componente usa los tokens de Quasar para formatear fechas:

| Token | Descripcion | Ejemplo |
|-------|-------------|---------|
| `YYYY` | Anio 4 digitos | 2024 |
| `YY` | Anio 2 digitos | 24 |
| `MM` | Mes 2 digitos | 01-12 |
| `M` | Mes 1-2 digitos | 1-12 |
| `DD` | Dia 2 digitos | 01-31 |
| `D` | Dia 1-2 digitos | 1-31 |

## Notas

- El input es de solo lectura; la fecha se selecciona desde el popup
- `valueMask` define el formato del v-model (para backend)
- `displayMask` define el formato visual (para el usuario)
- La funcion `options` recibe fechas en formato `YYYY/MM/DD`
