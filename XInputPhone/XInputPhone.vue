<script setup>
import { computed, ref, toValue, useAttrs, watch } from 'vue'
import { formDefaults } from '@esolutions/js-utils'
import XHelpTip from '../XHelpTip/XHelpTip.vue'
import {
  DEFAULT_COUNTRY,
  SHORT_LIST,
  countryName,
  countryOptions,
  dialCode,
  examplePlaceholder,
  formatAsYouType,
  parsePhone,
  parseTyped,
  validationMessage,
} from './phone.js'

/**
 * XInputPhone (v2.29.0): teléfono con código de país. País con su prefijo a la izquierda (lista corta de la clínica y
 * "Todos los países…"), el número como se dicta a la derecha, formateado al vuelo y validado para ese país.
 *
 * v-model: UNA cadena en formato internacional E.164 ("+51987654321"), o '' cuando está vacío o lo escrito todavía no
 * es un número válido (así nunca se guarda un número a medias; el error se ve al salir del campo). Un valor viejo sin
 * "+" (9 dígitos peruanos) se lee como de Perú y se muestra formateado; no se re-emite hasta que alguien lo toque.
 */
defineOptions({ name: 'XInputPhone', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, null], default: '' },
  isClassic: { type: Boolean, default: formDefaults.isClassic },
  dense: { type: Boolean, default: formDefaults.dense },
  /** Error del servidor (422): String o Array como manda Laravel. Manda sobre el error propio. */
  error: { type: [String, Array], default: null },
  autofocus: { type: Boolean, default: false },
  /** Solo muestra el asterisco y aria-required (el "obligatorio" lo exige el servidor, como en XInput). */
  isRequired: { type: Boolean, default: false },
  /** Texto de ayuda: ícono "?" con tooltip junto a la etiqueta. */
  help: { type: String, default: '' },
  /** Fondo del control, como XInput ('x-field': blanco en claro y el fondo de campo del modo oscuro). */
  bgColor: { type: String, default: 'x-field' },
  /** País propuesto cuando el valor está vacío o no trae código. */
  defaultCountry: { type: String, default: DEFAULT_COUNTRY },
  /** Países de la lista (ISO, en ese orden) o 'all'. La búsqueda siempre mira todos. */
  countries: { type: [Array, String], default: () => SHORT_LIST },
  /** 'mobile' exige celular (pacientes, apoderados: es el WhatsApp); 'any' acepta fijos (sedes, centros, empresas). */
  type: { type: String, default: 'mobile', validator: (v) => ['mobile', 'any'].includes(v) },
  /** Cuándo se muestra el error propio: al salir del campo ('blur'), siempre ('always') o nunca ('never'). */
  showError: { type: String, default: 'blur' },
  /** Bandera SVG junto al país (clases `fi fi-xx` del paquete flag-icons, cuyo CSS carga la app); con false, el código ISO. */
  flags: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'invalid', 'country'])

const attrs = useAttrs()
const fallbackId = `app-q-input-${Math.random().toString(36).substring(2, 9)}`
const elementId = computed(() => (attrs.id ? `app-q-input-${attrs.id}` : fallbackId))
const elementLabel = computed(() => (props.isClassic ? attrs.label : undefined))
const label = computed(() => (props.isClassic ? null : attrs.label))
const inactive = computed(() => attrs.disable === '' || !!attrs.disable || attrs.readonly === '' || !!attrs.readonly)

// ── Estado ──────────────────────────────────────────────────────────────────
const country = ref(props.defaultCountry)
const text = ref('') // lo que se ve: el número nacional formateado
const status = ref(null) // error propio (null = sirve o vacío)
const touched = ref(false)
const lastEmitted = ref(undefined) // último valor que salió por v-model (para no reaccionar a nuestro propio eco)
const inputRef = ref(null)

const dial = computed(() => dialCode(country.value))
const flagClass = (iso) => `fi fi-${String(iso).toLowerCase()} x-input-phone__flag`
const placeholder = computed(() => (attrs.placeholder != null ? attrs.placeholder : examplePlaceholder(country.value)))
const validOk = computed(() => !!text.value.replace(/\D/g, '') && !status.value && !serverError.value)

// Error del servidor: acepta String o Array (formato Laravel 422)
const serverError = computed(() => {
  const e = toValue(props.error)
  if (!e) return null
  return Array.isArray(e) ? e[0] : e
})
const visibleError = computed(() => {
  if (serverError.value) return serverError.value
  if (props.showError === 'never') return null
  return (touched.value || props.showError === 'always') && status.value ? status.value : null
})

