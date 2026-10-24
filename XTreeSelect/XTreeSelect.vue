<script setup>
import { computed, ref, useAttrs, watch } from 'vue'
import { formDefaults } from '@esolutions/js-utils'
import XFieldCheck from '../XFieldCheck/XFieldCheck.vue'
import { isFilled, isInactive } from '../XFieldCheck/isFilled.js'

defineOptions({
  name: 'XTreeSelect',
  inheritAttrs: false
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'select',   // nodo seleccionado
  'deselect', // nodo deseleccionado (multiple)
  'open',
  'close',
  'focus',
  'blur'
])

const attrs = useAttrs()

const props = defineProps({
  /** Check verde cuando el campo tiene valor y no está en error (v2.30.0, Adrián 24/10: en todos los campos, en
   *  todos lados). Nunca en un campo de solo lectura o deshabilitado. `:check="false"` lo apaga. */
  check: { type: Boolean, default: true },
  modelValue: {
    type: [String, Number, Array, null],
    default: null
  },
  isClassic: { type: Boolean, default: formDefaults.isClassic },
  dense: { type: Boolean, default: true },
  multiple: { type: Boolean, default: false },

  // Controla si se muestra el input de búsqueda dentro del menú.
  withFilter: { type: Boolean, default: false },

  // Si es true, los padres (nodos con hijos) no se pueden seleccionar, solo expandir.
  onlyLeafSelectable: { type: Boolean, default: false },

  optionValue: { type: String, default: 'id' },
  optionLabel: { type: String, default: 'label' },
  optionChildren: { type: String, default: 'children' }
})

const fallbackId = `app-tree-select-${Math.random().toString(36).substring(2, 9)}`
const elementId = computed(() =>
  attrs.id ? `app-tree-select-${attrs.id}` : fallbackId
)
const elementLabel = computed(() =>
  props.isClassic ? (attrs.label ?? '') : undefined
)
const label = computed(() =>
  props.isClassic ? null : (attrs.label ?? '')
)

// attrs seguros para QInput (quitamos class, options, multiple, label)
// Check verde (XFieldCheck): hay opción elegida, no hay error y el campo no está inactivo.
const showOk = computed(() => props.check && !isInactive(attrs) && isFilled(props.modelValue) && !attrs.error)

const safeInputAttrs = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const { class: _class, options, multiple, label, ...rest } = attrs
  return rest
})

const menu = ref(false)
const filter = ref('')
const inputRef = ref(null)

// Fuente original de nodos
const rawOptions = computed(() => {
  const opt = attrs.options
  if (!opt) return []
  return Array.isArray(opt) ? opt : [opt]
})

// Normalización para QTree con lógica de 'selectable'
const normalizedNodes = computed(() => {
  const valueKey = props.optionValue
  const labelKey = props.optionLabel
  const childrenKey = props.optionChildren

  const mapNode = (node) => {
    // 1. Mapear hijos recursivamente
    const children = Array.isArray(node[childrenKey])
      ? node[childrenKey].map(mapNode)
      : []

    const hasChildren = children.length > 0

    // 2. Determinar si es seleccionable
    let isSelectable = node.selectable ?? true

    // Si activamos onlyLeafSelectable y tiene hijos, forzamos false.
    if (props.onlyLeafSelectable && hasChildren) {
      isSelectable = false
    }

    return {
      ...node,
      __key: node[valueKey],
      label: node[labelKey],
      children,
      selectable: isSelectable
    }
  }

  return rawOptions.value.map(mapNode)
})

// Mapa plano key -> nodo (para encontrar label, etc.)
const flatNodeMap = computed(() => {
  const map = new Map()
  const walk = (nodes) => {
    nodes.forEach(n => {
      map.set(n.__key, n)
      if (Array.isArray(n.children)) {
        walk(n.children)
      }
    })
  }
  walk(normalizedNodes.value)
  return map
})

// Filtro simple por texto
const filteredNodes = computed(() => {
  if (!props.withFilter) return normalizedNodes.value
  const term = filter.value?.toString().trim().toLowerCase()
  if (!term) return normalizedNodes.value

  const filterTree = (nodes) => {
    const res = []
    for (const node of nodes) {
      const label = (node.label ?? '').toString().toLowerCase()
      const children = Array.isArray(node.children) ? filterTree(node.children) : []

      if (label.includes(term) || children.length > 0) {
        res.push({ ...node, children })
      }
    }
    return res
  }

  return filterTree(normalizedNodes.value)
})

// Estado interno de selección del QTree
const internalSelected = ref(null)   // single
const internalTicked = ref([])       // multiple

