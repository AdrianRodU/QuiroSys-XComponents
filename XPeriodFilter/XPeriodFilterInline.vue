<script setup>
/**
 * XPeriodFilterInline — la forma EN LÍNEA del filtro de período (tablas y
 * reportes): un selector con los modos y los campos de fecha o de mes que pide
 * el modo elegido. Hermana de XPeriodFilter (forma compacta, dashboards): las
 * mismas etiquetas, en español dentro del componente (periodModes.js).
 *
 * v-model = el filtro con los nombres que lee el backend (quirosys/datatable,
 * FilterTrait::getFilterDate): { value, dateStart, dateEnd, monthStart, monthEnd }
 *   - value: 'month' | 'date' | 'between_months' | 'between_dates' | 'all'
 *   - dateStart / dateEnd: 'YYYY-MM-DD' · monthStart / monthEnd: 'YYYY-MM'
 *
 * Cada cambio del usuario emite UNA vez `update:modelValue` y `change` con los
 * cinco campos; los demás van tal como llegaron (un campo ausente sigue
 * ausente). No emite al montar: quien lo usa decide cuándo consultar.
 */
import { computed } from 'vue'
import XSelect from '../XSelect/XSelect.vue'
import XDatepicker from '../XDatepicker/XDatepicker.vue'
import XDatepickerMonth from '../XDatepicker/XDatepickerMonth.vue'
import { PERIOD_MODE_LABELS } from './periodModes'

defineOptions({ name: 'XPeriodFilterInline' })

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  // Modos, en su orden: ids ('month', …) u objetos { id, name } como los manda
  // el backend (Filter::makePeriod). Sin modos: los cuatro de siempre.
  options: { type: Array, default: null },
  label: { type: String, default: 'Periodo' },
  // Espaciado entre campos: el mismo de la grilla donde va ('sm' en los filtros
  // de las tablas, 'md' en los formularios de reporte). Así los campos quedan
  // alineados con los de arriba y abajo.
  gutter: { type: String, default: 'sm' },
  // En el teléfono, un campo por fila, como el resto de un formulario. Sin esto
  // los campos comparten la fila (así van en las tablas).
  stack: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const FIELDS = ['value', 'dateStart', 'dateEnd', 'monthStart', 'monthEnd']
const DEFAULT_MODES = ['month', 'date', 'between_months', 'between_dates']

const current = computed(() => Object.fromEntries(FIELDS.map((k) => [k, props.modelValue?.[k]])))

// La etiqueta sale del componente; la del backend queda solo para un modo que
// el componente no conozca.
const modeOptions = computed(() => (props.options?.length ? props.options : DEFAULT_MODES).map((o) => {
  const id = o !== null && typeof o === 'object' ? o.id : o
  const fallback = o !== null && typeof o === 'object' ? o.name : id
  return { id, name: PERIOD_MODE_LABELS[id] || fallback }
}))

const rowClass = computed(() => `row q-col-gutter-x-${props.gutter} q-col-gutter-y-${props.gutter} x-period-filter-inline`)
const fieldClass = computed(() => (props.stack ? 'col-24 col-sm' : 'col'))

const mode = computed(() => current.value.value)
const isDateMode = computed(() => mode.value === 'date' || mode.value === 'between_dates')
const isMonthMode = computed(() => mode.value === 'month' || mode.value === 'between_months')

function set(field, val) {
  const next = { ...current.value, [field]: val }
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div :class="rowClass">
    <div v-if="modeOptions.length > 1" :class="fieldClass">
      <x-select
        :model-value="mode"
        :label="label"
        :options="modeOptions"
        @update:model-value="(v) => set('value', v)"
      />
    </div>

    <div v-if="isDateMode" :class="fieldClass">
      <x-datepicker
        :model-value="current.dateStart"
        :label="mode === 'date' ? 'Fecha' : 'Fecha del'"
        @update:model-value="(v) => set('dateStart', v)"
      />
    </div>
    <div v-if="mode === 'between_dates'" :class="fieldClass">
      <x-datepicker
        :model-value="current.dateEnd"
        label="Fecha al"
        @update:model-value="(v) => set('dateEnd', v)"
      />
    </div>

    <div v-if="isMonthMode" :class="fieldClass">
      <x-datepicker-month
        :model-value="current.monthStart"
        :label="mode === 'month' ? 'Mes' : 'Mes del'"
        @update:model-value="(v) => set('monthStart', v)"
      />
    </div>
    <div v-if="mode === 'between_months'" :class="fieldClass">
      <x-datepicker-month
        :model-value="current.monthEnd"
        label="Mes al"
        @update:model-value="(v) => set('monthEnd', v)"
      />
    </div>
  </div>
</template>
