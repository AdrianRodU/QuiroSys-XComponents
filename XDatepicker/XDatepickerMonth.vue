<!-- src/components/XDatepicker/XDatepickerMonth.vue -->
<script setup>
import { computed, useAttrs, ref } from 'vue'
import { formDefaults } from '@esolutions/js-utils'

defineOptions({ name: 'XDatepickerMonth', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, null], default: '' },
  isClassic: { type: Boolean, default: formDefaults.isClassic },

  dense: { type: Boolean, default: true },
  outlined: { type: Boolean, default: formDefaults.outlined },
  clearable: { type: Boolean, default: false },

  error: { type: String, default: null },
  /** Asterisco rojo de obligatorio junto a la etiqueta + aria-required, como XDatepicker y XTimepicker
   *  (v2.28.0). Solo marca: no activa validación nativa. */
  isRequired: { type: Boolean, default: false },

  valueMask: { type: String, default: 'YYYY-MM' },
  displayMask: { type: String, default: 'MM/YYYY' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const attrs = useAttrs()
const popupRef = ref(null)

const fallbackId = Math.random().toString(36).substring(2, 9)

const elementId = computed(() => {
  const token = attrs.id
  return token ? `app-q-input-${token}` : `app-q-input-${fallbackId}`
})

const elementLabel = computed(() => (props.isClassic ? attrs.label : undefined))
const label = computed(() => (props.isClassic ? null : attrs.label))

const hasError = computed(() => !!props.error)

const normalizedValue = computed(() => (props.modelValue ?? ''))

// Para q-date necesitamos formato YYYY/MM (con día para que funcione)
const qDateValue = computed(() => {
  const v = normalizedValue.value
  if (!v) return ''
  // Convertir YYYY-MM a YYYY/MM/01
  return v.replace('-', '/') + '/01'
})

const displayValue = computed(() => {
  const v = normalizedValue.value
  if (!v) return ''

  // Parsear YYYY-MM
  const parts = v.split('-')
  if (parts.length !== 2) return v

  const year = parts[0]
  const month = parts[1]

  // Formatear según displayMask
  return props.displayMask
    .replace('YYYY', year)
    .replace('MM', month)
})

function updateFromPicker(val) {
  if (!val) {
    emit('update:modelValue', '')
    emit('change', '')
    return
  }

  // val viene como YYYY/MM/DD, extraer solo YYYY-MM
  const parts = val.split('/')
  if (parts.length >= 2) {
    const next = `${parts[0]}-${parts[1]}`
    emit('update:modelValue', next)
    emit('change', next)
  }

  // Cerrar popup al seleccionar
  popupRef.value?.hide()
}

function clear() {
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<template>
  <div class="app-q-input flex-grow-1 x-input-datepicker" :class="attrs.class">
    <label
      v-if="label"
      :for="elementId"
      class="q-input__label mb-1"
      style="line-height: 15px;"
    >
      {{ label }} <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
    </label>

    <q-input
      v-bind="{
        ...attrs,
        id: elementId,
        class: null,
        label: elementLabel,
        modelValue: displayValue,
        dense: props.dense,
        outlined: props.outlined,
        readonly: true,
        clearable: props.clearable,
        error: hasError,
        errorMessage: props.error || undefined,
        noErrorIcon: true,
        hideBottomSpace: !hasError
      }"
      :label-slot="!!elementLabel && props.isRequired"
      :aria-required="props.isRequired ? 'true' : null"
      @clear="clear"
    >
      <!-- Etiqueta clásica con el asterisco de obligatorio (como XInput y XTimepicker) -->
      <template v-if="elementLabel && props.isRequired" #label>
        <span>{{ elementLabel }}</span>
        <span class="text-negative" aria-hidden="true">*</span>
      </template>
      <template #append>
        <q-icon name="event" class="cursor-pointer">
          <q-popup-proxy ref="popupRef" cover transition-show="scale" transition-hide="scale">
            <q-date
              :model-value="qDateValue"
              default-view="Months"
              emit-immediately
              years-in-month-view
              mask="YYYY/MM/DD"
              @update:model-value="updateFromPicker"
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn v-close-popup label="Cerrar" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>

      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </q-input>
  </div>
</template>
