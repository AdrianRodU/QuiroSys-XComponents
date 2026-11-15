<script setup>
import { computed, ref, useSlots, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useQuasar, QTh } from 'quasar'
import XLoading from '../XLoading/XLoading.vue'
import XInput from '../XInput/XInput.vue'
import XHelpTip from '../XHelpTip/XHelpTip.vue'
import XMobileMenuAction from '../XTableServer/XMobileMenuAction.vue'
import MobileLinkTitle from '../Mobile/MobileLinkTitle.vue'

defineOptions({
  name: 'XTable',
  inheritAttrs: false,
})

const props = defineProps({
  /** Filas a renderizar */
  rows: {
    type: Array,
    default: () => [],
  },
  /** Definicion de columnas (formato q-table: { name, label, field, align, sortable }) */
  columns: {
    type: Array,
    default: () => [],
  },
  /** Titulo opcional en el header del card */
  title: {
    type: String,
    default: '',
  },
  /** Loading overlay */
  loading: {
    type: Boolean,
    default: false,
  },
  /** Activa input de busqueda local */
  searchable: {
    type: Boolean,
    default: false,
  },
  /** Placeholder del input de busqueda */
  searchLabel: {
    type: String,
    default: 'Buscar',
  },
  /** Activa paginacion local */
  paginated: {
    type: Boolean,
    default: false,
  },
  /** Filas por pagina (cuando paginated=true) */
  rowsPerPage: {
    type: Number,
    default: 10,
  },
  /** Opciones de tamano de pagina */
  rowsPerPageOptions: {
    type: Array,
    default: () => [10, 25, 50, 100, 0],
  },
  /** Densidad compacta */
  dense: {
    type: Boolean,
    default: true,
  },
  /** Sin contenedor card (q-table plano) */
  flat: {
    type: Boolean,
    default: false,
  },
  /** Mensaje cuando no hay datos */
  noDataLabel: {
    type: String,
    default: 'No hay registros',
  },
  /** Subtitulo del empty-state */
  noDataSubtitle: {
    type: String,
    default: '',
  },
  /** Icono del empty-state */
  noDataIcon: {
    type: String,
    default: 'fa-light fa-inbox',
  },
  /** row-key para q-table (default 'id') */
  rowKey: {
    type: String,
    default: 'id',
  },
  /**
   * Configuracion de layout mobile (similar a XTableServer).
   * { leftWidth, primaryFields, titleField, subtitleField }
   * Si no se pasa, auto-generado desde las primeras columnas visibles.
   */
  mobileConfig: {
    type: Object,
    default: null,
  },
  /**
   * Sin separadores entre filas y sin border-bottom en celdas.
   * Util para tablas embedded compactas o mini-listas tipo "data display".
   */
  noBorder: {
    type: Boolean,
    default: false,
  },
  /**
   * Funcion que devuelve clases CSS para una fila (row, index) => string|object|array.
   * Util para marcar filas seleccionadas con bg-color, etc.
   * Ejemplo:
   *   :row-class="(row) => selectedId === row.id ? 'x-table-row--selected' : ''"
   */
  rowClass: {
    type: [Function, String],
    default: null,
  },
  /**
   * Grupos de columnas (v2.35.0): una fila arriba de la cabecera con el nombre de cada grupo sobre sus columnas.
   * [{ label: 'R2 / RV2', columns: ['r2_closes', 'r2_rate', 'r2_amount'], help: 'Qué cuenta el grupo' }]
   * Las columnas de un grupo van seguidas; las que no están en ningún grupo ocupan las dos filas de la cabecera.
   * Las columnas también aceptan `sticky: 'left' | 'right'` (fija al desplazar en horizontal) y `help` ("?" en la cabecera).
   */
  headerGroups: {
    type: Array,
    default: () => [],
  },
  /**
   * Fila de total al pie (v2.35.0): un valor por nombre de columna, { name: 'Total por persona', total: '3,017.06' }.
   * Cada celda admite el slot `summary-cell-{name}`; en las tarjetas, el slot `mobile-summary`.
   */
  summary: {
    type: Object,
    default: null,
  },
  /**
   * Desde qué ancho de Quasar pasa a tarjetas (v2.35.0): 'sm' | 'md' | 'lg' | 'xl'. Vacío = como siempre: tarjetas en un
   * celular o una tablet y bajo 1440 px ('lg'). Con un valor, manda solo el ancho: una tablet horizontal o una laptop de
   * 1366 px ven la tabla (con columnas fijas si las hay). Para tablas de informe con muchas columnas: 'md'.
   */
  mobileBelow: {
    type: String,
    default: '',
    validator: (v) => ['', 'sm', 'md', 'lg', 'xl'].includes(v),
  },
  /** Celdas compactas (7 × 10 px, 13 px) y números de ancho fijo: tablas de informe con muchas columnas (v2.35.0). */
  compact: {
    type: Boolean,
    default: false,
  },
})

