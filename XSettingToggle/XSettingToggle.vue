<script setup>
/**
 * XSettingToggle — fila de ajuste: [ícono] título + descripción a la izquierda,
 * switch a la derecha. Renderiza su propia descripción con color legible (el
 * `hint` nativo de XToggle usa text-secondary, casi invisible).
 *
 * Props:
 *  - label / description: título y texto de ayuda (debajo del título).
 *  - icon: ícono estático. iconOn/iconOff: alternan según el estado.
 *  - feedbackOff: aviso inline que aparece SOLO cuando el toggle está apagado.
 *  - disable: deshabilita el switch.
 *  - boxed: contenedor sutil (para destacar un switch "maestro").
 */
import { computed } from 'vue'
import XToggle from '../XToggle/XToggle.vue'

defineOptions({ name: 'XSettingToggle' })

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  label:       { type: String,  default: '' },
  description: { type: String,  default: '' },
  icon:        { type: String,  default: '' },
  iconOn:      { type: String,  default: '' },
  iconOff:     { type: String,  default: '' },
  feedbackOff: { type: String,  default: '' },
  disable:     { type: Boolean, default: false },
  boxed:       { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const currentIcon = computed(() => {
  if (props.iconOn || props.iconOff) return props.modelValue ? props.iconOn : props.iconOff
  return props.icon
})
</script>

<template>
  <div class="x-setting-toggle" :class="{ 'x-setting-toggle--boxed': boxed }">
    <div class="row items-center no-wrap">
      <q-icon
        v-if="currentIcon"
        :name="currentIcon"
        size="22px"
        class="x-setting-toggle__icon q-mr-sm"
        :class="{ 'x-setting-toggle__icon--on': modelValue }"
      />
      <div class="col q-pr-md">
        <div class="text-body2 text-weight-medium">{{ label }}</div>
        <div v-if="description" class="x-setting-toggle__desc text-caption">{{ description }}</div>
      </div>
      <XToggle v-model="model" :disable="disable" />
    </div>

    <div
      v-if="feedbackOff && !modelValue"
      class="x-setting-toggle__feedback text-caption q-mt-xs"
      :style="currentIcon ? 'padding-left: 30px' : ''"
    >
      <q-icon name="fa-solid fa-circle-info" size="12px" class="q-mr-xs" />{{ feedbackOff }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.x-setting-toggle {
  &--boxed {
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--x-neutral-soft, rgba(0, 0, 0, 0.02));
    border: 1px solid var(--x-border, rgba(0, 0, 0, 0.08));
  }
  &__desc {
    color: var(--x-text-muted, #6b7280);
    line-height: 1.3;
    margin-top: 2px;
  }
  &__icon {
    color: var(--x-text-subtle, #9ca3af);
    transition: color 0.15s ease;
    &--on { color: var(--x-primary-text, var(--q-primary)); }
  }
  &__feedback {
    color: var(--x-tone-orange-text, #b45309);
    line-height: 1.3;
  }
}
.body--dark .x-setting-toggle {
  &--boxed {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.12);
  }
  .x-setting-toggle__desc { color: var(--x-text-subtle, #9ca3af); }
  .x-setting-toggle__feedback { color: #fbbf24; }
}
</style>