// Lo que llega por v-model (al montar o cuando el padre lo cambia): se lee y se muestra formateado.
function syncFromModel(value) {
  if (value === lastEmitted.value) return
  lastEmitted.value = value
  const raw = String(value ?? '').trim()
  if (!raw) {
    text.value = ''
    status.value = null
    return
  }
  const pn = parsePhone(raw, props.defaultCountry)
  if (pn) {
    if (pn.country) country.value = pn.country
    text.value = formatAsYouType(pn.nationalNumber, country.value)
  } else {
    text.value = raw
  }
  status.value = validationMessage(text.value, country.value, props.type)
}
watch(() => props.modelValue, syncFromModel, { immediate: true })
watch(() => props.defaultCountry, (iso) => {
  if (!text.value) country.value = iso
})

// Lo que sale por v-model: E.164 si el número sirve, '' si está vacío o a medias.
function publish() {
  status.value = validationMessage(text.value, country.value, props.type)
  const digits = text.value.replace(/\D/g, '')
  let out = ''
  if (digits && !status.value) {
    const pn = parsePhone(text.value, country.value)
    out = pn ? pn.number : ''
  }
  if (out !== lastEmitted.value) {
    lastEmitted.value = out
    emit('update:modelValue', out)
  }
  emit('invalid', status.value)
}

function onInput(value) {
  let typed = String(value ?? '')
  // Escribieron el código con el más ("+58 412…"): el país se cambia solo y queda el número nacional.
  if (/^\s*\+/.test(typed)) {
    const parsed = parseTyped(typed)
    if (parsed.country) {
      if (parsed.country !== country.value) {
        country.value = parsed.country
        emit('country', parsed.country)
      }
      typed = parsed.national
    }
  }
  text.value = formatAsYouType(typed, country.value)
  publish()
}

function onBlur() {
  touched.value = true
  status.value = validationMessage(text.value, country.value, props.type)
}

// ── Selector de país ────────────────────────────────────────────────────────
const menu = ref(false)
const search = ref('')
const showAll = ref(false)
const shortOptions = computed(() => countryOptions(props.countries))
const allOptions = computed(() => countryOptions('all'))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/^\+/, '')
  if (q) {
    return allOptions.value.filter(
      (o) => o.iso.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.dial.slice(1).startsWith(q),
    )
  }
  return showAll.value ? allOptions.value : shortOptions.value
})

function openMenu() {
  if (inactive.value) return
  menu.value = !menu.value
}

function selectCountry(iso) {
  menu.value = false
  if (iso !== country.value) {
    country.value = iso
    emit('country', iso)
    if (text.value) {
      text.value = formatAsYouType(text.value, iso)
      publish()
    }
  }
  inputRef.value?.focus?.()
}

function onMenuHide() {
  search.value = ''
  showAll.value = false
}

// Evitamos pasar al QInput lo que es nuestro
const filteredAttrs = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const { class: _c, label: _l, type: _t, id: _i, required: _r, 'is-required': _ir, placeholder: _p, ...rest } = attrs
  return rest
})

defineExpose({ focus: () => inputRef.value?.focus?.(), country, isValid: () => validOk.value })
</script>

