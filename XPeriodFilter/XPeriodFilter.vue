<script setup>
/**
 * XPeriodFilter — filtro de período ÚNICO del ERP (docs/plan-dashboard-sede.md).
 *
 * Forma compacta: atajos Hoy / Esta semana / Este mes y "Personalizado"
 * (Por fecha, Entre fechas, Por semana, Por mes, Entre meses). Se aplica al
 * elegir, sin botón.
 *
 * Emite `change` con el rango resuelto:
 *   { mode, date_from, date_to, prev_from, prev_to, label }
 *
 * - La semana va de lunes a sábado (prop weekDays = 6): la semana de la
 *   clínica y de la comisión semanal.
 * - prev_from/prev_to: el MISMO tramo del período anterior. Si el rango
 *   incluye hoy, se comparan solo los días YA TERMINADOS (hoy está en curso):
 *   el miércoles, lunes y martes contra lunes y martes de la semana pasada; el
 *   23, del 1 al 22 contra del 1 al 22 del mes anterior. Si el rango ya pasó,
 *   el período anterior completo. Sin días terminados (el lunes en "Esta
 *   semana", o "Hoy") o con un rango futuro, prev_* llega null: no hay con qué
 *   comparar todavía. Quien consume debe comparar contra los mismos días.
 * - Las etiquetas van en español DENTRO del componente: no dependen del idioma
 *   del servidor ni de que cada app defina claves i18n.
 * - Las fechas se arman en hora local del navegador (sin UTC): 'YYYY-MM-DD'.
 * - Los calendarios van DENTRO del panel (v2.12.0). Antes cada fecha abría un
 *   segundo popup encima del menú: cerca del borde derecho de la pantalla no
 *   cabía, Quasar lo pegaba al borde y tapaba el propio panel.
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { PERIOD_MODE_LABELS } from './periodModes'

defineOptions({ name: 'XPeriodFilter' })

const props = defineProps({
  // Selección: { mode, dateStart, dateEnd, weekStart, monthStart, monthEnd }.
  modelValue: { type: Object, default: null },
  defaultMode: { type: String, default: 'this_week' },
  presets: { type: Array, default: () => ['today', 'this_week', 'this_month'] },
  modes: { type: Array, default: () => ['date', 'between_dates', 'week', 'month', 'between_months'] },
  // Días de la semana a partir del lunes: 6 = lunes a sábado.
  weekDays: { type: Number, default: 6 },
  // Muestra el rango resuelto debajo de los botones.
  showLabel: { type: Boolean, default: false },
  disable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])
const $q = useQuasar()

// ── Fechas (hora local) ───────────────────────────────────────────────────
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre']
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
const parseYmd = (s) => {
  const [y, m, d] = String(s).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
const today = () => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7))
const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const lastOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
// Mismo día del mes desplazado n meses, sin pasarse del último día.
const shiftMonthsSameDay = (d, n) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1)
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), lastOfMonth(target).getDate()))
}
const diffDays = (a, b) => Math.round((b - a) / 86400000)
const monthsBetween = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// ── Selección ─────────────────────────────────────────────────────────────
const t0 = today()
const selection = reactive({
  mode: props.defaultMode,
  dateStart: ymd(t0),
  dateEnd: ymd(t0),
  weekStart: ymd(mondayOf(t0)),
  monthStart: ym(t0),
  monthEnd: ym(t0),
  ...(props.modelValue || {}),
})

watch(() => props.modelValue, (v) => {
  if (v && JSON.stringify(v) !== JSON.stringify({ ...selection })) {
    Object.assign(selection, v)
  }
}, { deep: true })

const PRESET_LABELS = { today: 'Hoy', this_week: 'Esta semana', this_month: 'Este mes' }
const PRESET_SHORT = { today: 'Hoy', this_week: 'Semana', this_month: 'Mes' }

const isCustom = computed(() => !props.presets.includes(selection.mode))
const presetOptions = computed(() => props.presets.map((id) => ({
  id,
  label: $q.screen.lt.sm ? PRESET_SHORT[id] : PRESET_LABELS[id],
})))
const modeOptions = computed(() => props.modes.map((id) => ({ id, label: PERIOD_MODE_LABELS[id] })))
const customLabel = computed(() => ($q.screen.lt.sm ? 'Otro' : 'Personalizado'))
const menuOpen = ref(false)

// ── Rango resuelto ────────────────────────────────────────────────────────
function resolve(s) {
  const t = today()
  let from
  let to
  switch (s.mode) {
    case 'today':
      from = t; to = t
      break
    case 'this_week':
      from = mondayOf(t); to = addDays(from, props.weekDays - 1)
      break
    case 'this_month':
      from = firstOfMonth(t); to = lastOfMonth(t)
      break
    case 'date':
      from = parseYmd(s.dateStart); to = from
      break
    case 'week':
      from = mondayOf(parseYmd(s.weekStart)); to = addDays(from, props.weekDays - 1)
      break
    case 'month':
      from = firstOfMonth(parseYmd(`${s.monthStart}-01`)); to = lastOfMonth(from)
      break
    case 'between_months': {
      let a = firstOfMonth(parseYmd(`${s.monthStart}-01`))
      let b = firstOfMonth(parseYmd(`${s.monthEnd}-01`))
      if (b < a) [a, b] = [b, a]
      from = a; to = lastOfMonth(b)
      break
    }
    case 'between_dates':
    default: {
      let a = parseYmd(s.dateStart)
      let b = parseYmd(s.dateEnd)
      if (b < a) [a, b] = [b, a]
      from = a; to = b
    }
  }
  return { from, to }
}

// El mismo tramo del período anterior (ver cabecera). null = no hay con qué
// comparar todavía.
function previousRange(mode, from, to) {
  const t = today()
  // Un rango que todavía no empezó no tiene nada que comparar.
  if (from > t) return null
  const includesToday = t >= from && t <= to
  // Hoy está EN CURSO: se comparan solo los días ya terminados. Comparar la
  // mañana de hoy contra un día completo daría siempre una caída falsa.
  const end = includesToday ? addDays(t, -1) : to
  if (end < from) return null
  switch (mode) {
    case 'today':
    case 'date':
    case 'this_week':
    case 'week':
      return { from: addDays(from, -7), to: addDays(end, -7) }
    case 'this_month':
    case 'month':
      return {
        from: shiftMonthsSameDay(from, -1),
        to: includesToday ? shiftMonthsSameDay(end, -1) : lastOfMonth(shiftMonthsSameDay(from, -1)),
      }
    case 'between_months': {
      const n = monthsBetween(from, to) + 1
      return {
        from: shiftMonthsSameDay(from, -n),
        to: includesToday ? shiftMonthsSameDay(end, -n) : lastOfMonth(shiftMonthsSameDay(firstOfMonth(to), -n)),
      }
    }
    case 'between_dates':
    default: {
      const len = diffDays(from, to) + 1
      return { from: addDays(from, -len), to: addDays(end, -len) }
    }
  }
}

function dayText(d, withYear = false) {
  return `${DAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}${withYear ? ` de ${d.getFullYear()}` : ''}`
}

function labelFor(mode, from, to) {
  const y = today().getFullYear()
  const sameMonth = from.getFullYear() === to.getFullYear() && from.getMonth() === to.getMonth()
  const sameYear = from.getFullYear() === to.getFullYear()
  const yearTail = (d) => (d.getFullYear() !== y ? ` de ${d.getFullYear()}` : '')
  switch (mode) {
    case 'today':
      return `Hoy, ${dayText(from)}`
    case 'date':
      return cap(dayText(from, true))
    case 'this_week':
    case 'week':
      return sameMonth
        ? `Del ${DAYS[from.getDay()]} ${from.getDate()} al ${DAYS[to.getDay()]} ${to.getDate()} de ${MONTHS[to.getMonth()]}${yearTail(to)}`
        : `Del ${dayText(from)}${sameYear ? '' : yearTail(from)} al ${dayText(to)}${yearTail(to)}`
    case 'this_month':
    case 'month':
      return `${cap(MONTHS[from.getMonth()])} de ${from.getFullYear()}`
    case 'between_months':
      if (sameMonth) return `${cap(MONTHS[from.getMonth()])} de ${from.getFullYear()}`
      return sameYear
        ? `De ${MONTHS[from.getMonth()]} a ${MONTHS[to.getMonth()]} de ${to.getFullYear()}`
        : `De ${MONTHS[from.getMonth()]} de ${from.getFullYear()} a ${MONTHS[to.getMonth()]} de ${to.getFullYear()}`
    case 'between_dates':
    default:
      if (from.getTime() === to.getTime()) return cap(dayText(from, true))
      if (sameMonth) return `Del ${from.getDate()} al ${to.getDate()} de ${MONTHS[to.getMonth()]} de ${to.getFullYear()}`
      return sameYear
        ? `Del ${from.getDate()} de ${MONTHS[from.getMonth()]} al ${to.getDate()} de ${MONTHS[to.getMonth()]} de ${to.getFullYear()}`
        : `Del ${from.getDate()} de ${MONTHS[from.getMonth()]} de ${from.getFullYear()} al ${to.getDate()} de ${MONTHS[to.getMonth()]} de ${to.getFullYear()}`
  }
}

const resolved = computed(() => {
  const { from, to } = resolve(selection)
  const prev = previousRange(selection.mode, from, to)
  return {
    mode: selection.mode,
    date_from: ymd(from),
    date_to: ymd(to),
    prev_from: prev ? ymd(prev.from) : null,
    prev_to: prev ? ymd(prev.to) : null,
    label: labelFor(selection.mode, from, to),
  }
})

// Solo se emite cuando el RANGO cambia: elegir la misma semana dos veces no
// dispara otra consulta.
let lastKey = ''
function emitIfChanged() {
  const r = resolved.value
  const key = `${r.mode}|${r.date_from}|${r.date_to}`
  emit('update:modelValue', { ...selection })
  if (key !== lastKey) {
    lastKey = key
    emit('change', r)
  }
}

watch(resolved, emitIfChanged)
onMounted(emitIfChanged)

// ── Acciones ──────────────────────────────────────────────────────────────
function choosePreset(id) {
  selection.mode = id
  menuOpen.value = false
}

function chooseMode(id) {
  // Al pasar a un modo personalizado se parte del rango que se está viendo.
  const { from, to } = resolve(selection)
  if (id === 'date') selection.dateStart = ymd(from)
  if (id === 'between_dates') { selection.dateStart = ymd(from); selection.dateEnd = ymd(to) }
  if (id === 'week') selection.weekStart = ymd(mondayOf(from))
  if (id === 'month') selection.monthStart = ym(from)
  if (id === 'between_months') { selection.monthStart = ym(from); selection.monthEnd = ym(to) }
  selection.mode = id
  resetPending()
  if (id === 'month' || id === 'between_months') gridYear.value = from.getFullYear()
}

// ── Calendarios dentro del panel ──────────────────────────────────────────
// Elegir un día, una semana, un mes o completar un rango ya aplica el filtro;
// el panel se cierra para que se vea el resultado. Las flechas de semana no
// cierran (se suelen pulsar varias veces seguidas).
const rangePending = ref(false)
const monthPending = ref(null)

function resetPending() {
  rangePending.value = false
  monthPending.value = null
}

// Por fecha
function pickDate(val) {
  if (!val) return
  selection.dateStart = val
  menuOpen.value = false
}

// Entre fechas: el primer toque marca el inicio y el segundo el final. Con un
// mismo día dos veces, QDate devuelve la fecha sola (no un objeto).
const rangeModel = computed(() => (selection.dateStart === selection.dateEnd
  ? selection.dateStart
  : { from: selection.dateStart, to: selection.dateEnd }))

function pickRange(val) {
  rangePending.value = false
  if (!val) return
  if (typeof val === 'string') {
    selection.dateStart = val
    selection.dateEnd = val
  } else {
    let a = val.from
    let b = val.to
    if (b < a) [a, b] = [b, a]
    selection.dateStart = a
    selection.dateEnd = b
  }
  menuOpen.value = false
}

// Por semana: tocar cualquier día elige su semana (de lunes a sábado). El lunes
// va AL FINAL de la lista: QDate se ubica en el mes del último día del modelo
// (al abrir y cada vez que cambia), así una semana que cruza de mes (27 oct –
// 1 nov) se ve desde su lunes, también al moverse con las flechas.
const weekDates = computed(() => {
  const from = mondayOf(parseYmd(selection.weekStart))
  return Array.from({ length: props.weekDays }, (_, i) => ymd(addDays(from, props.weekDays - 1 - i)))
})

function pickWeek(_val, _reason, details) {
  if (!details?.year) return
  selection.weekStart = ymd(mondayOf(new Date(details.year, details.month - 1, details.day)))
  menuOpen.value = false
}

function shiftWeek(n) {
  selection.weekStart = ymd(addDays(mondayOf(parseYmd(selection.weekStart)), 7 * n))
}

const weekLabel = computed(() => {
  const from = mondayOf(parseYmd(selection.weekStart))
  return labelFor('week', from, addDays(from, props.weekDays - 1))
})

// Por mes / Entre meses: cuadrícula de 12 meses con el año arriba.
const gridYear = ref(t0.getFullYear())
const currentMonth = ym(t0)
const monthCells = computed(() => MONTHS_SHORT.map((label, i) => {
  const key = `${gridYear.value}-${pad(i + 1)}`
  return { key, label, name: `${MONTHS[i]} de ${gridYear.value}`, state: monthState(key) }
}))

function monthState(key) {
  if (selection.mode === 'month') return key === selection.monthStart ? 'selected' : ''
  if (monthPending.value) return key === monthPending.value ? 'selected' : ''
  let a = selection.monthStart
  let b = selection.monthEnd
  if (b < a) [a, b] = [b, a]
  if (key === a || key === b) return 'selected'
  return key > a && key < b ? 'in-range' : ''
}

function pickMonth(key) {
  if (selection.mode === 'month') {
    selection.monthStart = key
    menuOpen.value = false
    return
  }
  if (!monthPending.value) {
    monthPending.value = key
    return
  }
  let a = monthPending.value
  let b = key
  if (b < a) [a, b] = [b, a]
  selection.monthStart = a
  selection.monthEnd = b
  monthPending.value = null
  menuOpen.value = false
}

const rangeHint = computed(() => {
  if (selection.mode === 'between_dates') {
    return rangePending.value ? 'Ahora toca la fecha final.' : 'Toca la fecha inicial y luego la final.'
  }
  if (selection.mode === 'between_months') {
    return monthPending.value ? 'Ahora toca el mes final.' : 'Toca el mes inicial y luego el final.'
  }
  return ''
})
</script>

<template>
  <div class="x-period-filter" :class="{ 'x-period-filter--mobile': $q.screen.lt.sm }">
    <div class="x-period-filter__group" role="group" aria-label="Período">
      <q-btn
        v-for="p in presetOptions"
        :key="p.id"
        no-caps
        unelevated
        class="x-period-filter__btn"
        :class="{ 'is-active': selection.mode === p.id }"
        :aria-pressed="selection.mode === p.id ? 'true' : 'false'"
        :label="p.label"
        :disable="disable"
        @click="choosePreset(p.id)"
      />
      <q-btn
        v-if="modes.length"
        no-caps
        unelevated
        class="x-period-filter__btn"
        :class="{ 'is-active': isCustom }"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        :label="customLabel"
        icon-right="fa-light fa-chevron-down"
        :disable="disable"
      >
        <!-- max-height: el tope por defecto de QMenu (65vh) dejaba la vista
             previa y "Listo" fuera de la vista en el teléfono. -->
        <q-menu
          v-model="menuOpen"
          anchor="bottom right"
          self="top right"
          :offset="[0, 6]"
          max-height="90vh"
          class="x-period-filter__menu"
          @hide="resetPending"
        >
          <div class="x-period-filter__panel" :class="{ 'x-period-filter__panel--mobile': $q.screen.lt.sm }">
            <div class="x-period-filter__modes">
              <div v-if="!$q.screen.lt.sm" class="x-period-filter__panel-title">Elegir por</div>
              <div class="x-period-filter__mode-list">
                <q-btn
                  v-for="m in modeOptions"
                  :key="m.id"
                  no-caps
                  flat
                  align="left"
                  class="x-period-filter__mode"
                  :class="{ 'is-active': selection.mode === m.id }"
                  :aria-pressed="selection.mode === m.id ? 'true' : 'false'"
                  :label="m.label"
                  @click="chooseMode(m.id)"
                />
              </div>
            </div>

            <div class="x-period-filter__fields">
              <div v-if="!isCustom" class="x-period-filter__hint">
                Elige cómo quieres filtrar.
              </div>

              <q-date
                v-else-if="selection.mode === 'date'"
                :model-value="selection.dateStart"
                mask="YYYY-MM-DD"
                :first-day-of-week="1"
                minimal
                flat
                no-unset
                class="x-period-filter__calendar"
                @update:model-value="pickDate"
              />

              <template v-else-if="selection.mode === 'between_dates'">
                <q-date
                  :model-value="rangeModel"
                  mask="YYYY-MM-DD"
                  :first-day-of-week="1"
                  range
                  minimal
                  flat
                  class="x-period-filter__calendar"
                  @range-start="rangePending = true"
                  @update:model-value="pickRange"
                />
                <div class="x-period-filter__hint">{{ rangeHint }}</div>
              </template>

              <template v-else-if="selection.mode === 'week'">
                <div class="x-period-filter__week">
                  <q-btn flat round dense icon="fa-light fa-chevron-left" aria-label="Semana anterior" @click="shiftWeek(-1)" />
                  <div class="x-period-filter__week-label">{{ weekLabel }}</div>
                  <q-btn flat round dense icon="fa-light fa-chevron-right" aria-label="Semana siguiente" @click="shiftWeek(1)" />
                </div>
                <q-date
                  :model-value="weekDates"
                  mask="YYYY-MM-DD"
                  :first-day-of-week="1"
                  multiple
                  minimal
                  flat
                  class="x-period-filter__calendar"
                  @update:model-value="pickWeek"
                />
              </template>

              <template v-else-if="selection.mode === 'month' || selection.mode === 'between_months'">
                <div class="x-period-filter__months">
                  <div class="x-period-filter__year">
                    <q-btn flat round dense icon="fa-light fa-chevron-left" aria-label="Año anterior" @click="gridYear--" />
                    <div class="x-period-filter__year-label">{{ gridYear }}</div>
                    <q-btn flat round dense icon="fa-light fa-chevron-right" aria-label="Año siguiente" @click="gridYear++" />
                  </div>
                  <div class="x-period-filter__month-grid">
                    <button
                      v-for="c in monthCells"
                      :key="c.key"
                      type="button"
                      class="x-period-filter__month"
                      :class="[c.state && `is-${c.state}`, { 'is-current': c.key === currentMonth }]"
                      :aria-label="c.name"
                      :aria-pressed="c.state === 'selected' ? 'true' : 'false'"
                      @click="pickMonth(c.key)"
                    >{{ c.label }}</button>
                  </div>
                </div>
                <div v-if="rangeHint" class="x-period-filter__hint">{{ rangeHint }}</div>
              </template>

              <div class="x-period-filter__preview" aria-live="polite">
                <div class="column">
                  <span class="x-period-filter__preview-caption">Se mostrará</span>
                  <span class="x-period-filter__preview-label">{{ resolved.label }}</span>
                </div>
                <q-btn flat no-caps dense color="primary" label="Listo" class="x-period-filter__done" @click="menuOpen = false" />
              </div>
            </div>
          </div>
        </q-menu>
      </q-btn>
    </div>

    <div v-if="showLabel" class="x-period-filter__label">{{ resolved.label }}</div>
  </div>
</template>

<style lang="scss" scoped>
.x-period-filter {
  display: inline-flex;
  flex-direction: column;
  gap: 6px;
  max-width: 100%;
}

.x-period-filter__group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid rgba(0, 0, 0, .12);
  border-radius: 10px;
  background: #fff;
}

.x-period-filter__btn {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  background: transparent;

  &.is-active {
    background: var(--q-primary);
    color: #fff;
    font-weight: 600;
  }
}

// En el teléfono los cuatro botones reparten el ancho completo.
.x-period-filter--mobile {
  display: flex;
  width: 100%;

  .x-period-filter__group {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    width: 100%;
  }

  .x-period-filter__btn {
    min-height: 40px;
    padding: 0 6px;
  }
}

.x-period-filter__label {
  font-size: 13px;
  color: #64748b;
}

.x-period-filter__panel {
  display: grid;
  // 170 de modos + un calendario de 290 (el ancho fijo de QDate) + aire.
  grid-template-columns: 170px minmax(0, 1fr);
  gap: 16px;
  padding: 14px;
  width: 520px;
  max-width: 92vw;

  &--mobile {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    width: 340px;
  }
}

.x-period-filter__panel-title {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  padding: 0 4px 6px;
}

.x-period-filter__modes {
  padding-right: 14px;
  border-right: 1px solid rgba(0, 0, 0, .08);

  .x-period-filter__panel--mobile & {
    padding-right: 0;
    padding-bottom: 10px;
    border-right: 0;
    border-bottom: 1px solid rgba(0, 0, 0, .08);
  }
}

.x-period-filter__mode-list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  // En el teléfono los modos van en dos columnas: el calendario necesita el alto.
  .x-period-filter__panel--mobile & {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.x-period-filter__mode {
  min-height: 36px;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;

  .x-period-filter__panel--mobile & { min-height: 32px; }

  &.is-active {
    background: rgba(26, 86, 219, .1);
    color: var(--q-primary);
    font-weight: 600;
  }
}

.x-period-filter__fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.x-period-filter__hint {
  font-size: 13px;
  color: #64748b;
  padding-top: 4px;
}

.x-period-filter__week {
  display: flex;
  align-items: center;
  gap: 6px;
}

.x-period-filter__week-label {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.x-period-filter__calendar {
  align-self: center;
}

.x-period-filter__months {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.x-period-filter__year {
  display: flex;
  align-items: center;
  gap: 6px;
}

.x-period-filter__year-label {
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.x-period-filter__month-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.x-period-filter__month {
  min-height: 40px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: #334155;
  text-transform: capitalize;
  cursor: pointer;

  &:hover { background: #f1f5f9; }
  &:focus-visible { outline: 2px solid var(--q-primary); outline-offset: 1px; }

  &.is-current { border-color: #cbd5e1; }

  &.is-in-range {
    background: rgba(26, 86, 219, .1);
    color: var(--q-primary);
  }

  &.is-selected {
    background: var(--q-primary);
    border-color: var(--q-primary);
    color: #fff;
    font-weight: 600;
  }
}

.x-period-filter__preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, .08);
}

.x-period-filter__done {
  flex-shrink: 0;
  font-weight: 600;
}

.x-period-filter__preview-caption {
  font-size: 12px;
  color: #64748b;
}

.x-period-filter__preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
</style>
