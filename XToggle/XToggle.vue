<script setup>
import { computed, useAttrs } from 'vue'
import { formDefaults } from '@esolutions/js-utils'

defineOptions({
  name: 'XToggle',
  inheritAttrs: false // Control manual de atributos
})

// --- PROPS: Configuración del toggle ---
const props = defineProps({
  // Valor vinculado al v-model (booleano, array o string)
  modelValue: {
    type: [Boolean, Array, String],
    required: true
  },

  // Si true, el label aparece al lado del toggle
  isClassic: {
    type: Boolean,
    default: formDefaults.isClassic,
  },

  // Etiqueta que se muestra arriba o al lado del toggle
  label: {
    type: String,
    default: ''
  },

  // Color del toggle (Quasar)
  color: {
    type: String,
    default: 'primary'
  },

  // Estado deshabilitado
  disable: {
    type: Boolean,
    default: false
  },

  // Activa el estado indeterminado (semi-activo)
  indeterminateValue: {
    type: Boolean,
    default: false
  },

  // Texto que se muestra debajo del toggle
  hint: {
    type: String,
    default: ''
  },

  // Texto del tooltip
  tooltipText: {
    type: String,
    default: ''
  },

  // Clase del fondo del tooltip (ej: 'bg-primary')
  tooltipColor: {
    type: String,
    default: ''
  }
})

// --- EMITS: Comunicación al exterior ---
const emit = defineEmits(['update:modelValue'])

// --- Atributos dinámicos pasados al componente ---
const attrs = useAttrs()

// ID único con prefijo estandarizado, útil para <label for="">
const fallbackId = `app-q-checkbox-${Math.random().toString(36).substring(2, 9)}`
const elementId = computed(() =>
  attrs.id ? `app-q-checkbox-${attrs.id}` : fallbackId
)

// --- Mostrar label arriba del toggle si no es estilo clásico ---
const showTopLabel = computed(() => !props.isClassic && props.label)
const checkboxLabel = computed(() => props.isClassic ? props.label : undefined)

// --- Mostrar el tooltip solo si hay texto definido ---
const hasTooltip = computed(() => !!props.tooltipText)

// --- Computed para v-model bidireccional ---
const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <div class="x-toggle column flex-grow-1" :class="attrs.class">
    <!-- Etiqueta superior (solo si no es clásico) -->
    <label
      v-if="showTopLabel"
      :for="elementId"
      class="q-input__label"
      style="line-height: 15px; margin-top: 3px; margin-bottom: 2px"
    >
      {{ props.label }}
    </label>

    <!-- Toggle principal -->
    <q-toggle
      v-bind="{
        ...attrs,
        class: null, // evita duplicidad de clase
        label: checkboxLabel,
        for: elementId,
        dense: true
      }"
      v-model="internalValue"
      :color="color"
      :disable="disable"
      :indeterminate-value="indeterminateValue"
      style="min-height: 40px; line-height: 1.35">
      <!-- Tooltip si está definido -->
      <q-tooltip v-if="hasTooltip" :class="tooltipColor">
        {{ tooltipText }}
      </q-tooltip>
    </q-toggle>

    <!-- Texto de ayuda debajo del toggle -->
    <slot name="hint" v-if="hint">
      <div class="q-mt-sm text-caption text-secondary">{{ hint }}</div>
    </slot>
  </div>
</template>
