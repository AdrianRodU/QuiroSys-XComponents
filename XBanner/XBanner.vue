<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({
  name: 'XBanner',
  inheritAttrs: false // control manual de atributos externos
})

// --- Props ---
const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'success' // opciones válidas: success, error, warning, information
  },
  // Icono propio (pisa el del tipo). Vacío = usa el del tipo.
  icon: {
    type: String,
    default: ''
  },
  // true = banner sin icono (comportamiento previo a v2.6.4)
  noIcon: {
    type: Boolean,
    default: false
  }
})

const attrs = useAttrs()

// --- Mapa de colores + icono por tipo de banner (v2.6.4: icono automático,
// homogéneo en todo el sistema; antes cada vista armaba el suyo a mano) ---
const colorMap = {
  success:     { text: 'green-10',  bg: 'green-11', icon: 'check_circle' },
  error:       { text: 'red-10',    bg: 'red-2',    icon: 'error' },
  information: { text: 'blue-10',   bg: 'blue-3',   icon: 'info' },
  warning:     { text: 'yellow-10', bg: 'yellow-7', icon: 'warning' }
}

// --- Calcula los colores a aplicar según el tipo ---
// Alias 'info' → 'information' (v2.6.5): dos vistas ya escribieron "info" y el
// fallback silencioso a success pintaba VERDE un aviso informativo.
const bannerColors = computed(() => {
  const type = props.type === 'info' ? 'information' : props.type
  return colorMap[type] || colorMap.success
})

// Icono a pintar: el propio, o el del tipo; noIcon lo apaga.
const bannerIcon = computed(() =>
  props.noIcon ? '' : (props.icon || bannerColors.value.icon)
)
</script>

<template>
  <q-banner
    v-bind="attrs"
    class="x-banner"
    :class="[`text-${bannerColors.text}`, `bg-${bannerColors.bg}`]"
  >
    <template v-if="bannerIcon" #avatar>
      <q-icon :name="bannerIcon" :color="bannerColors.text" size="20px" />
    </template>
    <span>{{ props.label }}</span>
    <slot />
  </q-banner>
</template>
