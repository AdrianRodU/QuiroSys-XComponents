<script setup>
import { computed, ref, useAttrs } from 'vue'
import { formDefaults } from '@esolutions/js-utils'

defineOptions({ name: 'XInputNumeric', inheritAttrs: false })

const props = defineProps({
  modelValue: [Number, String, null],
  isClassic: { type: Boolean, default: formDefaults.isClassic },
  dense: { type: Boolean, default: formDefaults.dense },
  error: { type: String, default: null },
  inputDebounce: { type: [Number, String], default: 0 },
  autofocus: { type: Boolean, default: false },
  isRequired: { type: Boolean, default: false },
  prefix: { type: String, default: null },
  suffix: { type: String, default: null },
  /**
   * Modo stepper: botones −/+ a los lados del input (uso típico: cantidades
   * en grillas POS). Con controls, el valor se acota a [min, max]: los
   * botones se deshabilitan en el límite y un valor escrito fuera de rango
   * se corrige al salir del campo (blur) — evita cantidades en 0/vacío.
   */
  controls: { type: Boolean, default: false },
  min: { type: [Number, String], default: null },
  max: { type: [Number, String], default: null },
  step: { type: [Number, String], default: 1 },
  /** Fondo del control (nombre de color Quasar/CSS). 'white' por defecto:
   *  invisible sobre fondos blancos (la mayoría de la app), pero evita que
   *  el input "transparente" se mimetice al usarlo sobre un card/banner de
   *  color. Pasar '' o 'transparent' para el comportamiento clásico. */
  bgColor: { type: String, default: 'white' },
})
const emit = defineEmits(['update:modelValue', 'input', 'change'])

const attrs = useAttrs()
const fallbackId = `app-q-input-${Math.random().toString(36).slice(2, 11)}`
const elementId = computed(() => (attrs.id ? `app-q-input-${attrs.id}` : fallbackId))
const elementLabel = computed(() => (props.isClassic ? attrs.label : undefined))
const label = computed(() => (props.isClassic ? null : attrs.label))

const prefixValue = computed(() => props.prefix || attrs.prefix || null)
const suffixValue = computed(() => props.suffix || attrs.suffix || null)

function toNum(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ---------------------------------------------------------------------------
// Modo controls (stepper −/+)
// ---------------------------------------------------------------------------
const minNum = computed(() => (props.min === null || props.min === '' ? null : Number(props.min)))
const maxNum = computed(() => (props.max === null || props.max === '' ? null : Number(props.max)))
const stepNum = computed(() => Number(props.step) || 1)
const currentNum = computed(() => Number(props.modelValue || 0))

const canDecrement = computed(() => minNum.value === null || currentNum.value > minNum.value)
const canIncrement = computed(() => maxNum.value === null || currentNum.value < maxNum.value)

function clamp(n) {
  if (!Number.isFinite(n)) return minNum.value ?? 0
  if (minNum.value !== null && n < minNum.value) return minNum.value
  if (maxNum.value !== null && n > maxNum.value) return maxNum.value
  return n
}

function changeBy(delta) {
  const next = clamp(currentNum.value + delta * stepNum.value)
  if (next === currentNum.value) return
  emit('update:modelValue', next)
}

// Al salir del campo se fuerza el rango (evita dejar 0/vacío bajo el mínimo).
function onBlurClamp() {
  if (!props.controls) return
  const fixed = clamp(currentNum.value)
  if (fixed !== currentNum.value) emit('update:modelValue', fixed)
}

const filteredAttrs = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const { class: _c, label: _l, id: _i, required: _r, 'is-required': _ir, prefix: _p, suffix: _s, type: _t, ...rest } = attrs
  return rest
})

const inputRef = ref(null)
function focus() { inputRef.value?.focus?.() }
function select() { inputRef.value?.select?.() }
function focusAndSelect() { focus(); select() }
defineExpose({ focus, select, focusAndSelect })
</script>

<template>
  <div class="app-q-input flex-grow-1 x-input-numeric" :class="[{ 'x-input-numeric--large': !props.dense, 'x-input-numeric--controls': props.controls }, attrs.class]">
    <!-- Label manual (no classic) -->
    <label
      v-if="label"
      :for="elementId"
      class="q-input__label q-mb-xs"
      style="line-height: 22px"
      :aria-required="props.isRequired ? 'true' : 'false'"
    >
      {{ label }}
      <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
    </label>

    <q-input
      ref="inputRef"
      v-bind="{
        ...filteredAttrs,
        class: null,
        label: elementLabel,
        outlined: formDefaults.outlined,
        dense: props.dense,
        for: elementId,
        type: 'number',
        debounce: props.inputDebounce,
        autofocus: props.autofocus,
        'aria-required': props.isRequired ? 'true' : null,
        'bg-color': props.bgColor || undefined,
      }"
      :model-value="modelValue"
      :min="minNum"
      :max="maxNum"
      :error="!!error"
      :error-message="error"
      no-error-icon
      :hide-bottom-space="!error"
      :label-slot="!!elementLabel"
      @update:model-value="val => emit('update:modelValue', toNum(val))"
      @input="e => emit('input', e)"
      @change="e => emit('change', e)"
      @blur="onBlurClamp"
    >
      <template v-if="elementLabel" #label>
        <span>{{ elementLabel }}</span>
        <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
      </template>

      <template v-if="prefixValue || props.controls" #prepend>
        <q-btn
          v-if="props.controls"
          dense flat round size="sm"
          icon="fal fa-minus"
          color="grey-7"
          :disable="!canDecrement"
          @click="changeBy(-1)"
        />
        <span v-if="prefixValue" class="x-input-numeric__affix">{{ prefixValue }}</span>
      </template>

      <template v-if="suffixValue || props.controls" #append>
        <span v-if="suffixValue" class="x-input-numeric__affix">{{ suffixValue }}</span>
        <q-btn
          v-if="props.controls"
          dense flat round size="sm"
          icon="fal fa-plus"
          color="primary"
          :disable="!canIncrement"
          @click="changeBy(1)"
        />
      </template>
    </q-input>
  </div>
</template>

<style scoped>
.x-input-numeric__affix {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
  line-height: 1;
  user-select: none;
}

/* Ocultar flechas nativas del input number */
.x-input-numeric :deep(input[type="number"]::-webkit-inner-spin-button),
.x-input-numeric :deep(input[type="number"]::-webkit-outer-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
.x-input-numeric :deep(input[type="number"]) {
  -moz-appearance: textfield;
}

/* Modo controls: valor centrado entre los botones −/+ */
.x-input-numeric--controls :deep(input) {
  text-align: center;
  padding: 0 2px;
}
</style>
