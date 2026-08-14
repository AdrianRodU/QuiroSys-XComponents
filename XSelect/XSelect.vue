<script setup>
import { computed, getCurrentInstance, ref, useAttrs, nextTick } from 'vue';
import { formDefaults } from '@esolutions/js-utils'
import XHelpTip from '../XHelpTip/XHelpTip.vue'

defineOptions({
  name: 'XSelect',
  inheritAttrs: false,
});

const emit = defineEmits(['update:modelValue', 'click-new', 'select', 'error']);

const { proxy } = getCurrentInstance();
const attrs = useAttrs();

// Excluir onFilter del spread para evitar que Vue lo fusione en array
// con el @filter interno del q-select cuando el padre pasa @filter.
const cleanAttrs = computed(() => {
  const { onFilter: _ext, ...rest } = attrs;
  return rest;
});
const externalFilter = computed(() => (typeof attrs.onFilter === 'function' ? attrs.onFilter : null));

const selectRef = ref(null);
const remoteOptions = ref([]);
const localFilteredOptions = ref(null);

// cache de última búsqueda remota
const lastSearch = ref({ query: '', results: [] });

// Expose helpers
defineExpose({
  focus: () => selectRef.value?.focus?.(),
  showPopup: () => selectRef.value?.showPopup?.(),
  hidePopup: () => selectRef.value?.hidePopup?.(),
  clearInput: () => selectRef.value?.updateInputValue?.(''),
  reset: () => {
    selectRef.value?.updateInputValue?.('');
    selectRef.value?.hidePopup?.();
  },
  /**
   * Inyecta una opción en remoteOptions para que el select
   * pueda mostrar su label aunque no haya búsqueda activa.
   * Útil al crear un registro nuevo y pre-seleccionarlo.
   */
  injectOption: (opt) => {
    const already = remoteOptions.value.find(o => o[props.optionValue] === opt[props.optionValue]);
    if (!already) {
      remoteOptions.value = [opt, ...remoteOptions.value];
    }
  },
});

// Props
const props = defineProps({
  includeAllOption: Boolean,
  isClassic: { type: Boolean, default: formDefaults.isClassic },
  dense: { type: Boolean, default: formDefaults.dense },
  error: { type: String, default: null },
  optionValue: { type: String, default: 'id' },
  optionLabel: { type: String, default: 'name' },
  remoteUrl: { type: String, default: null },
  filters: { type: Object, default: () => ({}) },
  filterLocal: Boolean,
  showAddNewOption: Boolean,
  addNewLabel: { type: String, default: 'Agregar nuevo' },
  addNewIcon: { type: String, default: 'add_circle_outline' },
  addNewClass: { type: String, default: 'text-primary' },
  showAddButton: Boolean,
  minChars: { type: Number, default: 2 },
  enforceMinChars: { type: Boolean, default: true },
  innerThrottleMs: { type: Number, default: 0 },
  clearAfterSelect: { type: Boolean, default: false },
  preserveResults: { type: Boolean, default: false },
  keepInputAfterSelect: { type: Boolean, default: false },
  // Forzar blur al seleccionar (para que otro input tome el foco)
  blurOnSelect: { type: Boolean, default: true },
  // Cerrar popup al perder foco (por tab, click afuera, etc.)
  closeOnBlur: { type: Boolean, default: true },
  truncateLabel: { type: Boolean, default: false },
  truncateWidth: { type: [String, Number], default: null },
  /** Texto de ayuda: muestra un ícono "?" con tooltip junto al label. */
  help: { type: String, default: '' },
  /** Fondo del control (nombre de color Quasar/CSS). 'white' por defecto:
   *  invisible sobre fondos blancos (la mayoría de la app), pero evita que
   *  el input "transparente" se mimetice al usarlo sobre un card/banner de
   *  color. Pasar '' o 'transparent' para el comportamiento clásico. */
  bgColor: { type: String, default: 'white' },
});

