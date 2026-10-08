<script setup>
/**
 * XSlider — barra para elegir un número dentro de un rango (escalas de 1 a 10, porcentajes…), con su
 * etiqueta a la izquierda y el valor elegido a la derecha. Envuelve q-slider con el estilo de la casa
 * (v2.24.0; nace para la escala "Impacto en su Vida" de la ficha de información).
 *
 * Uso:
 *   <XSlider
 *     v-model="nivel"
 *     label="Nivel de estrés"
 *     :min="1" :max="10"
 *     markers
 *     :marker-labels="[{ value: 1, label: 'Leve' }, { value: 10, label: 'Alto' }]"
 *     value-suffix="/10"
 *     color="#f59e0b"
 *     value-bg="#fef3c7"
 *   />
 *
 * `color` (barra, círculo y número) acepta cualquier color CSS; sin él usa el primario. `value-bg` es el
 * fondo del número; sin él sale un tinte suave del mismo color. Para un semáforo por valor, el componente
 * que lo usa calcula `color` y `value-bg` según el valor.
 *
 * Sin respuesta: con `v-model` en null la barra no muestra el círculo (q-slider lo dejaría en el mínimo y
 * parecería que eligió ese número) y, si se pasa `empty-text`, ese texto ocupa el lugar del número (por
 * ejemplo "Toque la barra"). El primer toque o clic elige el valor. `error` pinta el mensaje debajo, como
 * en XInput (String o el Array de un 422 de Laravel).
 */
import { computed } from 'vue'
import XHelpTip from '../XHelpTip/XHelpTip.vue'

defineOptions({ name: 'XSlider' })

const props = defineProps({
  modelValue: { type: Number, default: null },
  label: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  step: { type: Number, default: 1 },
  // Igual que en q-slider: true marca cada paso; un número, cada N.
  markers: { type: [Boolean, Number], default: false },
  // Igual que en q-slider: [{ value, label }], un objeto { valor: texto } o true.
  markerLabels: { type: [Boolean, Array, Object, Function], default: false },
  showValue: { type: Boolean, default: true },
  valueSuffix: { type: String, default: '' },
  // Texto en el lugar del número mientras no hay valor (v-model en null).
  emptyText: { type: String, default: '' },
  color: { type: String, default: '' },
  valueBg: { type: String, default: '' },
  trackSize: { type: String, default: '6px' },
  thumbSize: { type: String, default: '24px' },
  isRequired: { type: Boolean, default: false },
  help: { type: String, default: '' },
  error: { type: [String, Array], default: null },
  disable: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const isEmpty = computed(() => props.modelValue == null)

const errorMessage = computed(() => {
  if (!props.error) return null
  return Array.isArray(props.error) ? props.error[0] : props.error
})

const cssVars = computed(() => ({
  '--x-slider-color': props.color || 'var(--q-primary)',
  '--x-slider-value-bg': props.valueBg || 'color-mix(in srgb, var(--x-slider-color) 14%, transparent)',
}))

// q-slider puede emitir null (teclado): se conserva el valor que había.
function onUpdate(val) {
  if (val != null) emit('update:modelValue', val)
}

function onChange(val) {
  if (val != null) emit('change', val)
}
</script>

<template>
  <div
    class="x-slider"
    :class="{ 'x-slider--disabled': disable, 'x-slider--empty': isEmpty, 'x-slider--error': !!errorMessage }"
    :style="cssVars"
  >
    <div v-if="label || (showValue && (!isEmpty || emptyText))" class="x-slider__head">
      <span v-if="label" class="x-slider__label">
        {{ label }}
        <span v-if="isRequired" class="text-negative" aria-hidden="true">*</span>
        <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
      </span>
      <span v-if="showValue && !isEmpty" class="x-slider__value">
        <span class="x-slider__value-number">{{ modelValue }}</span>
        <span v-if="valueSuffix" class="x-slider__value-suffix">{{ valueSuffix }}</span>
      </span>
      <span v-else-if="showValue && emptyText" class="x-slider__value x-slider__value--empty">{{ emptyText }}</span>
    </div>

    <q-slider
      class="x-slider__slider"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :markers="markers"
      :marker-labels="markerLabels"
      :track-size="trackSize"
      :thumb-size="thumbSize"
      :disable="disable"
      :readonly="readonly"
      :aria-label="label || undefined"
      :aria-required="isRequired ? 'true' : undefined"
      :aria-invalid="errorMessage ? 'true' : undefined"
      @update:model-value="onUpdate"
      @change="onChange"
    />

    <div v-if="errorMessage" class="x-slider__error" role="alert">{{ errorMessage }}</div>
  </div>
</template>

<style lang="scss" scoped>
.x-slider__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.x-slider__label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  color: #334155;
}

.x-slider__value {
  display: inline-flex;
  align-items: baseline;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  color: var(--x-slider-color);
  background: var(--x-slider-value-bg);
}

.x-slider__value-number {
  font-size: 18px;
}

.x-slider__value-suffix {
  font-size: 12px;
  opacity: 0.7;
}

// Sin respuesta: pastilla gris punteada con el texto de ayuda, en vez de un número.
.x-slider__value--empty {
  align-items: center;
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  border: 1px dashed #94a3b8;
}

.x-slider__slider {
  // Espacio para las etiquetas de las marcas bajo la barra.
  padding-bottom: 4px;

  // Sin la prop `color`, q-slider no agrega clase text-*, pero Quasar fija `color: var(--q-primary)`
  // directamente en la barra y el círculo: hay que alcanzarlos para que tomen el color elegido.
  :deep(.q-slider__track),
  :deep(.q-slider__thumb) {
    color: var(--x-slider-color);
  }

  :deep(.q-slider__marker-labels) {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
  }
}

// Sin valor, q-slider deja el círculo en el mínimo: se oculta para que no parezca una respuesta.
.x-slider--empty .x-slider__slider :deep(.q-slider__thumb) {
  opacity: 0;
}

.x-slider--error .x-slider__value--empty {
  color: var(--q-negative);
  border-color: var(--q-negative);
  background: #fef2f2;
}

.x-slider__error {
  margin-top: 2px;
  font-size: 12px;
  color: var(--q-negative);
}

.x-slider--disabled {
  opacity: 0.6;
}

:global(.body--dark) .x-slider__label {
  color: #e2e8f0;
}

:global(.body--dark) .x-slider__slider :deep(.q-slider__marker-labels) {
  color: #94a3b8;
}
</style>
