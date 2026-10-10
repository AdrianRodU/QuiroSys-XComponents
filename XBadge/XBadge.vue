<script setup>
import { computed, useAttrs } from 'vue'
import { resolveColor, lightenColor } from '@esolutions/js-utils'

defineOptions({
  name: 'XBadge',
  inheritAttrs: false // Control manual de atributos externos
})

// --- Props con valores por defecto ---
const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: null
  },
  isLightenColor: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: null // Ej: 'success', 'danger', 'warning'
  },
  /** 'light' (default, bg suave) | 'solid' (bg fuerte + texto blanco) */
  variant: {
    type: String,
    default: 'light',
    validator: v => ['light', 'solid'].includes(v),
  },
  /** Nombre del icono (Quasar/FontAwesome). Si se pasa, renderiza con icono. */
  icon: {
    type: String,
    default: null,
  },
  /** Posicion del icono respecto al label: 'left' (default) o 'right'. */
  iconPosition: {
    type: String,
    default: 'left',
    validator: v => ['left', 'right'].includes(v),
  },
})

const attrs = useAttrs()

// --- Color resuelto (nombre/alias → hex) ---
const resolvedColor = computed(() => resolveColor(props.color))

// --- Color de fondo calculado si se pasa color ---
const bgColor = computed(() =>
  resolvedColor.value ? (props.isLightenColor ? lightenColor(resolvedColor.value) : resolvedColor.value) : null
)

// --- Clases dinamicas ---
const badgeClasses = computed(() => [
  'x-badge',
  props.type ? `x-badge-${props.type}` : '',
  props.variant === 'solid' ? 'x-badge-solid' : '',
  props.icon ? 'x-badge-with-icon' : '',
  // Color propio con fondo aclarado: en oscuro, tinte y texto claro (themes/tokens.scss).
  resolvedColor.value && props.variant !== 'solid' ? 'x-badge--custom' : '',
])

// --- Estilo inline solo si NO hay variant solid (porque solid usa clases) ---
const inlineStyle = computed(() => {
  if (!resolvedColor.value) return undefined
  if (props.variant === 'solid') {
    return { color: '#fff', backgroundColor: resolvedColor.value }
  }
  // Variables y no colores directos (v2.27.0): en claro valen lo mismo que antes; en oscuro, el tinte y el texto
  // claro que define tokens.scss para .x-badge--custom.
  return {
    '--x-badge-custom': resolvedColor.value,
    '--x-badge-custom-bg': bgColor.value,
    color: 'var(--x-badge-custom-text, var(--x-badge-custom))',
    backgroundColor: 'var(--x-badge-custom-soft, var(--x-badge-custom-bg))',
  }
})
</script>

<template>
  <q-badge
    style="margin: 0!important;"
    v-bind="attrs"
    :class="badgeClasses"
    :style="inlineStyle"
  >
    <!-- Con icono: render manual para controlar posicion -->
    <template v-if="icon">
      <q-icon v-if="iconPosition === 'left'" :name="icon" class="q-mr-xs" />
      <span>{{ label }}</span>
      <q-icon v-if="iconPosition === 'right'" :name="icon" class="q-ml-xs" />
    </template>
    <!-- Sin icono: solo label -->
    <template v-else>
      {{ label }}
    </template>
  </q-badge>
</template>