<template>
  <div class="app-q-input flex-grow-1 x-input x-input-phone" :class="[{ 'x-input-large': !dense }, attrs.class]">
    <!-- Etiqueta manual (no classic) -->
    <label v-if="label" :for="elementId" class="q-input__label q-mb-xs" style="line-height: 22px;"
           :aria-required="props.isRequired ? 'true' : 'false'">
      {{ label }} <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
      <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
    </label>

    <q-input
      ref="inputRef"
      v-bind="{
        ...filteredAttrs,
        class: null,
        label: elementLabel,
        outlined: formDefaults.outlined,
        dense: dense,
        for: elementId,
        type: 'tel',
        inputmode: 'tel',
        autocomplete: 'tel-national',
        autofocus: props.autofocus,
        placeholder: placeholder,
        'aria-required': props.isRequired ? 'true' : null,
        'bg-color': props.bgColor || undefined
      }"
      :model-value="text"
      :error="!!visibleError"
      :error-message="visibleError"
      no-error-icon
      :hide-bottom-space="!visibleError"
      :label-slot="!!elementLabel"
      @update:model-value="onInput"
      @blur="onBlur"
    >
      <!-- País + prefijo -->
      <template #prepend>
        <div
          class="x-input-phone__country"
          :class="{ 'x-input-phone__country--inactive': inactive }"
          :tabindex="inactive ? -1 : 0"
          role="button"
          :aria-label="`País: ${countryName(country)} ${dial}`"
          :aria-expanded="menu ? 'true' : 'false'"
          @click="openMenu"
          @keydown.enter.prevent="openMenu"
          @keydown.space.prevent="openMenu"
        >
          <span v-if="flags" :class="flagClass(country)" aria-hidden="true"></span>
          <span v-else class="x-input-phone__iso">{{ country }}</span>
          <span class="x-input-phone__dial">{{ dial }}</span>
          <q-icon name="arrow_drop_down" size="18px" class="x-input-phone__caret" />
          <q-menu
            v-model="menu"
            no-parent-event
            anchor="bottom left"
            self="top left"
            :offset="[0, 6]"
            class="x-input-phone__menu"
            @hide="onMenuHide"
          >
            <q-input
              v-model="search"
              dense
              borderless
              autofocus
              placeholder="Buscar país o prefijo…"
              class="x-input-phone__search"
              @keydown.stop
            >
              <template #prepend><q-icon name="search" size="18px" /></template>
            </q-input>
            <q-separator />
            <q-list dense class="x-input-phone__list">
              <q-item
                v-for="o in filtered"
                :key="o.iso"
                clickable
                :active="o.iso === country"
                active-class="x-input-phone__item--active"
                @click="selectCountry(o.iso)"
              >
                <q-item-section v-if="flags" side><span :class="flagClass(o.iso)" aria-hidden="true"></span></q-item-section>
                <q-item-section side><span class="x-input-phone__iso">{{ o.iso }}</span></q-item-section>
                <q-item-section side class="x-input-phone__dial">{{ o.dial }}</q-item-section>
                <q-item-section>{{ o.name }}</q-item-section>
              </q-item>
              <q-item v-if="!search && !showAll" clickable class="x-input-phone__more" @click.stop="showAll = true">
                <q-item-section>Todos los países…</q-item-section>
              </q-item>
              <q-item v-if="search && !filtered.length">
                <q-item-section class="text-grey-7">Sin resultados</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </template>

      <template v-if="validOk || $slots.append" #append>
        <q-icon v-if="validOk" name="check_circle" color="teal-7" size="18px" class="x-input-phone__ok" />
        <slot name="append" />
      </template>

      <!-- Etiqueta flotante (classic) -->
      <template v-if="elementLabel" #label>
        <span>{{ elementLabel }}</span>
        <span v-if="props.isRequired" class="text-negative" aria-hidden="true">*</span>
        <XHelpTip v-if="help" :text="help" class="q-ml-xs" />
      </template>

      <template v-if="$slots.before" #before><slot name="before" /></template>
      <template v-if="$slots.after" #after><slot name="after" /></template>
      <template v-if="$slots.hint" #hint><slot name="hint" /></template>
    </q-input>
  </div>
</template>

<style lang="scss">
.x-input-phone__country {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 100%;
  padding-right: 8px;
  margin-right: 4px;
  border-right: 1px solid var(--x-border, rgba(0, 0, 0, 0.18));
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  font-size: 13px;
  color: var(--x-text, inherit);
  outline: none;

  &:focus-visible .x-input-phone__iso {
    box-shadow: 0 0 0 2px var(--q-primary);
  }

  &--inactive {
    cursor: default;
    opacity: 0.7;
  }
}

.x-input-phone__iso {
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.04em;
  line-height: 1;
  padding: 3px 5px;
  border-radius: 4px;
  background: var(--x-surface-muted, #eceff1);
  color: var(--x-text-muted, #455a64);
}

.x-input-phone__dial {
  color: var(--x-text-muted, #6b7280);
}

.x-input-phone__flag {
  width: 21px;
  height: 15px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.x-input-phone__caret {
  margin-left: -2px;
  color: var(--x-text-muted, #6b7280);
}

.x-input-phone__menu {
  width: 300px;
  max-height: 340px;

  .x-input-phone__search {
    padding: 2px 12px 0;
  }

  .x-input-phone__list .q-item {
    min-height: 34px;
  }

  .x-input-phone__list .q-item__section--side {
    padding-right: 10px;
  }

  .x-input-phone__item--active {
    background: var(--x-primary-soft, #e3f2fd);
    color: var(--q-primary);
  }

  .x-input-phone__more {
    color: var(--q-primary);
    border-top: 1px solid var(--x-border, rgba(0, 0, 0, 0.08));
  }
}
</style>
