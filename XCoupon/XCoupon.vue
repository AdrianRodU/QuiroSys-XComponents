<script setup>
/**
 * XCoupon — un cupón "de verdad", de los que se recortan: borde punteado con la tijera, el cuerpo de la oferta en el
 * color de la marca (lo que se regala, el precio tachado, el precio del cupón y cuánto se ahorra) y, separado por la
 * línea perforada con sus muescas, el talón con el código y hasta cuándo vale (v2.32.0; lo pidió Adrián el 29/10/2026
 * para la tarjeta de recomendación: "más marketero vendedor, que se vea como un cupón de verdad, como si se cortara").
 *
 * Uso:
 *   <XCoupon
 *     eyebrow="Tarjeta de recomendación" title="Consulta quiropráctica + RX"
 *     :price="175" :old-price="300" code="REC-58-K7Q2XA" expires="28/11/2026"
 *     note="Un solo uso" copyable
 *   >
 *     <template #subtitle><b>Ana R.</b> te regala</template>
 *   </XCoupon>
 *
 * Con `stamp` ("Usada", "Vencida", "Anulada") el cupón se apaga y lleva el sello encima.
 */
import { computed } from 'vue'
import { copyToClipboard, useQuasar } from 'quasar'
import { resolveColor } from '@esolutions/js-utils'
import XButton from '../XButton/XButton.vue'

defineOptions({ name: 'XCoupon' })

const props = defineProps({
  /** Rótulo chico del cuerpo ("Tarjeta de recomendación") */
  eyebrow: { type: String, default: '' },
  /** Línea sobre el título ("Ana R. te regala"); también por el slot `subtitle` */
  subtitle: { type: String, default: '' },
  /** Lo que se regala o se ofrece */
  title: { type: String, default: '' },
  /** Precio del cupón; null = sin precio */
  price: { type: [Number, String], default: null },
  /** Precio de lista, tachado; solo se muestra si es mayor que `price` */
  oldPrice: { type: [Number, String], default: null },
  currency: { type: String, default: 'S/' },
  /** Texto del ahorro ("Ahorras S/ 125"); vacío lo oculta */
  savingsLabel: { type: String, default: 'Ahorras' },
  code: { type: String, default: '' },
  codeLabel: { type: String, default: 'Código' },
  expires: { type: String, default: '' },
  expiresLabel: { type: String, default: 'Vale hasta' },
  /** Nota del talón ("Un solo uso · Para María") */
  note: { type: String, default: '' },
  /** Sello encima del cupón ("Usada", "Vencida", "Anulada"): lo apaga */
  stamp: { type: String, default: '' },
  /** Ícono del cuerpo, arriba a la derecha */
  icon: { type: String, default: 'redeem' },
  /** Color del cuerpo: 'primary' (el de la app), un nombre del mapa de colores (teal, purple, green...) o color CSS */
  color: { type: String, default: 'primary' },
  /** Botón para copiar el código */
  copyable: { type: Boolean, default: false },
  copyMessage: { type: String, default: 'Código copiado' },
  /** Borde punteado con la tijera alrededor ("para recortar") */
  cutLine: { type: Boolean, default: true },
})

const emit = defineEmits(['copy'])
const $q = useQuasar()

const cssColor = computed(() => (props.color === 'primary' ? 'var(--q-primary)' : resolveColor(props.color) || props.color))
const toNumber = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const money = (v) => `${props.currency} ${Number.isInteger(v) ? v : v.toFixed(2)}`
const priceValue = computed(() => toNumber(props.price))
const oldValue = computed(() => {
  const old = toNumber(props.oldPrice)
  return old !== null && priceValue.value !== null && old > priceValue.value ? old : null
})
const savings = computed(() =>
  props.savingsLabel && oldValue.value !== null ? `${props.savingsLabel} ${money(Math.round((oldValue.value - priceValue.value) * 100) / 100)}` : '',
)
const ariaLabel = computed(() =>
  [props.eyebrow, props.title, priceValue.value !== null ? money(priceValue.value) : '', props.code && `${props.codeLabel} ${props.code}`,
    props.expires && `${props.expiresLabel} ${props.expires}`, props.stamp].filter(Boolean).join(' · '),
)

async function copy() {
  try {
    await copyToClipboard(props.code)
    $q.notify({ type: 'positive', message: props.copyMessage })
    emit('copy', props.code)
  } catch {
    $q.notify({ type: 'warning', message: 'No se pudo copiar: selecciona el código y cópialo a mano' })
  }
}
</script>

