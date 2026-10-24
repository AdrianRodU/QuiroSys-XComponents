<!-- src/components/XDateTimepicker/XDateTimepicker.vue -->
<script setup>
import { computed, useAttrs } from 'vue'
import { date as DateUtils } from 'quasar'
import { formDefaults } from '@esolutions/js-utils'
import XFieldCheck from '../XFieldCheck/XFieldCheck.vue'
import { isFilled } from '../XFieldCheck/isFilled.js'

defineOptions({ name: 'XDateTimepicker', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, null], default: '' },
  isClassic: { type: Boolean, default: formDefaults.isClassic },

  dense: { type: Boolean, default: true },
  outlined: { type: Boolean, default: formDefaults.outlined },
  clearable: { type: Boolean, default: false },
  /** Check verde cuando el campo tiene valor y no está en error (v2.30.0, Adrián 24/10: en todos los campos, en
   *  todos lados). Nunca en un campo de solo lectura o deshabilitado. `:check="false"` lo apaga. */
  check: { type: Boolean, default: true },

  error: { type: String, default: null },

  valueMask: { type: String, default: 'YYYY-MM-DD HH:mm' },
  displayMask: { type: String, default: 'DD/MM/YYYY HH:mm' },

  options: { type: Function, default: null },

  format24h: { type: Boolean, default: true },

  withCheckbox: { type: Boolean, default: false },
  checkboxModel: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change', 'update:checkboxModel'])

const attrs = useAttrs()
const fallbackId = Math.random().toString(36).substring(2, 9)

const elementId = computed(() => {
  const token = attrs.id
  return token ? `app-q-input-${token}` : `app-q-input-${fallbackId}`
})

const elementLabel = computed(() => (props.isClassic ? attrs.label : undefined))
const label = computed(() => (props.isClassic ? null : attrs.label))

const hasError = computed(() => !!props.error)

// Si hay checkbox, y está apagado => deshabilita TODO
const isLocked = computed(() => props.withCheckbox && !props.checkboxModel)

const normalizedValue = computed(() => (props.modelValue ?? ''))
// Check verde (XFieldCheck): hay fecha y hora, no hay error y el campo no está bloqueado.
const showOk = computed(() => props.check && !isLocked.value && isFilled(normalizedValue.value) && !hasError.value)

const displayValue = computed(() => {
  const v = normalizedValue.value
  if (!v) return ''

  const d = DateUtils.extractDate(v, props.valueMask)
  if (!d) return v

  return DateUtils.formatDate(d, props.displayMask)
})

function updateFromPicker(val) {
  if (isLocked.value) return
  const next = val ?? ''
  emit('update:modelValue', next)
  emit('change', next)
}

function clear() {
  if (isLocked.value) return
  emit('update:modelValue', '')
  emit('change', '')
}
</script>

<template>
  <div class="app-q-input flex-grow-1 x-input-date-timepicker" :class="attrs.class">
    <div v-if="label || withCheckbox" class="flex items-center q-mb-xs">
      <q-checkbox
        v-if="withCheckbox"
        :model-value="checkboxModel"
        @update:model-value="val => emit('update:checkboxModel', val)"
        dense
        class="q-mr-sm"
      />

      <label
        v-if="label"
        :for="elementId"
        class="q-input__label mb-1"
        style="line-height: 15px;"
      >
        {{ label }}
      </label>
    </div>

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
        clearable: props.clearable && !isLocked,
        error: hasError,
        errorMessage: props.error || undefined,
        noErrorIcon: true,
        disable: isLocked,
        hideBottomSpace: !hasError
      }"
      @clear="clear"
    >
      <!-- FECHA -->
      <template #prepend>
        <!-- Si está locked: ícono desactivado y sin popup -->
        <q-icon
          name="event"
          :class="isLocked ? 'text-grey-5' : 'cursor-pointer'"
          :style="isLocked ? 'cursor: not-allowed;' : ''"
        >
          <q-popup-proxy
            v-if="!isLocked"
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-date
              :model-value="normalizedValue"
              :mask="props.valueMask"
              :options="props.options || undefined"
              @update:model-value="updateFromPicker"
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn v-close-popup label="OK" flat />
              </div>
            </q-date>
          </q-popup-proxy>
        </q-icon>
      </template>

      <!-- HORA -->
      <template #append>
        <x-field-check v-if="showOk" class="q-mr-xs" />
        <q-icon
          name="access_time"
          :class="isLocked ? 'text-grey-5' : 'cursor-pointer'"
          :style="isLocked ? 'cursor: not-allowed;' : ''"
        >
          <q-popup-proxy
            v-if="!isLocked"
            cover
            transition-show="scale"
            transition-hide="scale"
          >
            <q-time
              :model-value="normalizedValue"
              :mask="props.valueMask"
              :format24h="props.format24h"
              @update:model-value="updateFromPicker"
            >
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn v-close-popup label="OK" flat />
              </div>
            </q-time>
          </q-popup-proxy>
        </q-icon>
      </template>

      <!-- reenvía slots -->
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}" />
      </template>
    </q-input>
  </div>
</template>