// Sincronizar props.modelValue -> internos
watch(
  () => props.modelValue,
  (val) => {
    if (props.multiple) {
      const arr = Array.isArray(val) ? val : []
      internalTicked.value = [...arr]
    } else {
      internalSelected.value = val ?? null
    }
  },
  { immediate: true }
)

// Label visible en el input
const displayLabel = computed(() => {
  if (props.multiple) {
    const ids = Array.isArray(props.modelValue) ? props.modelValue : []
    const labels = ids
      .map(id => flatNodeMap.value.get(id))
      .filter(Boolean)
      .map(n => n.label)
    return labels.join(', ')
  } else {
    const id = props.modelValue
    if (id === null || id === undefined || id === '') return ''
    const node = flatNodeMap.value.get(id)
    return node?.label ?? ''
  }
})

const placeholder = computed(() => attrs.placeholder ?? '')

// Handlers de selección
function onSelectedChange (val) {
  if (props.multiple) return

  // Permitimos que val sea null (deselección)
  internalSelected.value = val
  emit('update:modelValue', val)
  emit('change', val)

  if (val) {
    const node = flatNodeMap.value.get(val)
    if (node) emit('select', node)
  } else {
    // Opcional: emitir un evento 'clear' o similar si se requiere
  }

  menu.value = false
}

function onTickedChange (vals) {
  if (!props.multiple) return

  const arr = Array.isArray(vals) ? vals : []
  const old = Array.isArray(props.modelValue) ? props.modelValue : []
  emit('update:modelValue', arr)
  emit('change', arr)

  const oldSet = new Set(old)
  const newSet = new Set(arr)

  arr.forEach(id => {
    if (!oldSet.has(id)) {
      const node = flatNodeMap.value.get(id)
      if (node) emit('select', node)
    }
  })
  old.forEach(id => {
    if (!newSet.has(id)) {
      const node = flatNodeMap.value.get(id)
      if (node) emit('deselect', node)
    }
  })
}

function toggleMenu (evt) {
  if (attrs.disable || attrs.readonly) return

  if (evt) {
    evt.stopPropagation()
    evt.preventDefault()
  }

  menu.value = !menu.value
  if (menu.value) {
    emit('open')
  } else {
    emit('close')
  }
}

function onMenuHide () {
  menu.value = false
  emit('close')
}

function onFieldFocus () {
  emit('focus')
}

function onFieldBlur () {
  emit('blur')
}
</script>

<template>
  <div
    class="app-tree-select flex-grow-1 x-tree-select"
    :class="[attrs.class, { 'x-tree-select--dense': dense }]"
  >
    <label
      v-if="label"
      :for="elementId"
      class="x-tree-select-label cursor-pointer"
      style="line-height: 15px"
      @click.stop="toggleMenu"
    >
      {{ label }}
    </label>

    <q-input
      ref="inputRef"
      v-bind="{
        ...safeInputAttrs,
        class: 'cursor-pointer',
        label: elementLabel,
        dense: dense,
        outlined: formDefaults.outlined,
        readonly: true,
        inputClass: 'cursor-pointer'
      }"
      :for="elementId"
      :model-value="displayLabel"
      :placeholder="!displayLabel ? placeholder : ''"
      @focus="onFieldFocus"
      @blur="onFieldBlur"
    >
      <template #default>
        <div
          class="absolute-full cursor-pointer transparent"
          style="z-index: 10"
          @click.stop="toggleMenu"
        ></div>

        <q-menu
          v-model="menu"
          :fit="true"
          anchor="bottom left"
          self="top left"
          no-parent-event
          @hide="onMenuHide"
        >
          <div
            class="q-pa-sm"
            style="min-width: 260px; max-height: 280px; overflow: auto;"
          >
            <q-input
              v-if="withFilter"
              v-model="filter"
              dense
              :outlined="formDefaults.outlined"
              clearable
              placeholder="Buscar..."
              class="q-mb-sm"
              autofocus
              @click.stop
            />

            <q-tree
              :nodes="filteredNodes"
              node-key="__key"
              default-expand-all
              :accordion="false"
              v-model:selected="internalSelected"
              v-model:ticked="internalTicked"
              :tick-strategy="multiple ? 'leaf' : 'none'"
              selected-color="primary"
              ticked-color="primary"
              @update:selected="onSelectedChange"
              @update:ticked="onTickedChange"
            />
          </div>
        </q-menu>
      </template>

      <template #append>
        <x-field-check v-if="showOk" />
        <q-icon
          name="arrow_drop_down"
          class="cursor-pointer"
          @click.stop="toggleMenu"
        />
      </template>
    </q-input>
  </div>
</template>