// Helper para resolver la clase de fila
function getRowClass(row, index) {
  if (typeof props.rowClass === 'function') return props.rowClass(row, index)
  return props.rowClass || ''
}

const emit = defineEmits(['row-click', 'update:search'])
const slots = useSlots()
const $q = useQuasar()
const instance = getCurrentInstance()

// Detecta si el padre tiene @row-click registrado (presente en vnode.props)
const hasRowClickListener = computed(() => !!instance?.vnode.props?.onRowClick)

// --- Mobile detection ---
// Sin `mobileBelow`, como siempre (celular o tablet, o bajo 1440 px); con `mobileBelow`, solo el ancho.
const isMobileView = computed(() => (props.mobileBelow ? $q.screen.lt[props.mobileBelow] : $q.platform.is.mobile || $q.screen.lt.lg))

// --- Cabecera con grupos, columnas fijas y ayuda (v2.35.0) ---
const groupOf = computed(() => {
  const map = {}
  for (const g of props.headerGroups) for (const name of g.columns || []) map[name] = g
  return map
})
// La primera columna de cada grupo lleva la línea que lo separa del anterior.
const groupStart = computed(() => new Set(props.headerGroups.map((g) => (g.columns || [])[0]).filter(Boolean)))
// La cabecera propia solo cuando hace falta; si no, la de q-table de siempre (ordenar, etc.).
const useCustomHeader = computed(
  () => !isMobileView.value && (props.headerGroups.length > 0 || props.columns.some((c) => c.sticky || c.help)),
)
// Fila de arriba: los grupos (colspan) y las columnas sueltas (rowspan 2), en el orden de las columnas visibles. La key
// de una columna suelta es su nombre: q-th la usa para encontrar la columna.
function headerTop(cols) {
  const out = []
  for (let i = 0; i < cols.length; i++) {
    const g = groupOf.value[cols[i].name]
    if (!g) {
      out.push({ key: cols[i].name, col: cols[i] })
      continue
    }
    let span = 1
    while (i + span < cols.length && groupOf.value[cols[i + span].name] === g) span++
    out.push({ key: `group-${cols[i].name}`, group: g, span, first: cols[i].name })
    i += span - 1
  }
  return out
}
function cellClass(col) {
  return {
    'x-table__sticky': !!col.sticky,
    'x-table__sticky--left': col.sticky === 'left',
    'x-table__sticky--right': col.sticky === 'right',
    'x-table__group-start': groupStart.value.has(col.name),
  }
}
// Clic en fila en escritorio: con el slot `body` propio, q-table no emite row-click, así que lo emite la fila (también
// con Enter, para el teclado). Solo si el padre escucha @row-click.
function onDesktopRowClick(evt, row, idx) {
  if (hasRowClickListener.value) emit('row-click', { row, idx, evt })
}

// --- First load tracking ---
// Evita el "flash" del empty-state mientras los datos vienen async. Solo
// renderizamos <q-table> cuando initialLoadDone === true.
//
// Casos cubiertos:
//   A) Datos sync (rows ya tiene items al mount)  -> true inmediato
//   B) Fetch async con loading explicito          -> true cuando loading
//                                                    pasa de true -> false
//   C) Patron UserPlan: el padre arranca con rows=[] y loading=false, pero
//      en el mismo tick llama getData() que pone loading=true.
//      -> grace period de 50ms; si en ese tiempo no se ve actividad
//         (fetch async no se inicio), asumimos tabla legitimamente vacia
//         y mostramos. Si SI se inicia un fetch (loading=true), el watch
//         cancela el timeout y esperamos a que termine.
const initialLoadDone = ref(props.rows.length > 0)
let initTimeoutId = null

onMounted(() => {
  if (initialLoadDone.value) return     // datos sync, listo
  if (props.loading) return              // loading explicito, esperar
  // Grace period: si en 50ms nadie inicia un fetch, asumimos vacio legitimo
  initTimeoutId = setTimeout(() => {
    initialLoadDone.value = true
    initTimeoutId = null
  }, 50)
})

