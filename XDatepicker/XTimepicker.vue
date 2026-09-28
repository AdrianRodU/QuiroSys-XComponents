<script setup>
import { computed, useAttrs } from 'vue'
import { QInput, QPopupProxy, QTime, QBtn, QIcon } from 'quasar'
import { formDefaults } from '@esolutions/js-utils'

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
  isClassic: {
    type: Boolean,
    default: formDefaults.isClassic,
  },
  /** Campo obligatorio: asterisco rojo en la etiqueta, como XInput (solo marca, no valida). */
  isRequired: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

defineOptions({
  name: 'XTimepicker',
  inheritAttrs: false,
})

const attrs = useAttrs()

const elementLabel = computed(() => {
  return props.isClassic ? attrs.label : undefined
})

const externalLabel = computed(() => {
  return props.isClassic ? null : attrs.label
})
</script>

<template>
  <div class="app-q-input flex-grow-1" :class="attrs.class">
    <label v-if="externalLabel" class="q-input__label mb-1" style="line-height: 15px;">
      {{ externalLabel }} <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
    </label>
    <q-input
      :model-value="modelValue"
      :label="elementLabel"
      :outlined="attrs.outlined ?? formDefaults.outlined"
      :dense="attrs.dense ?? formDefaults.dense"
      :error="attrs.error"
      :error-message="attrs['error-message']"
      :disable="attrs.disable"
      :readonly="attrs.readonly"
      clearable
      @update:model-value="emit('update:modelValue', $event)"
      v-bind="{ ...attrs, class: null, label: elementLabel }"
      :label-slot="!!elementLabel && props.isRequired"
      :aria-required="props.isRequired ? 'true' : null"
    >
      <!-- Etiqueta clásica con el asterisco de obligatorio (como XInput) -->
      <template v-if="elementLabel && props.isRequired" #label>
        <span>{{ elementLabel }}</span>
        <span class="text-negative" aria-hidden="true">*</span>
      </template>
      <template #append>
        <q-icon name="access_time" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-time
              :model-value="modelValue"
              format24h
              @update:model-value="emit('update:modelValue', $event)"
            >
              <div class="row items-center justify-end">
                <q-btn v-close-popup label="OK" color="primary" flat />
              </div>
            </q-time>
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>
