<script setup>
  import { computed, onBeforeUnmount, ref, useAttrs } from 'vue'
  import draggable from 'vuedraggable'
  
  defineOptions({ name: 'XDnd', inheritAttrs: false })
  
  const props = defineProps({
    // v-model o list
    modelValue: { type: Array, default: () => [] },
    list: { type: Array, default: null },
  
    // Sortable options
    tag: { type: String, default: 'div' },
    group: { type: [String, Object], default: () => ({ name: 'x-dnd' }) },
    itemKey: { type: [String, Function], default: 'id' },
    handle: { type: String, default: null },
    disabled: { type: Boolean, default: false },
  
    animation: { type: Number, default: 150 },
    ghostClass: { type: String, default: 'x-dnd-ghost' },
    chosenClass: { type: String, default: 'x-dnd-chosen' },
    dragClass: { type: String, default: 'x-dnd-drag' },
  
    // mejoras para Quasar/touch/navegadores
    forceFallback: { type: Boolean, default: true },
    fallbackOnBody: { type: Boolean, default: true },
    touchStartThreshold: { type: Number, default: 5 },
  
    /**
     * Drag Overlay (flotante)
     */
    dragOverlay: { type: Boolean, default: true },
    overlayOffsetX: { type: Number, default: 14 },
    overlayOffsetY: { type: Number, default: 14 },
    overlayZIndex: { type: Number, default: 9999 },
  
    /**
     * Reglas + hook
     */
    canMove: { type: Function, default: null },
  
    rules: { type: Object, default: () => ({}) },
  
    /**
     * Meta opcional del contenedor (útil en árboles)
     */
    containerMeta: { type: Object, default: null }
  })
  
  const emit = defineEmits([
    'update:modelValue',
    'update:list',
    'change',
    'start',
    'end',
    'add',
    'remove',
    'update',
    'choose',
    'unchoose',
    'sort',
    'move'
  ])
  
  const attrs = useAttrs()
  const isListMode = computed(() => props.list !== null)
  
  /**
   * v-model SOLO para modo modelValue
   */
  const internalModel = computed({
    get() {
      return props.modelValue
    },
    set(val) {
      emit('update:modelValue', val)
      emit('update:list', val)
    }
  })
  
  /**
   * helper: notificar lista actual
   */
  const notifyList = () => {
    if (isListMode.value) {
      // en modo list, vuedraggable muta props.list, así que solo notificamos
      emit('update:list', props.list ?? [])
    } else {
      emit('update:list', internalModel.value ?? [])
    }
  }
  
  /**
   * ============ Drag Overlay ============
   */
  const isDragging = ref(false)
  const draggedElement = ref(null)
  const pointer = ref({ x: 0, y: 0 })
  
  const updatePointer = (e) => {
    const t = e.touches?.[0]
    pointer.value = {
      x: t?.clientX ?? e.clientX ?? 0,
      y: t?.clientY ?? e.clientY ?? 0
    }
  }
  
  const addPointerListeners = () => {
    window.addEventListener('mousemove', updatePointer, { passive: true })
    window.addEventListener('touchmove', updatePointer, { passive: true })
  }
  const removePointerListeners = () => {
    window.removeEventListener('mousemove', updatePointer)
    window.removeEventListener('touchmove', updatePointer)
  }
  
  onBeforeUnmount(() => removePointerListeners())
  
  const overlayStyle = computed(() => ({
    position: 'fixed',
    left: '0px',
    top: '0px',
    transform: `translate3d(${pointer.value.x + props.overlayOffsetX}px, ${pointer.value.y + props.overlayOffsetY}px, 0)`,
    zIndex: props.overlayZIndex,
    pointerEvents: 'none'
  }))
  
  /**
   * ============ Reglas ============
   */
  const countContainerDepth = (toEl) => {
    let depth = -1
    let node = toEl
    while (node) {
      if (node?.getAttribute?.('data-x-dnd-container') === '1') depth++
      node = node.parentElement
    }
    return Math.max(depth, 0)
  }
  
  const applyRules = (evt) => {
    const rules = props.rules || {}
    const dragged = evt?.draggedContext?.element
    const fromEl = evt?.from
    const toEl = evt?.to
  
    if (rules.lockedKey && dragged && dragged[rules.lockedKey]) return false
    if (rules.disallowCrossList && fromEl && toEl && fromEl !== toEl) return false
  
    if (rules.maxItems != null && fromEl && toEl && fromEl !== toEl) {
      const toList = evt?.relatedContext?.list
      if (Array.isArray(toList) && toList.length >= Number(rules.maxItems)) return false
    }
  
    if (rules.maxDepth != null && toEl) {
      const depth = countContainerDepth(toEl)
      if (depth >= Number(rules.maxDepth)) return false
    }
  
    if (rules.disallowDropIntoInactiveParent) {
      const meta = props.containerMeta || rules.containerMeta
      const parent = meta?.parent
      const k = rules.parentActiveKey ?? 'is_active'
      const v = rules.parentActiveValue ?? 'is_active'
      if (parent && parent[k] !== v) return false
    }
  
    if (typeof rules.custom === 'function') {
      const ok = rules.custom(evt, props.containerMeta)
      if (ok === false) return false
    }
  
    return true
  }
  
  const onMoveInternal = (evt, originalEvent) => {
    if (props.disabled) return false
  
    if (typeof props.canMove === 'function') {
      const ok = props.canMove(evt, originalEvent)
      if (ok === false) return false
    }
  
    return applyRules(evt)
  }
  
  const forward = (name) => (evt, originalEvent) => {
    emit(name, evt, originalEvent)
    notifyList()
  }
  
  const getDraggedFromEvt = (evt) => {
    return evt?.item?.__draggable_context?.element
      ?? evt?.clone?.__draggable_context?.element
      ?? evt?.draggedContext?.element
      ?? null
  }
  
  const onStart = (evt) => {
    isDragging.value = true
    draggedElement.value = getDraggedFromEvt(evt)
    addPointerListeners()
    emit('start', evt)
  }
  
  const onEnd = (evt) => {
    isDragging.value = false
    draggedElement.value = null
    removePointerListeners()
    emit('end', evt)
    notifyList()
  }
  const onChoose = (evt) => {
    draggedElement.value = getDraggedFromEvt(evt) ?? draggedElement.value
    emit('choose', evt)
    notifyList()
  }
  </script>
  
  <template>
    <!-- ✅ MODO LIST: usar :list (mutable), NO v-model -->
    <draggable
      v-if="isListMode"
      v-bind="attrs"
      :list="props.list"
      :tag="tag"
      :group="group"
      :item-key="itemKey"
      :handle="handle"
      :disabled="disabled"
      :animation="animation"
      :ghost-class="ghostClass"
      :chosen-class="chosenClass"
      :drag-class="dragClass"
      :force-fallback="forceFallback"
      :fallback-on-body="fallbackOnBody"
      :touch-start-threshold="touchStartThreshold"
      :move="onMoveInternal"
      data-x-dnd-container="1"
      @change="forward('change')"
      @start="onStart"
      @end="onEnd"
      @add="forward('add')"
      @remove="forward('remove')"
      @update="forward('update')"
      @choose="onChoose"
      @unchoose="forward('unchoose')"
      @sort="forward('sort')"
      @move="forward('move')"
    >
      <template v-if="$slots.header" #header><slot name="header" /></template>
      <!-- Cada ítem va dentro de un elemento real (v2.25.0): vuedraggable marca con data-draggable (lo único que
           SortableJS arrastra) el nodo que devuelve este slot, y un <slot> reenviado es un fragmento que no llega
           al DOM: no se podía arrastrar nada, ni en XTableServer (exportar columnas). -->
      <template #item="slotProps"><div class="x-dnd-item"><slot name="item" v-bind="slotProps" /></div></template>
      <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    </draggable>
  
    <!-- ✅ MODO V-MODEL: usar v-model (inmutable / emit update:modelValue) -->
    <draggable
      v-else
      v-bind="attrs"
      v-model="internalModel"
      :tag="tag"
      :group="group"
      :item-key="itemKey"
      :handle="handle"
      :disabled="disabled"
      :animation="animation"
      :ghost-class="ghostClass"
      :chosen-class="chosenClass"
      :drag-class="dragClass"
      :force-fallback="forceFallback"
      :fallback-on-body="fallbackOnBody"
      :touch-start-threshold="touchStartThreshold"
      :move="onMoveInternal"
      data-x-dnd-container="1"
      @change="forward('change')"
      @start="onStart"
      @end="onEnd"
      @add="forward('add')"
      @remove="forward('remove')"
      @update="forward('update')"
      @choose="onChoose"
      @unchoose="forward('unchoose')"
      @sort="forward('sort')"
      @move="forward('move')"
    >
      <template v-if="$slots.header" #header><slot name="header" /></template>
      <!-- Cada ítem va dentro de un elemento real (v2.25.0): vuedraggable marca con data-draggable (lo único que
           SortableJS arrastra) el nodo que devuelve este slot, y un <slot> reenviado es un fragmento que no llega
           al DOM: no se podía arrastrar nada, ni en XTableServer (exportar columnas). -->
      <template #item="slotProps"><div class="x-dnd-item"><slot name="item" v-bind="slotProps" /></div></template>
      <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    </draggable>
  
    <teleport to="body" v-if="dragOverlay && isDragging">
      <div :style="overlayStyle" class="x-dnd-overlay">
        <slot name="overlay" :element="draggedElement">
          <div class="x-dnd-overlay__card">
            <div class="x-dnd-overlay__title">
              {{ draggedElement?.label ?? draggedElement?.name ?? 'Moving…' }}
            </div>
          </div>
        </slot>
      </div>
    </teleport>
  </template>
  
  <style scoped>
  /* clave para touch y para que el handle siempre sea “arrastrable” */
  :deep(.block-handle) {
    touch-action: none;
    cursor: grab;
  }
  :deep(.block-handle:active) {
    cursor: grabbing;
  }
  </style>
  