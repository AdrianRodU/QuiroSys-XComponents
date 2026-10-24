<script setup>
import { ref, getCurrentInstance, computed } from 'vue'
import XFieldCheck from '../XFieldCheck/XFieldCheck.vue'
import { isFilled } from '../XFieldCheck/isFilled.js'
const props = defineProps({
  /** Check verde cuando el campo tiene valor y no está en error (v2.30.0, Adrián 24/10: en todos los campos, en
   *  todos lados). Nunca en un campo de solo lectura o deshabilitado. `:check="false"` lo apaga. */
  check: { type: Boolean, default: true },
  modelValue: { type: [String, Number], default: null },
  label: { type: String, default: 'Ubigeo' },
  error: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])
const showOk = computed(() => props.check && isFilled(props.modelValue) && !props.error)
const { proxy } = getCurrentInstance()
const options = ref([])
const search = ref('')
const loading = ref(false)
const onFilter = async (val, update) => {
  if (val.length < 3) { update(); return }
  loading.value = true
  try {
    const res = await proxy.$api.get('/catalog/locations', { params: { search: val } })
    options.value = (res.data?.data || res.data || []).map(r => ({ label: r.description || r.name, value: r.id }))
  } catch { options.value = [] }
  finally { loading.value = false; update() }
}
</script>
<template>
  <q-select v-model="search" :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" :label="label" :options="options" use-input emit-value map-options @filter="onFilter" :loading="loading" outlined dense :error="!!error" :error-message="error">
    <template v-if="showOk" #append><x-field-check /></template>
  </q-select>
</template>