watch(() => props.loading, (newVal, oldVal) => {
  if (newVal === true && initTimeoutId) {
    // Detectamos fetch async iniciado dentro del grace period: cancelar
    clearTimeout(initTimeoutId)
    initTimeoutId = null
  }
  if (oldVal === true && newVal === false) {
    initialLoadDone.value = true
  }
})

watch(() => props.rows, (newRows) => {
  if (Array.isArray(newRows) && newRows.length > 0) {
    if (initTimeoutId) {
      clearTimeout(initTimeoutId)
      initTimeoutId = null
    }
    initialLoadDone.value = true
  }
})

onUnmounted(() => {
  if (initTimeoutId) clearTimeout(initTimeoutId)
})

// --- Busqueda local ---
const search = ref('')

// --- Pagination ---
const pagination = ref({
  rowsPerPage: props.paginated ? props.rowsPerPage : 0,
})

// --- Filas filtradas por search ---
const filteredRows = computed(() => {
  if (!props.searchable || !search.value) return props.rows
  const q = String(search.value).toLowerCase()
  return props.rows.filter(row =>
    props.columns.some(col => {
      const val = row[col.field || col.name]
      return val != null && String(val).toLowerCase().includes(q)
    })
  )
})

// --- Mobile config (con fallback auto) ---
const mobileConfigResolved = computed(() => {
  if (props.mobileConfig) return props.mobileConfig
  // Fallback: primeras 2 cols a la izquierda, siguientes 2 a la derecha (excluye actions)
  const visibleCols = props.columns.filter(c => c.name !== 'actions')
  const leftFields = visibleCols.slice(0, 2).map(c => ({
    field: c.field || c.name,
    label: c.label,
    position: 'left',
    align: 'left',
  }))
  const rightFields = visibleCols.slice(2, 4).map(c => ({
    field: c.field || c.name,
    label: c.label,
    position: 'right',
    align: 'right',
  }))
  return {
    leftWidth: '60%',
    primaryFields: [...leftFields, ...rightFields],
    titleField: visibleCols[0]?.field || visibleCols[0]?.name || null,
    subtitleField: visibleCols[1]?.field || visibleCols[1]?.name || null,
  }
})

const mobileLeftFields = computed(
  () => mobileConfigResolved.value.primaryFields?.filter(f => f.position === 'left') || []
)
const mobileRightFields = computed(
  () => mobileConfigResolved.value.primaryFields?.filter(f => f.position === 'right') || []
)
const mobileLeftWidth = computed(() => mobileConfigResolved.value.leftWidth || '60%')

function getMobileFieldValue(row, field) {
  return row?.[field.field] ?? ''
}
function getDisplayText(row, fieldName) {
  if (!row || !fieldName) return ''
  return row[fieldName] ?? ''
}

// --- Mobile bottom sheet ---
const showMobileActions = ref(false)
const selectedRow = ref(null)

function openMobileActions(row) {
  selectedRow.value = row
  showMobileActions.value = true
}
function closeMobileActions() {
  showMobileActions.value = false
}

/**
 * Click en una fila mobile: si hay slot mobile-actions abre bottom sheet;
 * si NO hay, emite row-click directo (sin menu intermedio).
 */
function onMobileRowClick(evt, row, idx) {
  if (hasMobileActionsSlot.value) {
    openMobileActions(row)
  } else {
    emit('row-click', { row, idx, evt })
  }
}

// --- Slots ---
const hasHeaderSlot = computed(() => !!slots.header || !!slots['header-buttons'] || !!props.title || props.searchable)
const hasMobileActionsSlot = computed(() => !!slots['mobile-actions'])

/**
 * La fila mobile es interactiva si hay slot de acciones O hay listener @row-click.
 * Si no, las filas son read-only (no cursor, sin click handler).
 */
const isRowInteractive = computed(() => hasMobileActionsSlot.value || hasRowClickListener.value)

// --- Helpers ---
function clearSearch() {
  search.value = ''
  emit('update:search', '')
}
function onSearchUpdate(val) {
  search.value = val
  emit('update:search', val)
}

defineExpose({ clearSearch, closeMobileActions })
</script>

