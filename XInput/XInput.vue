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
  /** Fondo del control (nombre de color Quasar/CSS). 'x-field' por defecto (v2.27.0): blanco en claro y el fondo
   *  de campo del modo oscuro (themes/tokens.scss); antes era 'white' y en oscuro quedaba un campo blanco con el
   *  texto claro encima. Evita que el input "transparente" se mimetice sobre un card/banner de color. Pasar '' o
   *  'transparent' para el comportamiento clásico. */
  bgColor: { type: String, default: 'x-field' },
  /** Botón de búsqueda (lupa) dentro del campo, a la derecha (v2.19.0). Emite
   *  `search` al hacer clic o al presionar Enter. Ej.: DNI → RENIEC. */
  searchButton: { type: Boolean, default: false },
  /** Lupa girando mientras se busca (y no se puede volver a pedir). */
  searchLoading: { type: Boolean, default: false },
  /** Lupa deshabilitada (p. ej. el número todavía no está completo). */
  searchDisable: { type: Boolean, default: false },
  /** Texto del tooltip de la lupa. */
  searchTooltip: { type: String, default: 'Buscar' },
  /** Ícono de la lupa. */
  searchIcon: { type: String, default: 'fal fa-search' },
})

const emit = defineEmits(['update:modelValue', 'input', 'change', 'search'])

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

// --- LUPA (searchButton) ---
// Una sola salida para el clic y el Enter: no emite si está deshabilitada o
// buscando, así el padre no recibe dos búsquedas por el mismo número.
function onSearch() {
  if (!props.searchButton || props.searchDisable || props.searchLoading) return
  emit('search')
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
      @keyup.enter="onSearch"
    >

      <template v-if="isPwdType || searchButton || $slots.append" #append>
        <q-icon
          v-if="isPwdType"
          :name="showPwd ? 'visibility' : 'visibility_off'"
          class="cursor-pointer"
          @click="togglePwd"
        />
        <q-btn
          v-if="searchButton"
          flat
          dense
          round
          size="sm"
          color="primary"
          class="x-input-search-btn"
          :icon="searchIcon"
          :loading="searchLoading"
          :disable="searchDisable"
          :aria-label="searchTooltip"
          @click="onSearch"
        >
          <q-tooltip>{{ searchTooltip }}</q-tooltip>
        </q-btn>
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
