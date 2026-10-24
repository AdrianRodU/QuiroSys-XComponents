<script setup>
import { computed, ref, useAttrs } from 'vue'
import XFieldCheck from '../XFieldCheck/XFieldCheck.vue'
import { isFilled, isInactive } from '../XFieldCheck/isFilled.js'
import { formDefaults } from '@esolutions/js-utils'

// Define las opciones del componente
defineOptions({
  name: 'XFile',
  inheritAttrs: false,
});

// Props del componente
const props = defineProps({
  /** Check verde cuando el campo tiene valor y no está en error (v2.30.0, Adrián 24/10: en todos los campos, en
   *  todos lados). Nunca en un campo de solo lectura o deshabilitado. `:check="false"` lo apaga. */
  check: { type: Boolean, default: true },
  modelValue: {
    type: [File, Array],
    default: () => null,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  outlined: {
    type: Boolean,
    default: formDefaults.outlined,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  errorMessage: {
    type: String,
    default: '',
  },
  clearable: {
    type: Boolean,
    default: false,
  },
  accept: {
    type: String,
    default: '',
  },
  /** Campo obligatorio: asterisco rojo en la etiqueta, como XInput (solo marca, no valida). v2.20.0 */
  isRequired: {
    type: Boolean,
    default: false,
  },
})

// Eventos emitidos
const emit = defineEmits(['update:modelValue', 'clear-error'])

// Atributos externos al componente
const attrs = useAttrs()

// Estado local para manejar errores personalizados
const localErrorMessage = ref(props.errorMessage)
const hasError = computed(() => localErrorMessage.value !== '')
// Check verde (XFieldCheck): hay archivo, no hay error y el campo no está inactivo.
const showOk = computed(() => props.check && !isInactive(attrs) && isFilled(props.modelValue) && !hasError.value)

// Manejador de actualización de archivos
function onInput(val) {
  emit('update:modelValue', val)
  if (props.errorMessage) {
    emit('clear-error')
  }
}
</script>

<template>
  <q-file
    v-bind="{
      ...attrs,
      label,
      placeholder,
      outlined,
      multiple,
      rules,
      error: hasError,
      errorMessage,
      clearable,
      accept,
      'aria-required': isRequired ? 'true' : null
    }"
    :model-value="modelValue"
    :label-slot="!!label && isRequired"
    @update:model-value="onInput"
  >
    <!-- Etiqueta con el asterisco de obligatorio (v2.20.0), como XInput -->
    <template v-if="label && isRequired" #label>
      <span>{{ label }}</span>
      <span class="text-negative" aria-hidden="true">*</span>
    </template>

    <!-- Icono adjunto personalizado -->
    <template #append>
      <x-field-check v-if="showOk" class="q-mr-xs" />
      <q-icon
        name="fal fa-paperclip"
        color="primary"
        size="md"
        class="q-mr-xs"
      />
    </template>
  </q-file>
</template>
