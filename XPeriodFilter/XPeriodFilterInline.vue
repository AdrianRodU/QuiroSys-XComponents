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

const mode = computed(() => current.value.value)
const isDateMode = computed(() => mode.value === 'date' || mode.value === 'between_dates')
const isMonthMode = computed(() => mode.value === 'month' || mode.value === 'between_months')

// Con un rango (dos campos) el modo baja a su propia fila cuando los tres no
// caben: así las dos fechas quedan juntas (ver los estilos de abajo).
const RANGE_CLASS = { between_dates: 'x-period-filter-inline--dates', between_months: 'x-period-filter-inline--months' }
const rowClass = computed(() => [
  `row q-col-gutter-x-${props.gutter} q-col-gutter-y-${props.gutter} x-period-filter-inline`,
  RANGE_CLASS[mode.value] || '',
])
const fieldClass = computed(() => (props.stack ? 'col-24 col-sm' : 'col'))

function set(field, val) {
  const next = { ...current.value, [field]: val }
  emit('update:modelValue', next)
  emit('change', next)
}
</script>

<template>
  <div :class="rowClass">
    <div v-if="modeOptions.length > 1" :class="[fieldClass, 'x-period-filter-inline__mode']">
      <x-select
        :model-value="mode"
        :label="label"
        :options="modeOptions"
        @update:model-value="(v) => set('value', v)"
      />
    </div>

    <div v-if="isDateMode" :class="[fieldClass, 'x-period-filter-inline__field']">
      <x-datepicker
        :model-value="current.dateStart"
        :label="mode === 'date' ? 'Fecha' : 'Fecha del'"
        @update:model-value="(v) => set('dateStart', v)"
      />
    </div>
    <div v-if="mode === 'between_dates'" :class="[fieldClass, 'x-period-filter-inline__field']">
      <x-datepicker
        :model-value="current.dateEnd"
        label="Fecha al"
        @update:model-value="(v) => set('dateEnd', v)"
      />
    </div>

    <div v-if="isMonthMode" :class="[fieldClass, 'x-period-filter-inline__field x-period-filter-inline__field--month']">
      <x-datepicker-month
        :model-value="current.monthStart"
        :label="mode === 'month' ? 'Mes' : 'Mes del'"
        @update:model-value="(v) => set('monthStart', v)"
      />
    </div>
    <div v-if="mode === 'between_months'" :class="[fieldClass, 'x-period-filter-inline__field x-period-filter-inline__field--month']">
      <x-datepicker-month
        :model-value="current.monthEnd"
        label="Mes al"
        @update:model-value="(v) => set('monthEnd', v)"
      />
    </div>
  </div>
</template>

<style scoped>
/*
 * Se acomoda al ancho de SU COLUMNA, no al de la pantalla: en una columna
 * angosta de la fila de filtros (1/4 o 1/3 de la fila) los campos no caben en
 * una sola fila. Una columna ancha se ve igual que antes. El payload no cambia.
 *
 * Mínimos medidos (Outfit 14 px, campo denso de Quasar):
 *   - modo: 62 px de campo + 78 px de "Entre fechas" → 145 px;
 *   - fecha: 58 px de campo + 80 px de la fecha más ancha hasta 2040
 *     ("04/04/2040") → 140 px;
 *   - mes: 58 px + 57 px de "04/2040" → 120 px.
 * Con esto un texto nunca se corta: si un campo no cabe al lado del otro,
 * baja a la fila siguiente.
 */
.x-period-filter-inline {
  container-type: inline-size;
}

.x-period-filter-inline > .x-period-filter-inline__mode {
  min-width: 145px;
}

.x-period-filter-inline > .x-period-filter-inline__field {
  min-width: 140px;
}

.x-period-filter-inline > .x-period-filter-inline__field--month {
  min-width: 120px;
}

/*
 * Rango: si los tres campos no caben (145 + 140 + 140; con meses,
 * 145 + 120 + 120), el modo pasa a su propia fila y las dos fechas quedan
 * juntas en la de abajo, en vez de separarse.
 */
@container (max-width: 424px) {
  .x-period-filter-inline--dates > .x-period-filter-inline__mode {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

@container (max-width: 384px) {
  .x-period-filter-inline--months > .x-period-filter-inline__mode {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>
