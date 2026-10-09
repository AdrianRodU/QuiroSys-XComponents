<script setup>
import { ref, watch, computed, getCurrentInstance } from 'vue'
import { useQuasar } from 'quasar'

import XCellRenderer from './XCellRenderer.vue'

// registra aquí tus componentes interactivos
import XToggle from '../XToggle/XToggle.vue'
import XCheckbox from '../XCheckbox/XCheckbox.vue'
import XInput from '../XInput/XInput.vue'
import XSelect from '../XSelect/XSelect.vue'

defineOptions({ name: 'XCellColumnRenderer' })

const props = defineProps({
  cell: { type: [Object, String, Number, Boolean], default: null },
  row: { type: Object, default: null },
})

const emit = defineEmits(['refresh', 'loading', 'cell-action'])

const { proxy } = getCurrentInstance()
const $q = useQuasar()

const componentsMap = {
  XToggle,
  XCheckbox,
  XInput,
  XSelect,
}

const isComponentCell = computed(() =>
  props.cell && typeof props.cell === 'object' && props.cell.type_input === 'component'
)

const localValue = ref(null)
const saving = ref(false)
let debounceTimer = null

watch(
  () => props.cell,
  (c) => {
    if (c && typeof c === 'object' && c.type_input === 'component') {
      localValue.value = c.modelValue
    }
  },
  { immediate: true }
)

function resolveUrl(url) {
  if (!url) return url
  const id = props.row?.id ?? ''
  return String(url).replaceAll('{id}', id)
}

/**
 * Reemplaza '$value' en data plano (suficiente para 90% de casos).
 * Si quieres soportar nested arrays/objects, se puede hacer recursivo.
 */
function buildData(template, value) {
  if (!template || typeof template !== 'object') return {}
  const out = {}
  for (const k in template) {
    out[k] = template[k] === '$value' ? value : template[k]
  }
  return out
}

async function runAction(nextValue) {
  const c = props.cell
  const action = c?.action
  if (action?.type === 'active') {
    runActiveAction(action, nextValue)
    return
  }
  if (!action || action.type !== 'api') return

  const prev = localValue.value
  localValue.value = nextValue

  const method = (action.method || 'post').toLowerCase()
  const url = resolveUrl(action.url)
  const data = buildData(action.data, nextValue)
  const refresh = action.refresh !== false
  const optimistic = action.optimistic !== false

  // confirm opcional
  if (action.confirm?.title || action.confirm?.message) {
    try {
      await $q.dialog({
        title: action.confirm.title || proxy.$t('common.confirm'),
        message: action.confirm.message || proxy.$t('common.wantToContinue'),
        cancel: true,
        persistent: true,
      })
    } catch {
      // cancelado
      localValue.value = prev
      return
    }
  }

  try {
    saving.value = true
    emit('loading', true)
    const res = await proxy.$api.request({ method, url, data })

    // notify: showNotify lee el mensaje del backend; notify.success usa texto fijo
    if (action.showNotify) {
      const msg = res?.data?.message
      const success = res?.data?.success !== false
      if (msg) $q.notify({ type: success ? 'positive' : 'negative', message: msg })
    } else if (action.notify?.success) {
      $q.notify({ type: 'positive', message: action.notify.success })
    }

    if (refresh) emit('refresh')
  } catch (err) {
    if (optimistic) localValue.value = prev

    const msg =
      err?.response?.data?.message ||
      err?.message ||
      proxy.$t('common.actionError')

    $q.notify({ type: 'negative', message: msg })
  } finally {
    saving.value = false
    emit('loading', false)
  }
}

/**
 * Interruptor "Activo" de las tablas (Cell::activeToggle, v2.25.0): no llama a la API por su cuenta, se lo
 * pasa a la tabla. Apagar abre el diálogo de confirmación de la tabla (el mismo de los antiguos botones de
 * activar: record-active → active) y encender va directo. Una acción propia (p. ej. la de Personal, que pide
 * la fecha de la baja) llega a la página en los dos sentidos. El interruptor no se mueve hasta que el servidor
 * confirma (la tabla se refresca con el valor nuevo); solo se adelanta al encender con la acción estándar,
 * porque ahí no hay nada que confirmar.
 */
function runActiveAction(action, nextValue) {
  const name = action.action || 'active'
  if (!(name === 'active' && nextValue === true)) localValue.value = props.cell.modelValue
  emit('cell-action', { action: name, value: nextValue })
}

function onUpdateModelValue(val) {
  const action = props.cell?.action
  const debounceMs = Number(action?.debounce || 0)

  if (debounceMs > 0) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runAction(val), debounceMs)
    return
  }
  runAction(val)
}
</script>

<template>
  <!-- 1) Celda interactiva -->
  <template v-if="isComponentCell">
    <component
      :is="componentsMap[cell.component]"
      v-model="localValue"
      v-bind="cell.props"
      :disable="(cell.props?.disable ?? false) || saving"
      @update:modelValue="onUpdateModelValue"
    />
  </template>

  <!-- 2) Celda normal (tu renderer actual) -->
  <template v-else>
    <x-cell-renderer :cell="cell" @cell-action="emit('cell-action', $event)" />
  </template>
</template>
