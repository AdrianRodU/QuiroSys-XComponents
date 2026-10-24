<script setup>
/**
 * XFieldCheck (v2.30.0): el check verde de "este campo tiene valor y no está en error", el mismo en todos los campos
 * de formulario de la librería (Adrián 24/10/2026: "en todos los campos, no solo los obligatorios; en los modales, en
 * todos lados"). Cada componente decide cuándo mostrarlo con isFilled()/isInactive() de ./isFilled.js: hay valor, no
 * hay error y el campo no es de solo lectura ni está deshabilitado. Es solo el icono: sin lógica propia.
 */
defineOptions({ name: 'XFieldCheck' })
defineProps({
  size: { type: String, default: '18px' },
  color: { type: String, default: 'teal-7' },
})
</script>

<template>
  <q-icon name="check_circle" :color="color" :size="size" class="x-field__ok" aria-hidden="true" />
</template>
