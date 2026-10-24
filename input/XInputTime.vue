<script setup>
import { computed } from 'vue'
import XFieldCheck from '../XFieldCheck/XFieldCheck.vue'
import { isFilled } from '../XFieldCheck/isFilled.js'
const props = defineProps({
  /** Check verde cuando el campo tiene valor y no está en error (v2.30.0, Adrián 24/10: en todos los campos, en
   *  todos lados). Nunca en un campo de solo lectura o deshabilitado. `:check="false"` lo apaga. */
  check: { type: Boolean, default: true },
  modelValue: { type: String, default: null },
  label: { type: String, default: 'Hora' },
  error: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])
const value = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })
const showOk = computed(() => props.check && isFilled(props.modelValue) && !props.error)
</script>
<template>
  <q-input v-model="value" :label="label" outlined dense mask="time" :error="!!error" :error-message="error">
    <template v-slot:append>
      <x-field-check v-if="showOk" class="q-mr-xs" />
      <q-icon name="access_time" class="cursor-pointer">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-time v-model="value" format24h />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
