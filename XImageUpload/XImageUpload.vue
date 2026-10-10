<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

defineOptions({ name: 'XImageUpload' })

const props = defineProps({
  modelValue:  { type: File,   default: null },
  previewUrl:  { type: String, default: '' },
  label:       { type: String, default: 'Click para subir imagen' },
  hint:        { type: String, default: '' },
  accept:      { type: String, default: 'image/png,image/jpeg,image/webp,image/svg+xml' },
  maxSizeMb:   { type: Number, default: 2 },
})

const emit = defineEmits(['update:modelValue'])

const $q      = useQuasar()
const fileInput = ref(null)

const displayUrl = computed(() => {
  if (props.modelValue) return URL.createObjectURL(props.modelValue)
  return props.previewUrl || ''
})

const hintText = computed(() => {
  if (props.hint) return props.hint
  const exts = props.accept.split(',').map(t => {
    t = t.trim()
    return t.startsWith('image/') ? t.replace('image/', '').toUpperCase() : t.replace('.', '').toUpperCase()
  }).join(', ')
  return `${exts}. Máx. ${props.maxSizeMb}MB.`
})

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const accepted = props.accept.split(',').map(t => t.trim())
  const validType = accepted.some(t =>
    t.startsWith('.') ? file.name.toLowerCase().endsWith(t) : file.type === t
  )

  if (!validType) {
    $q.notify({ type: 'warning', message: 'Formato no soportado.' })
    e.target.value = ''
    return
  }

  if (file.size > props.maxSizeMb * 1024 * 1024) {
    $q.notify({ type: 'warning', message: `La imagen no debe superar los ${props.maxSizeMb}MB.` })
    e.target.value = ''
    return
  }

  emit('update:modelValue', file)
  e.target.value = ''
}

function clear(e) {
  e.stopPropagation()
  emit('update:modelValue', null)
}
</script>

<template>
  <div>
    <div class="x-image-upload" @click="triggerFileInput">
      <!-- Thumbnail -->
      <div class="x-image-upload__thumb">
        <img v-if="displayUrl" :src="displayUrl" class="x-image-upload__img" />
        <q-icon v-else name="fa-light fa-image" size="28px" color="grey-5" />
      </div>

      <!-- Texto -->
      <div class="col">
        <div class="x-image-upload__label">{{ label }}</div>
        <div class="x-image-upload__hint">{{ hintText }}</div>
      </div>

      <!-- Botón limpiar -->
      <q-btn
        v-if="modelValue"
        flat round dense
        icon="fa-light fa-xmark"
        size="sm"
        color="grey-6"
        @click="clear"
      />
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      style="display: none;"
      @change="onFileSelected"
    />
  </div>
</template>

<style scoped>
.x-image-upload {
  border: 2px dashed var(--x-border-strong, #d1d5db);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.x-image-upload:hover {
  border-color: var(--q-primary);
}
.x-image-upload__thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: var(--x-surface-3, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.x-image-upload__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.x-image-upload__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--x-text-2, #374151);
}
.x-image-upload__hint {
  font-size: 12px;
  color: var(--x-text-subtle, #9ca3af);
  margin-top: 2px;
}
</style>