const fallbackId = `app-select-${Math.random().toString(36).substring(2, 9)}`;
const elementId = computed(() => (attrs.id ? `app-select-${attrs.id}` : fallbackId));
const elementLabel = computed(() => (props.isClassic ? attrs.label : undefined));
const label = computed(() => (props.isClassic ? null : attrs.label));
const popupContentClass = computed(() => {
  const base = 'app-inner-list app-select__content v-select__content';
  return attrs.multiple !== undefined ? `${base} v-list-select-multiple` : base;
});

const truncateStyle = computed(() => {
  if (!props.truncateLabel || !props.truncateWidth) return {}
  const w = typeof props.truncateWidth === 'number' ? `${props.truncateWidth}px` : props.truncateWidth
  return { maxWidth: w }
})

const ADD_NEW_OPTION = computed(() => ({
  label: props.addNewLabel,
  value: '__add_new__',
  icon: props.addNewIcon,
  class: props.addNewClass
}));

const computedOptions = computed(() => {
  let options = [];
  if (props.remoteUrl) {
    options = remoteOptions.value.map(opt => ({
      ...opt,
      value: opt[props.optionValue],
      label: opt[props.optionLabel],
    }));
  } else {
    const fromAttrs = attrs.options || [];
    options = fromAttrs.map(opt => ({
      ...opt,
      value: opt[props.optionValue],
      label: opt[props.optionLabel],
    }));
  }
  if (props.includeAllOption) {
    options = [{ label: 'Todos', value: 'all' }, ...options];
  }
  if (props.showAddNewOption) {
    options = [...options, ADD_NEW_OPTION.value];
  }
  return options;
});

const isFilterable = computed(() => !!props.remoteUrl || !!props.filterLocal || !!externalFilter.value);
const optionsToShow = computed(() => {
  if (props.filterLocal && localFilteredOptions.value !== null) {
    return localFilteredOptions.value;
  }
  return computedOptions.value;
});

let lastRequestId = 0;
let lastCallAt = 0;

async function handleRemoteFilter(val, update, abort) {
  const now = Date.now();
  const str = String(val ?? '');

  // 1) Enforce min chars
  if (props.enforceMinChars && str.length < props.minChars) {
    if (!props.preserveResults) {
      remoteOptions.value = [];
      localFilteredOptions.value = null;
    }
    abort && abort();
    update();
    return;
  }

  // 2) Throttle interno
  if (props.innerThrottleMs > 0 && (now - lastCallAt) < props.innerThrottleMs) {
    abort && abort();
    return;
  }
  lastCallAt = now;

  // 3) Descarta respuestas viejas
  const rid = ++lastRequestId;

  try {
    const filters = { ...props.filters, value: val };
    const { data } = await proxy.$api.post(`/store/${props.remoteUrl}`, filters);

    if (rid !== lastRequestId) return;

    const arr = Array.isArray(data) ? data : [];
    remoteOptions.value = arr;

    // Actualiza cache
    lastSearch.value = { query: str, results: arr };
  } catch (err) {
    emit('error', err);
    console.error('Fetch error:', err);
    if (rid === lastRequestId && !props.preserveResults) {
      remoteOptions.value = [];
    }
  } finally {
    if (rid === lastRequestId) {
      localFilteredOptions.value = null;
      update();
    }
  }
}

function handleLocalFilter(val, update) {
  const fromAttrs = attrs.options || [];
  let filtered = fromAttrs
    .filter(opt => String(opt[props.optionLabel] ?? '').toLowerCase().includes(String(val).toLowerCase()))
    .map(opt => ({ value: opt[props.optionValue], label: opt[props.optionLabel] }));

  if (!val && props.includeAllOption) {
    filtered = [{ label: 'Todos', value: 'all' }, ...filtered];
  }
  if (props.showAddNewOption) filtered.push(ADD_NEW_OPTION.value);

  localFilteredOptions.value = filtered;
  update();
}

function onFilter(val, update, abort) {
  if (externalFilter.value) {
    externalFilter.value(val, update, abort);
    return;
  }
  if (props.remoteUrl) {
    handleRemoteFilter(val, update, abort);
  } else if (props.filterLocal) {
    handleLocalFilter(val, update);
  } else {
    update();
    localFilteredOptions.value = null;
  }
}