<template>
  <div
    class="x-coupon"
    :class="{ 'x-coupon--cut': cutLine, 'x-coupon--stamped': !!stamp }"
    :style="{ '--x-coupon-color': cssColor }"
    role="group"
    :aria-label="ariaLabel"
  >
    <q-icon v-if="cutLine" name="content_cut" class="x-coupon__scissors" aria-hidden="true" />

    <div class="x-coupon__ticket">
      <div class="x-coupon__main">
        <div class="x-coupon__top">
          <span v-if="eyebrow" class="x-coupon__eyebrow">{{ eyebrow }}</span>
          <q-icon v-if="icon" :name="icon" class="x-coupon__icon" aria-hidden="true" />
        </div>
        <div v-if="subtitle || $slots.subtitle" class="x-coupon__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
        <div v-if="title" class="x-coupon__title">{{ title }}</div>
        <div v-if="priceValue !== null" class="x-coupon__prices">
          <s v-if="oldValue !== null" class="x-coupon__old">{{ money(oldValue) }}</s>
          <span class="x-coupon__price">{{ money(priceValue) }}</span>
          <span v-if="savings" class="x-coupon__savings">{{ savings }}</span>
        </div>
      </div>

      <div class="x-coupon__perf" aria-hidden="true" />

      <div class="x-coupon__stub">
        <div class="x-coupon__fields">
          <div v-if="code" class="x-coupon__field x-coupon__field--code">
            <div class="x-coupon__label">{{ codeLabel }}</div>
            <div class="x-coupon__code-row">
              <span class="x-coupon__code">{{ code }}</span>
              <x-button
                v-if="copyable && !stamp"
                flat
                round
                dense
                size="sm"
                icon="content_copy"
                class="x-coupon__copy"
                tooltip-text="Copiar el código"
                aria-label="Copiar el código"
                @click="copy"
              />
            </div>
          </div>
          <div v-if="expires" class="x-coupon__field x-coupon__field--expires">
            <div class="x-coupon__label">{{ expiresLabel }}</div>
            <div class="x-coupon__expires">{{ expires }}</div>
          </div>
        </div>
        <div v-if="note" class="x-coupon__note">{{ note }}</div>
        <slot />
      </div>

      <div v-if="stamp" class="x-coupon__stamp">{{ stamp }}</div>
    </div>
  </div>
</template>

<style scoped>
/* El fondo donde se apoya el cupón: lo usan la tijera y las muescas para "morder" el borde. */
.x-coupon {
  --x-coupon-bg: var(--x-coupon-cut-bg, var(--x-surface, #ffffff));
  --x-coupon-deep: color-mix(in srgb, var(--x-coupon-color) 70%, #000000);
  position: relative;
  max-width: 440px;
  margin: 0 auto;
}
.x-coupon--cut {
  padding: 10px;
  border: 2px dashed var(--x-border-strong, #94a3b8);
  border-radius: 18px;
}
.x-coupon__scissors {
  position: absolute;
  top: -12px;
  left: 22px;
  font-size: 20px;
  padding: 0 4px;
  color: var(--x-text-muted, #64748b);
  background: var(--x-coupon-bg);
}

.x-coupon__ticket {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 28px -14px rgba(15, 23, 42, 0.35);
}

/* Cuerpo: el color de la marca con un degradado y dos círculos de adorno. */
.x-coupon__main {
  position: relative;
  padding: 16px 18px 20px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--x-coupon-color) 0%, var(--x-coupon-deep) 100%);
  overflow: hidden;
}
.x-coupon__main::before,
.x-coupon__main::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
}
.x-coupon__main::before {
  width: 180px;
  height: 180px;
  right: -60px;
  top: -80px;
}
.x-coupon__main::after {
  width: 110px;
  height: 110px;
  right: 40px;
  bottom: -70px;
}
.x-coupon__top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 26px;
}
.x-coupon__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.28);
}
.x-coupon__icon {
  font-size: 28px;
  opacity: 0.9;
  margin-left: auto;
}
.x-coupon__subtitle {
  position: relative;
  margin-top: 12px;
  font-size: 15px;
  opacity: 0.92;
}
.x-coupon__subtitle :deep(b) {
  font-weight: 700;
  opacity: 1;
}
.x-coupon__title {
  position: relative;
  margin-top: 2px;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.x-coupon__prices {
  position: relative;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 10px;
}
.x-coupon__old {
  font-size: 16px;
  opacity: 0.7;
}
.x-coupon__price {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}
.x-coupon__savings {
  align-self: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #713f12;
  background: #fde047;
  box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.35);
}

/* Línea perforada con sus muescas: dos círculos del color del fondo "muerden" el ticket. */
.x-coupon__perf {
  position: relative;
  height: 0;
  border-top: 2px dashed color-mix(in srgb, var(--x-coupon-color) 45%, transparent);
  background: var(--x-surface, #ffffff);
}
.x-coupon__perf::before,
.x-coupon__perf::after {
  content: '';
  position: absolute;
  top: -12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--x-coupon-bg);
}
.x-coupon__perf::before {
  left: -11px;
}
.x-coupon__perf::after {
  right: -11px;
}

/* Talón: el código y hasta cuándo vale. */
.x-coupon__stub {
  padding: 14px 18px 16px;
  background: var(--x-surface, #ffffff);
  color: var(--x-text, #0f172a);
}
.x-coupon__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px 16px;
}
.x-coupon__field--expires {
  text-align: right;
  margin-left: auto;
}
.x-coupon__label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--x-text-muted, #64748b);
}
.x-coupon__code-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.x-coupon__code {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--x-coupon-color);
  word-break: break-all;
}
.x-coupon__copy {
  color: var(--x-text-muted, #64748b);
}
.x-coupon__expires {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
}
.x-coupon__note {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--x-text-muted, #64748b);
}

/* Sello: el cupón apagado y el sello rojo encima. */
.x-coupon--stamped .x-coupon__main,
.x-coupon--stamped .x-coupon__stub {
  filter: grayscale(0.9);
  opacity: 0.75;
}
.x-coupon__stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-12deg);
  padding: 4px 16px;
  border: 3px solid #dc2626;
  border-radius: 10px;
  color: #dc2626;
  background: rgba(255, 255, 255, 0.9);
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  white-space: nowrap;
  pointer-events: none;
}
</style>

<style>
/* Modo oscuro (fuera del scoped: en un <style scoped>, .body--dark no llega). */
.body--dark .x-coupon__code {
  color: color-mix(in srgb, var(--x-coupon-color) 55%, #ffffff);
}
.body--dark .x-coupon__stamp {
  background: rgba(15, 23, 42, 0.9);
}
</style>
