<script setup>
import { computed, useAttrs } from 'vue';
import { formDefaults } from '@esolutions/js-utils'
import XHelpTip from '../XHelpTip/XHelpTip.vue'

// Metadatos del componente
defineOptions({
  name: 'XCheckbox',
  inheritAttrs: false,
});

// Definimos las propiedades del componente
const props = defineProps({
  modelValue: {
    type: [Boolean, Array, String],
    required: true,
  },
  isClassic: {
    type: Boolean,
    default: formDefaults.isClassic,
  },
  label: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'primary',
  },
  disable: {
    type: Boolean,
    default: false,
  },
  indeterminateValue: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: '',
  },
  tooltipText: {
    type: String,
    default: '',
  },
  tooltipColor: {
    type: String,
    default: '',
  },
  /** Texto de ayuda: muestra un ícono "?" con tooltip junto al checkbox/label. */
  help: {
    type: String,
    default: '',
  },
});

// Definimos los eventos emitidos
const emit = defineEmits(['update:modelValue']);

// Accedemos a los atributos heredados
const attrs = useAttrs();

// ID de respaldo en caso no se proporcione uno externo
const fallbackId = `app-q-checkbox-${Math.random().toString(36).substring(2, 9)}`;
const elementId = computed(() => attrs.id ? `app-q-checkbox-${attrs.id}` : fallbackId);

// Determina si se muestra el label en la parte superior
const showTopLabel = computed(() => !props.isClassic && props.label);

// Label interno solo si es modo clásico
const checkboxLabel = computed(() => props.isClassic ? props.label : undefined);

// Computed bidireccional para v-model
const internalValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

// Determina si se debe mostrar tooltip
const hasTooltip = computed(() => !!props.tooltipText);
</script>

<template>
  <div class="custom-checkbox flex-grow-1" :class="attrs.class">
    <!-- Label superior personalizado si no es modo clásico -->
    <label v-if="showTopLabel"
           :for="elementId"
           class="q-input__label mb-1"
           style="line-height: 15px;">
      {{ props.label }}
      <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
    </label>

    <!-- Checkbox principal (+ ícono de ayuda opcional al costado) -->
    <div class="row items-center no-wrap">
      <q-checkbox
        v-bind="{
          ...attrs,
          class: null,         // evitar duplicación
          label: checkboxLabel,
          for: elementId,
          dense: true,
        }"
        v-model="internalValue"
        :color="color"
        :disable="disable"
        :indeterminate-value="indeterminateValue"
      >
        <!-- Etiqueta con marcado propio (v2.21.0): lo que venga en el slot por defecto va junto a la
             casilla, como la etiqueta clásica. Para listas donde cada opción lleva más de un dato
             (un código y un nombre, un nombre y su explicación). -->
        <slot />
        <q-tooltip v-if="hasTooltip" :class="tooltipColor">{{ tooltipText }}</q-tooltip>
      </q-checkbox>
      <XHelpTip v-if="help && !showTopLabel" :text="help" class="q-ml-xs" />
    </div>

    <!-- Mensaje de ayuda opcional -->
    <slot name="hint" v-if="hint">
      <div class="q-mt-sm text-caption text-secondary">{{ hint }}</div>
    </slot>
  </div>
</template>
