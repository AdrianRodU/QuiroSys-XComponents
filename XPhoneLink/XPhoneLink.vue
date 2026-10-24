<script setup>
/**
 * XPhoneLink (v2.30.0): un teléfono como se lee, con la bandera de su país y el enlace que le corresponde:
 * WhatsApp en verde (icono y tooltip) si es celular, tel: si es fijo. UNA sola fuente de estilo para todas las
 * pantallas: la tarjeta Contacto del perfil del paciente, la celda del seguimiento (Cell::component), etc.
 * Lee el número con la misma regla de XInputPhone (phone.js): E.164 de hoy o los formatos viejos de Perú; lo que
 * no se entiende sale tal cual, sin enlace ni bandera, nunca vacío.
 */
import { computed } from 'vue'
import { DEFAULT_COUNTRY, formatPhone, isMobileType, parsePhone } from '../XInputPhone/phone.js'

defineOptions({ name: 'XPhoneLink' })

const props = defineProps({
  /** Número guardado (E.164 o un formato viejo). */
  modelValue: { type: [String, Number], default: '' },
  /** País con el que se leen los números sin prefijo. */
  defaultCountry: { type: String, default: DEFAULT_COUNTRY },
  /** País de casa: sus números salen en formato nacional ("987 654 321"); los demás, internacional. */
  homeCountry: { type: String, default: DEFAULT_COUNTRY },
  /** Bandera SVG del país (clases `fi fi-xx` de flag-icons, cuyo CSS carga la app, como en XInputPhone). */
  flags: { type: Boolean, default: true },
  /** Color Quasar del enlace de WhatsApp. */
  color: { type: String, default: 'green-7' },
  tooltip: { type: String, default: 'Escribirle por WhatsApp' },
  telTooltip: { type: String, default: 'Llamar' },
  /** Texto cuando no hay número; vacío, no pinta nada (quien lo usa decide su "Sin registrar"). */
  empty: { type: String, default: '' },
  /** XTableServer se lo manda a toda celda-componente; aquí no aplica. */
  disable: { type: Boolean, default: false },
})

const raw = computed(() => String(props.modelValue ?? '').trim())
const pn = computed(() => (raw.value ? parsePhone(raw.value, props.defaultCountry) : null))
const valid = computed(() => !!pn.value && pn.value.isValid())
const shown = computed(() => formatPhone(raw.value, { defaultCountry: props.defaultCountry, homeCountry: props.homeCountry }))
const iso = computed(() => (valid.value ? pn.value.country : null))
const whatsapp = computed(() => valid.value && isMobileType(pn.value))
const href = computed(() => {
  if (!valid.value) return null
  return whatsapp.value ? `https://wa.me/${pn.value.number.slice(1)}` : `tel:${pn.value.number}`
})
const flagClass = (code) => `fi fi-${String(code).toLowerCase()} x-phone-link__flag`
</script>

<template>
  <a
    v-if="href"
    :href="href"
    :target="whatsapp ? '_blank' : undefined"
    :rel="whatsapp ? 'noopener' : undefined"
    class="x-phone-link"
    :class="whatsapp ? `x-phone-link--whatsapp text-${color}` : 'x-phone-link--tel'"
    @click.stop
  >
    <q-icon :name="whatsapp ? 'fab fa-whatsapp' : 'fal fa-phone'" class="x-phone-link__icon" />
    <span v-if="flags && iso" :class="flagClass(iso)" aria-hidden="true"></span>
    <span class="x-phone-link__number">{{ shown }}</span>
    <q-tooltip>{{ whatsapp ? tooltip : telTooltip }}</q-tooltip>
  </a>
  <span v-else-if="shown" class="x-phone-link x-phone-link--plain">{{ shown }}</span>
  <span v-else-if="empty" class="x-phone-link x-phone-link--empty">{{ empty }}</span>
</template>

<style scoped>
.x-phone-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1.2;
}
.x-phone-link--tel {
  color: inherit;
}
.x-phone-link:hover .x-phone-link__number {
  text-decoration: underline;
}
.x-phone-link__icon {
  font-size: 1.1em;
}
.x-phone-link__flag {
  width: 18px;
  height: 13px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}
.x-phone-link--plain {
  font-weight: 400;
}
.x-phone-link--empty {
  color: var(--x-text-muted, #94a3b8);
  font-weight: 400;
}
</style>
