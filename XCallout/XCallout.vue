<script setup>
/**
 * XCallout — aviso al estilo de las alertas de GitHub (Nota, Consejo,
 * Importante, Advertencia, Cuidado): barra de color a la izquierda, título con
 * ícono y el texto debajo. Para explicar un dato "en cristiano" junto a él, sin
 * el peso de un XBanner (que es un aviso de pantalla completa).
 *
 * Uso:
 *   <XCallout type="tip" title="¡Felicitaciones!">Esta semana llevas…</XCallout>
 *   <XCallout type="warning" dense>…</XCallout>   (compacto, dentro de tarjetas)
 *
 * Tipos (los de GitHub): note (azul), tip (verde), important (morado),
 * warning (ámbar), caution (rojo). Un tipo desconocido cae a `note`: nunca pinta
 * de verde "éxito" un aviso cuyo tipo se escribió mal (lección de XBanner v2.8.0).
 */
import { computed } from 'vue'

defineOptions({ name: 'XCallout' })

const props = defineProps({
  type: { type: String, default: 'note' },
  // Título; vacío = el del tipo (Nota, Consejo, Importante, Advertencia, Cuidado).
  title: { type: String, default: '' },
  // Ícono propio; vacío = el del tipo.
  icon: { type: String, default: '' },
  // Compacto: menos relleno y letra más chica (para usarlo dentro de tarjetas).
  dense: { type: Boolean, default: false },
})

const TYPES = {
  note: { title: 'Nota', icon: 'info' },
  tip: { title: 'Consejo', icon: 'lightbulb' },
  important: { title: 'Importante', icon: 'feedback' },
  warning: { title: 'Advertencia', icon: 'warning' },
  caution: { title: 'Cuidado', icon: 'report' },
}

const kind = computed(() => (TYPES[props.type] ? props.type : 'note'))
const titleText = computed(() => props.title || TYPES[kind.value].title)
const iconName = computed(() => props.icon || TYPES[kind.value].icon)
</script>

<template>
  <div class="x-callout" :class="[`x-callout--${kind}`, { 'x-callout--dense': dense }]" role="note">
    <div class="x-callout__title">
      <q-icon :name="iconName" class="x-callout__icon" />
      <slot name="title">{{ titleText }}</slot>
    </div>
    <div class="x-callout__body">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.x-callout {
  --x-callout-color: #0969da;
  --x-callout-bg: rgba(9, 105, 218, 0.06);
  padding: 8px 14px;
  border-left: 4px solid var(--x-callout-color);
  border-radius: 0;
  background: var(--x-callout-bg);
  color: #1f2328;

  &--note { --x-callout-color: #0969da; --x-callout-bg: rgba(9, 105, 218, 0.06); }
  &--tip { --x-callout-color: #1a7f37; --x-callout-bg: rgba(26, 127, 55, 0.07); }
  &--important { --x-callout-color: #8250df; --x-callout-bg: rgba(130, 80, 223, 0.07); }
  &--warning { --x-callout-color: #9a6700; --x-callout-bg: rgba(191, 135, 0, 0.1); }
  &--caution { --x-callout-color: #cf222e; --x-callout-bg: rgba(207, 34, 46, 0.06); }
}

.x-callout__title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--x-callout-color);
}

.x-callout__icon {
  font-size: 16px;
}

.x-callout__body {
  font-size: 13px;
  line-height: 1.5;

  :deep(p) { margin: 0 0 4px; }
  :deep(p:last-child) { margin-bottom: 0; }
}

.x-callout--dense {
  padding: 6px 10px;

  .x-callout__title { font-size: 12px; margin-bottom: 2px; }
  .x-callout__icon { font-size: 14px; }
  .x-callout__body { font-size: 12px; }
}

.body--dark .x-callout {
  color: #e6edf3;
}
</style>
