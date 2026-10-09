<script setup>
import { computed, useAttrs } from 'vue'
import { formDefaults } from '@esolutions/js-utils'
import XHelpTip from '../XHelpTip/XHelpTip.vue'

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

  // Texto de ayuda: ícono "?" con tooltip junto a la etiqueta (v2.26.0), como XInput.
  // En el estilo clásico la etiqueta se dibuja en el slot del QToggle para que el "?"
  // quede al lado del texto y su clic no mueva el interruptor (XHelpTip lo detiene).
  help: {
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
// Con `help` en estilo clásico, la etiqueta va por el slot (QToggle fusiona el slot con el
// prop `label`: pasarlo también duplicaría el texto).
const classicLabelBySlot = computed(() => props.isClassic && !!props.help)
const checkboxLabel = computed(() => (props.isClassic && !classicLabelBySlot.value ? props.label : undefined))

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
      <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
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
      <!-- Etiqueta clásica con "?" (v2.26.0) -->
      <template v-if="classicLabelBySlot">
        <span>{{ props.label }}</span>
        <XHelpTip :text="help" class="q-ml-xs" />
      </template>
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