// Reinyectar cache al enfocar/abrir popup si aplica
function onFocus() {
  if (!props.remoteUrl) return;
  if (!props.preserveResults) return;
  if ((remoteOptions.value?.length ?? 0) === 0 && (lastSearch.value.results?.length ?? 0) > 0) {
    remoteOptions.value = [...lastSearch.value.results];
  }
}
function onPopupShow() {
  onFocus();
}

// Cerrar popup al perder foco (tab, click afuera, o enfoque programático en otro input)
function handleBlur() {
  if (!props.closeOnBlur) return;
  // Llamamos dos ticks para asegurar el cierre visual en DOM/transiciones
  selectRef.value?.hidePopup?.();
  requestAnimationFrame(() => {
    selectRef.value?.hidePopup?.();
  });
}

function onSelect(val) {
  if (val === '__add_new__') {
    emit('click-new');
    return;
  }

  const opt = (optionsToShow.value || []).find(o => o.value === val) || null;

  // Mantén v-model con ID
  emit('update:modelValue', val);
  // Entrega objeto completo
  emit('select', opt);

  // Cierre/limpieza y blur opcional
  const doCloseAndBlur = () => {
    // cerrar popup (reforzado)
    selectRef.value?.hidePopup?.();
    requestAnimationFrame(() => {
      selectRef.value?.hidePopup?.();
      if (props.blurOnSelect) {
        // blur final tras cerrar popup para liberar foco visual
        selectRef.value?.blur?.();
      }
    });
  };

  if (props.clearAfterSelect) {
    nextTick(() => {
      if (!props.keepInputAfterSelect) {
        selectRef.value?.updateInputValue?.('');
      }
      if (!props.preserveResults) {
        remoteOptions.value = [];
        localFilteredOptions.value = null;
      }
      doCloseAndBlur();
    });
  } else {
    doCloseAndBlur();
  }
}
</script>

<template>
  <div class="app-select flex-grow-1 x-select"
       :class="[attrs.class, { 'x-select--truncate': truncateLabel }]"
       :style="truncateStyle"
       @keydown.enter.stop.prevent
       @keyup.enter.stop>
    <label v-if="label" :for="elementId" class="x-select-label q-mb-xs" style="line-height: 22px">
      {{ label }}
      <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
    </label>

    <q-select ref="selectRef"
              v-bind="{
                ...cleanAttrs,
                class: null,
                label: elementLabel,
                outlined: formDefaults.outlined,
                dense: dense,
                for: elementId,
                'popup-content-class': popupContentClass,
                'aria-labelledby': label ? `${elementId}-label` : null,
                error: !!props.error,
                'error-message': props.error,
                'no-error-icon': true,
                'hide-bottom-space': !props.error,
                'bg-color': props.bgColor || undefined,
              }"
              :hide-selected="isFilterable"
              :fill-input="isFilterable"
              :use-input="isFilterable"
              :dense="props.dense"
              :options-dense="props.dense"
              :emit-value="true"
              :map-options="true"
              :options="optionsToShow"
              @focus="onFocus"
              @popup-show="onPopupShow"
              @blur="handleBlur"
              @filter="onFilter"
              @update:model-value="onSelect"
              @keydown.enter.stop
              @keyup.enter.stop>
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps || {}"/>
      </template>

      <!-- Default de opción: además del ícono FA (opt.icon), soporta logo subido
           (opt.image_url) — p. ej. métodos de pago con imagen propia (Yape,
           Izipay). La imagen tiene prioridad si vienen ambos. -->
      <template #option="scope">
        <q-item v-bind="scope.itemProps" :class="scope.opt.class || ''">
          <q-item-section avatar v-if="scope.opt.image_url || scope.opt.icon" style="min-width: 34px">
            <img v-if="scope.opt.image_url"
                 :src="scope.opt.image_url"
                 alt=""
                 style="width: 22px; height: 22px; object-fit: contain"/>
            <q-icon v-else :name="scope.opt.icon" :color="scope.opt.class?.replace('text-', '') || 'primary'"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>

      <template v-if="showAddButton" #after>
        <q-btn
          flat
          round
          dense
          icon="fal fa-plus"
          color="primary"
          @click.stop="emit('click-new')"
        />
      </template>
    </q-select>
  </div>
</template>
