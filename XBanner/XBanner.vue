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
    default: 'success' // válidos: success, error, warning, information, courtesy, neutral, trial
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
  warning:     { text: 'yellow-10', bg: 'yellow-7', icon: 'warning' },
  // Riel de CORTESÍAS y CONVENIOS del ERP (v2.7.0): teal suave, el mismo tono
  // que las vistas clínicas ya usaban a mano para distinguirlo de los avisos.
  courtesy:    { text: 'teal-9',    bg: 'teal-1',   icon: 'volunteer_activism' },
  // v2.8.0 — los dos tonos que las vistas clínicas venían pintando a mano y que
  // impedían migrar el aviso de flujo clínico al banner de la casa:
  //  · neutral: situación CERRADA o sin nada que hacer (plan agotado, paciente
  //    derivado). No es un error ni una advertencia: es gris a propósito.
  //  · trial:   algo FUERA de lo habitual (periodo de prueba, atención fuera del
  //    flujo). El morado es la señal de "esto es distinto", no de gravedad.
  // Ambos con icono genérico: quien los use suele pasar el suyo por la prop icon.
  neutral:     { text: 'grey-9',    bg: 'grey-3',   icon: 'info' },
  trial:       { text: 'purple-9',  bg: 'purple-1', icon: 'science' }
}

// --- Calcula los colores a aplicar según el tipo ---
// Alias 'info' → 'information' (v2.6.5): dos vistas ya escribieron "info" y el
// fallback silencioso a success pintaba VERDE un aviso informativo.
//
// v2.8.0 — ese mismo fallback se corrige de raíz: un tipo NO mapeado cae a
// 'neutral', no a 'success'. Pintar de verde éxito un aviso cuyo tipo se escribió
// mal (o que se agregó sin actualizar este mapa) es el peor error posible: un
// "paciente derivado" se leía como una buena noticia. Gris no miente.
// OJO: el default del prop sigue siendo 'success' — un banner SIN type conserva
// su verde de siempre; esto solo cambia el caso del type equivocado.
const bannerColors = computed(() => {
  const type = props.type === 'info' ? 'information' : props.type
  return colorMap[type] || colorMap.neutral
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
