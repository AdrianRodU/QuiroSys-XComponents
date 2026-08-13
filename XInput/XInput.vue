<script setup>
import { computed, useAttrs, ref, toValue } from 'vue'
import { formDefaults } from '@esolutions/js-utils'
import XHelpTip from '../XHelpTip/XHelpTip.vue'

defineOptions({ name: 'XInput', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  isClassic: { type: Boolean, default: formDefaults.isClassic },
  dense: { type: Boolean, default: formDefaults.dense },
  error: { type: [String, Array], default: null },
  autofocus: { type: Boolean, default: false },
  /** Solo muestra asterisco/aria, no activa validación nativa */
  isRequired: { type: Boolean, default: false },
  /** Texto de ayuda: muestra un ícono "?" con tooltip junto al label. */
  help: { type: String, default: '' },
  /** Fondo del control (nombre de color Quasar/CSS). 'white' por defecto:
   *  invisible sobre fondos blancos (la mayoría de la app), pero evita que
   *  el input "transparente" se mimetice al usarlo sobre un card/banner de
   *  color. Pasar '' o 'transparent' para el comportamiento clásico. */
  bgColor: { type: String, default: 'white' },
})

const emit = defineEmits(['update:modelValue', 'input', 'change'])

const attrs = useAttrs()
const fallbackId = `app-q-input-${Math.random().toString(36).substring(2, 9)}`
const elementId = computed(() => (attrs.id ? `app-q-input-${attrs.id}` : fallbackId))
const elementLabel = computed(() => (props.isClassic ? attrs.label : undefined))
const label = computed(() => (props.isClassic ? null : attrs.label))

// Normaliza error: acepta String o Array (formato Laravel 422)
const errorMessage = computed(() => {
  const e = toValue(props.error)
  if (!e) return null
  return Array.isArray(e) ? e[0] : e
})

// --- PASSWORD TOGGLE ---
const isPwdType = computed(() => (attrs.type || 'text').toLowerCase() === 'password')
const showPwd = ref(false)

const inputType = computed(() => {
  return isPwdType.value ? (showPwd.value ? 'text' : 'password') : (attrs.type || 'text')
})

function togglePwd() {
  showPwd.value = !showPwd.value
}

// Evitamos pasar "required" e "is-required" a QInput
const filteredAttrs = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const { class: _c, label: _l, type: _t, id: _i, required: _r, 'is-required': _ir, ...rest } = attrs
  return rest
})
</script>

<template>
  <div class="app-q-input flex-grow-1 x-input" :class="[{ 'x-input-large': !dense }, attrs.class]">
    <!-- Label manual (no classic) -->
    <label v-if="label" :for="elementId" class="q-input__label q-mb-xs" style="line-height: 22px;"
           :aria-required="props.isRequired ? 'true' : 'false'">
      {{ label }} <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
      <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
    </label>

    <q-input
      v-bind="{
        ...filteredAttrs,
        class: null,
        label: elementLabel,
        outlined: formDefaults.outlined,
        dense: dense,
        for: elementId,
        type: inputType,
        autofocus: props.autofocus,
        'aria-required': props.isRequired ? 'true' : null,
        'bg-color': props.bgColor || undefined
      }"
      :model-value="modelValue"
      :error="!!errorMessage"
      :error-message="errorMessage"
      no-error-icon
      :hide-bottom-space="!errorMessage"
      :label-slot="!!elementLabel"
      @update:model-value="val => emit('update:modelValue', val)"
      @input="e => emit('input', e)"
      @change="e => emit('change', e)"
    >

      <template v-if="isPwdType || $slots.append" #append>
        <q-icon
          v-if="isPwdType"
          :name="showPwd ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="togglePwd"
        />
        <slot name="append" />
      </template>

      <!-- Label slot (classic) -->
      <template v-if="elementLabel" #label>
        <span>{{ elementLabel }}</span>
        <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
        <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
      </template>

      <!-- Proxy de slots de QField/QInput -->
      <template v-if="$slots.before" #before>
        <slot name="before" />
      </template>

      <template v-if="$slots.after" #after>
        <slot name="after" />
      </template>

      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>

      <template v-if="$slots.hint" #hint>
        <slot name="hint" />
      </template>

      <template v-if="$slots.error" #error>
        <slot name="error" />
      </template>

      <template v-if="$slots.counter" #counter>
        <slot name="counter" />
      </template>

      <template v-if="$slots.loading" #loading>
        <slot name="loading" />
      </template>
    </q-input>
  </div>
</template>
