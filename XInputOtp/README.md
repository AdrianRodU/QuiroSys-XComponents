# XInputOtp

Componente de entrada OTP (One-Time Password) para codigos de verificacion de multiples digitos.

## Instalacion

```vue
<script setup>
import XInputOtp from '@/components/XInputOtp/XInputOtp.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `modelValue` | `String` | `''` | Valor del codigo (v-model) |
| `length` | `Number` | `6` | Cantidad de digitos |
| `disabled` | `Boolean` | `false` | Deshabilitar inputs |
| `error` | `Boolean` | `false` | Mostrar estado de error |
| `autoFocus` | `Boolean` | `true` | Auto-focus al montar |
| `mask` | `Boolean` | `false` | Oculta los digitos tras puntos (type=password). Para un PIN que la persona reutiliza; un OTP de un solo uso no lo necesita |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `update:modelValue` | `String` | Emitido al cambiar el valor |
| `complete` | `String` | Emitido cuando se completan todos los digitos |

## Metodos Expuestos

```javascript
const otpRef = ref(null)

// Limpiar todos los inputs y enfocar el primero
otpRef.value.clear()

// Enfocar el primer input
otpRef.value.focus()
```

## Uso Basico

```vue
<template>
  <XInputOtp
    v-model="codigo"
    @complete="handleComplete"
  />
</template>

<script setup>
import { ref } from 'vue'

const codigo = ref('')

function handleComplete(code) {
  console.log('Codigo completo:', code)
  // Validar codigo...
}
</script>
```

## Ejemplos

### OTP de 4 digitos

```vue
<XInputOtp
  v-model="pin"
  :length="4"
  @complete="validatePin"
/>
```

### OTP con error

```vue
<XInputOtp
  v-model="codigo"
  :error="hasError"
  @complete="handleComplete"
/>

<p v-if="hasError" class="text-negative">
  Codigo incorrecto
</p>
```

### OTP sin auto-focus

```vue
<XInputOtp
  v-model="codigo"
  :auto-focus="false"
/>
```

### OTP deshabilitado

```vue
<XInputOtp
  v-model="codigo"
  disabled
/>
```

### Limpiar y reenfocar con ref

```vue
<template>
  <XInputOtp
    ref="otpRef"
    v-model="codigo"
    :error="hasError"
    @complete="handleComplete"
  />

  <XButton
    label="Reenviar codigo"
    @click="handleResend"
  />
</template>

<script setup>
import { ref } from 'vue'

const otpRef = ref(null)
const codigo = ref('')
const hasError = ref(false)

async function handleComplete(code) {
  try {
    await validateCode(code)
  } catch (error) {
    hasError.value = true
    otpRef.value.clear()
  }
}

function handleResend() {
  hasError.value = false
  otpRef.value.clear()
  // Reenviar codigo...
}
</script>
```

## Personalizacion CSS

El componente expone variables CSS para personalizacion:

```scss
.x-input-otp-container {
  --x-otp-input-size: 50px;
  --x-otp-input-height: 56px;
  --x-otp-input-font-size: 24px;
  --x-otp-input-gap: 8px;
  --x-otp-border-color: rgba(0, 0, 0, 0.24);
  --x-otp-border-color-focus: var(--q-primary);
  --x-otp-border-color-error: var(--q-negative);
  --x-otp-border-radius: 4px;
  --x-otp-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Ejemplo de personalizacion

```vue
<template>
  <div class="custom-otp">
    <XInputOtp v-model="codigo" />
  </div>
</template>

<style scoped>
.custom-otp {
  --x-otp-input-size: 60px;
  --x-otp-input-height: 70px;
  --x-otp-input-font-size: 32px;
  --x-otp-border-radius: 12px;
}
</style>
```

### Personalizacion global via SCSS

Modifica las variables en `_variables.scss`:

```scss
$x-otp-input-size: 55px;
$x-otp-input-font-size: 28px;
$x-otp-input-gap: 12px;
```

## Caracteristicas Especiales

### Auto-navegacion

- Al escribir un digito, el foco se mueve automaticamente al siguiente input
- Al presionar Backspace en un input vacio, el foco vuelve al anterior

### Soporte de Pegado

El componente detecta cuando el usuario pega un codigo completo y lo distribuye automaticamente en los inputs correspondientes.

### Validacion de Entrada

Solo se permiten caracteres numericos (0-9). Cualquier otro caracter es ignorado automaticamente.

### Responsivo

Los inputs se ajustan automaticamente en pantallas pequenas:
- < 600px: Reduce tamanio a 42x48px con fuente 20px
- < 380px: Reduce tamanio a 36x42px con fuente 18px

### Evento Complete

El evento `complete` se emite solo cuando todos los digitos han sido ingresados, facilitando la validacion automatica.