<template>
  <q-card class="x-table" :class="{ 'x-table--no-border': noBorder, 'x-table--compact': compact }" :flat="flat">
    <!-- Header opcional (title + search + buttons) -->
    <q-card-section v-if="hasHeaderSlot" class="x-table__header q-py-sm">
      <div class="x-table__header-content">
        <div v-if="title" class="x-table__title">{{ title }}</div>
        <slot name="header" />
      </div>
      <div class="x-table__header-actions">
        <x-input
          v-if="searchable"
          :model-value="search"
          :label="searchLabel"
          debounce="300"
          dense
          class="x-table__search"
          @update:model-value="onSearchUpdate"
        />
        <slot name="header-buttons" />
      </div>
    </q-card-section>

    <q-table
      v-if="initialLoadDone"
      v-bind="$attrs"
      :rows="filteredRows"
      :columns="columns"
      :row-key="rowKey"
      :dense="dense"
      :flat="true"
      :loading="loading"
      :separator="noBorder ? 'none' : 'horizontal'"
      v-model:pagination="pagination"
      :rows-per-page-options="paginated ? rowsPerPageOptions : []"
      :hide-pagination="!paginated || filteredRows.length === 0"
      :hide-header="isMobileView"
      @row-click="(evt, row, idx) => emit('row-click', { row, idx, evt })"
    >
      <!-- Cabecera propia (v2.35.0), solo con grupos, columnas fijas o ayuda: arriba los grupos y las columnas sueltas
           (rowspan 2), abajo las columnas de cada grupo. q-th con :props conserva el orden por columna. -->
      <template v-if="useCustomHeader" v-slot:header="hp">
        <q-tr>
          <!-- Un solo v-for sobre <component>: q-th busca su columna por la key del vnode (que debe ser el nombre de la
               columna) y dentro de un v-if Vue le pondría key 0, con lo que q-th no dibujaba nada. -->
          <component
            :is="cell.col ? QTh : 'th'"
            v-for="cell in headerTop(hp.cols)"
            :key="cell.key"
            v-bind="cell.col ? { props: hp, rowspan: headerGroups.length ? 2 : 1 } : { colspan: cell.span }"
            :class="cell.col ? cellClass(cell.col) : ['x-table__group', { 'x-table__group-start': groupStart.has(cell.first) }]"
          >
            <template v-if="cell.col">
              {{ cell.col.label }}<x-help-tip v-if="cell.col.help" :text="cell.col.help" class="q-ml-xs" />
            </template>
            <template v-else>
              {{ cell.group.label }}<x-help-tip v-if="cell.group.help" :text="cell.group.help" class="q-ml-xs" />
            </template>
          </component>
        </q-tr>
        <q-tr v-if="headerGroups.length">
          <q-th v-for="col in hp.cols.filter((c) => groupOf[c.name])" :key="col.name" :props="hp" :class="cellClass(col)">
            {{ col.label }}<x-help-tip v-if="col.help" :text="col.help" class="q-ml-xs" />
          </q-th>
        </q-tr>
      </template>

      <!-- DESKTOP: render de fila completa para poder aplicar rowClass al <q-tr>.
           Despacha body-cell-{name} dinamicamente para cada columna. -->
      <template v-if="!isMobileView" v-slot:body="props">
        <q-tr
          :props="props"
          :class="[getRowClass(props.row, props.rowIndex), { 'x-table__row--clickable': hasRowClickListener }]"
          :tabindex="hasRowClickListener ? 0 : undefined"
          @click="onDesktopRowClick($event, props.row, props.rowIndex)"
          @keydown.enter="onDesktopRowClick($event, props.row, props.rowIndex)"
        >
          <q-td v-for="col in props.cols" :key="col.name" :props="props" :class="cellClass(col)">
            <slot
              :name="`body-cell-${col.name}`"
              v-bind="props"
              :row="props.row"
              :value="props.row[col.field || col.name]"
              :col="col"
            >
              {{ props.row[col.field || col.name] }}
            </slot>
          </q-td>
        </q-tr>
      </template>

      <!-- MOBILE: render custom de fila como card 2-cols + kebab (si hay actions) -->
      <template v-else v-slot:body="props">
        <q-tr
          :class="[
            getRowClass(props.row, props.rowIndex),
            isRowInteractive ? 'cursor-pointer' : ''
          ]"
          :props="props"
          @click="isRowInteractive ? onMobileRowClick($event, props.row, props.rowIndex) : null"
        >
          <q-td colspan="100%" class="q-py-sm">
            <!-- `mobile-row` (v2.35.0): la tarjeta entera a mano (varias líneas, chips); sin él, izquierda / derecha. -->
            <slot name="mobile-row" :row="props.row" :index="props.rowIndex">
            <div class="x-table-mobile-row__content">
              <!-- Columna izquierda -->
              <div class="x-table-mobile-row__left" :style="{ flexBasis: mobileLeftWidth }">
                <template v-for="(field, idx) in mobileLeftFields" :key="idx">
                  <div class="ellipsis" :class="`text-${field.align || 'left'}`">
                    <slot
                      :name="`body-cell-${field.field}`"
                      :row="props.row"
                      :value="getMobileFieldValue(props.row, field)"
                      :col="{ name: field.field, field: field.field, label: field.label }"
                    >
                      {{ getMobileFieldValue(props.row, field) }}
                    </slot>
                  </div>
                </template>
              </div>
              <!-- Columna derecha -->
              <div class="x-table-mobile-row__right">
                <template v-for="(field, idx) in mobileRightFields" :key="idx">
                  <div class="ellipsis" :class="`text-${field.align || 'right'}`">
                    <slot
                      :name="`body-cell-${field.field}`"
                      :row="props.row"
                      :value="getMobileFieldValue(props.row, field)"
                      :col="{ name: field.field, field: field.field, label: field.label }"
                    >
                      {{ getMobileFieldValue(props.row, field) }}
                    </slot>
                  </div>
                </template>
              </div>
              <!-- Icono action: kebab si hay menu, chevron si solo click -->
              <div v-if="hasMobileActionsSlot" class="x-table-mobile-row__action">
                <q-icon size="1.25em" name="fa-light fa-ellipsis-vertical" color="grey-7" />
              </div>
            </div>
            </slot>
          </q-td>
        </q-tr>
      </template>

      <!-- Filas antes del cuerpo (v2.35.0), p. ej. datos del grupo que aplican a todas las columnas. -->
      <template v-if="slots['top-row']" v-slot:top-row="tp">
        <slot name="top-row" v-bind="tp" :mobile="isMobileView" :cell-class="cellClass" />
      </template>

      <!-- Al pie (v2.35.0): filas propias (`bottom-row`) y la fila de total (`summary`). -->
      <template v-if="summary || slots['bottom-row']" v-slot:bottom-row="bp">
        <slot name="bottom-row" v-bind="bp" :mobile="isMobileView" :cell-class="cellClass" />
        <template v-if="summary">
          <q-tr v-if="!isMobileView" class="x-table__summary">
            <q-td v-for="col in bp.cols" :key="col.name" :class="[cellClass(col), `text-${col.align || 'left'}`]">
              <slot :name="`summary-cell-${col.name}`" :value="summary[col.name]" :col="col" :summary="summary">
                {{ summary[col.name] ?? '' }}
              </slot>
            </q-td>
          </q-tr>
          <q-tr v-else class="x-table__summary">
            <q-td colspan="100%" class="q-py-sm">
              <slot name="mobile-summary" :summary="summary">
                <div class="x-table-mobile-row__content">
                  <div class="x-table-mobile-row__left" :style="{ flexBasis: mobileLeftWidth }">
                    <div class="ellipsis">{{ summary[mobileLeftFields[0]?.field] ?? '' }}</div>
                  </div>
                  <div class="x-table-mobile-row__right">
                    <div class="ellipsis text-right">{{ summary[mobileRightFields[0]?.field] ?? '' }}</div>
                  </div>
                </div>
              </slot>
            </q-td>
          </q-tr>
        </template>
      </template>

      <!-- Empty state -->
      <template v-slot:no-data>
        <div class="x-table-empty-state">
          <slot name="no-data">
            <q-icon :name="noDataIcon" size="48px" class="x-table-empty-state__icon" />
            <div class="x-table-empty-state__title">{{ noDataLabel }}</div>
            <div v-if="noDataSubtitle" class="x-table-empty-state__subtitle">{{ noDataSubtitle }}</div>
          </slot>
        </div>
      </template>
    </q-table>

    <!-- Mobile bottom sheet con acciones (slot mobile-actions del padre) -->
    <x-mobile-menu-action v-if="isMobileView && hasMobileActionsSlot" v-model="showMobileActions">
      <mobile-link-title
        :text-left="getDisplayText(selectedRow, mobileConfigResolved.titleField)"
        :text-right="getDisplayText(selectedRow, mobileConfigResolved.subtitleField)"
      />
      <slot name="mobile-actions" :row="selectedRow" :close="closeMobileActions" />
    </x-mobile-menu-action>

    <!-- Loading overlay -->
    <x-loading :loading="loading" />
  </q-card>
</template>
