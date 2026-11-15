<script>
// Una vez por nombre en toda la app, no por insignia (ver warnUnknownColor).
const WARNED = new Set()
// Los nombres de Quasar que se usan en q-btn o q-icon; en el mapa de js-utils son success y danger (v2.36.0).
const QUASAR_ALIASES = { positive: 'success', negative: 'danger' }
const isCssColor = (c) => typeof CSS === 'undefined' || !CSS.supports || CSS.supports('color', c)
</script>

<script setup>
import { computed, useAttrs, watch } from 'vue'
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
  /**
   * Fondo de un `color` propio (v2.36.0). Sin pasarlo, la variante 'light' aclara el fondo y el texto va en el color;
   * antes el fondo salía del mismo color que el texto y la etiqueta no se veía. `false`: fondo fuerte y texto blanco.
   */
  isLightenColor: {
    type: Boolean,
    default: undefined
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
// Un color que no se puede pintar (p. ej. 'orange-8', un tono de Quasar) sale gris y avisa en la consola, en vez del azul
// por defecto de QBadge o de una insignia sin fondo (v2.36.0).
const nameOf = (color) => (color ? QUASAR_ALIASES[color.toLowerCase()] || color : null)
const resolvedColor = computed(() => {
  const name = nameOf(props.color)
  if (!name) return null
  const c = resolveColor(name)
  return isCssColor(c) ? c : resolveColor('neutral')
})

// --- Fondo fuerte (solid o is-lighten-color en false) o suave (lo demás) ---
const strong = computed(() => props.variant === 'solid' || props.isLightenColor === false)
const bgColor = computed(() =>
  resolvedColor.value ? (strong.value ? resolvedColor.value : lightenColor(resolvedColor.value)) : null
)

function warnUnknownColor(color) {
  if (!color || WARNED.has(color) || isCssColor(resolveColor(nameOf(color)))) return
  WARNED.add(color)
  console.warn(
    `[XBadge] "${color}" no es un color del mapa (green, orange, yellow, teal, grey, positive…) ni un color CSS: ` +
      'la insignia sale gris. Usa un nombre del mapa o un hex.',
  )
}
watch(() => props.color, warnUnknownColor, { immediate: true })

// --- Clases dinamicas ---
const badgeClasses = computed(() => [
  'x-badge',
  props.type ? `x-badge-${props.type}` : '',
  props.variant === 'solid' ? 'x-badge-solid' : '',
  props.icon ? 'x-badge-with-icon' : '',
  // Color propio con fondo aclarado: en oscuro, tinte y texto claro (themes/tokens.scss).
  resolvedColor.value && !strong.value ? 'x-badge--custom' : '',
])

// --- Estilo inline solo si NO hay variant solid (porque solid usa clases) ---
const inlineStyle = computed(() => {
  if (!resolvedColor.value) return undefined
  if (strong.value) {
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
