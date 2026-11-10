<script setup>
/**
 * XSaveBar — barra de guardado de una pantalla de configuración: a la izquierda el estado ("Sin cambios",
 * "3 cambios sin guardar"), a la derecha "Descartar" (opcional) y "Guardar". Va arriba del contenido y se queda
 * pegada debajo del header fijo de la app al hacer scroll (v2.33.0; Adrián 10/11/2026: "me gusta eso", sobre la barra
 * que Configuración de Agenda → Notificaciones tenía hecha a mano, y la pidió para Planes de tratamiento y Comisiones).
 *
 * Uso:
 *   <XSaveBar
 *     :changes="dirtyItems.length"            // número de cambios, o true/false si la pantalla no los cuenta
 *     :saving="saving"
 *     :error="isValid ? '' : 'Revisa los valores marcados.'"
 *     discardable
 *     @save="saveAll"
 *     @discard="discardAll"
 *   />
 *
 * El botón Guardar se apaga solo mientras guarda, sin cambios o con `error`; `disable` lo apaga por otra razón.
 * El slot por defecto va junto al estado (una nota corta de la pantalla).
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import XButton from '../XButton/XButton.vue'

defineOptions({ name: 'XSaveBar' })

const props = defineProps({
  /** Cambios sin guardar: un número (se cuentan) o true/false */
  changes: { type: [Number, Boolean], default: 0 },
  /** Guardando: el botón muestra su carga y no se puede volver a pulsar */
  saving: { type: Boolean, default: false },
  /** Texto en rojo junto al estado; mientras haya uno no se puede guardar */
  error: { type: String, default: '' },
  /** Apaga Guardar por una razón propia de la pantalla */
  disable: { type: Boolean, default: false },
  /** Muestra "Descartar" cuando hay cambios (emite `discard`) */
  discardable: { type: Boolean, default: false },
  saveLabel: { type: String, default: 'Guardar' },
  saveIcon: { type: String, default: 'fa-light fa-floppy-disk' },
  discardLabel: { type: String, default: 'Descartar' },
  /** Texto del estado sin cambios */
  cleanLabel: { type: String, default: 'Sin cambios' },
  /** Distancia desde arriba al pegarse; vacío = el alto del header fijo de la app (se mide) */
  top: { type: String, default: '' },
})

const emit = defineEmits(['save', 'discard'])

const count = computed(() => (typeof props.changes === 'boolean' ? (props.changes ? 1 : 0) : Number(props.changes) || 0))
const hasChanges = computed(() => count.value > 0)
const statusLabel = computed(() => {
  if (!hasChanges.value) return props.cleanLabel
  if (typeof props.changes === 'boolean') return 'Cambios sin guardar'
  return `${count.value} ${count.value === 1 ? 'cambio' : 'cambios'} sin guardar`
})
const canSave = computed(() => hasChanges.value && !props.saving && !props.error && !props.disable)

// Se pega justo debajo del header fijo de la app; su alto cambia en el celular, así que se mide (y al cambiar el
// ancho de la ventana).
const headerHeight = ref(64)
function measure() {
  const header = document.querySelector('.layout-header') || document.querySelector('.q-header')
  if (header) headerHeight.value = header.offsetHeight
}
onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
const stickyTop = computed(() => props.top || `${headerHeight.value}px`)

function save() {
  if (canSave.value) emit('save')
}
</script>

<template>
  <div class="x-save-bar" :style="{ top: stickyTop }">
    <div class="x-save-bar__status">
      <span class="x-save-bar__label" :class="{ 'x-save-bar__label--dirty': hasChanges }">{{ statusLabel }}</span>
      <span v-if="error" class="x-save-bar__error">{{ error }}</span>
      <slot />
    </div>
    <x-button
      v-if="discardable && hasChanges"
      flat
      no-caps
      color="grey-8"
      :label="discardLabel"
      :disable="saving"
      @click="emit('discard')"
    />
    <x-button
      unelevated
      color="primary"
      :icon="saveIcon"
      :label="saveLabel"
      :loading="saving"
      :disable="!canSave"
      @click="save"
    />
  </div>
</template>

<style scoped>
.x-save-bar {
  position: sticky;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--x-surface-2, #f8fafc);
  border-top: 1px solid var(--x-border, #eef1f6);
  border-bottom: 1px solid var(--x-border, #eef1f6);
}
.x-save-bar__status {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  font-size: 0.8125rem;
  color: var(--x-text-muted, #6b7280);
}
.x-save-bar__label--dirty {
  color: var(--x-primary-text, var(--q-primary));
  font-weight: 600;
}
.x-save-bar__error {
  font-size: 0.75rem;
  color: var(--x-negative-text, #c10015);
}
</style>
