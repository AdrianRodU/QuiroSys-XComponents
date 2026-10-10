<script setup>
// Subida de imagen con recorte (cropperjs 1.6.2). Variantes:
//   'inline' — fila con miniatura, texto y botón para limpiar (por defecto)
//   'card'   — la imagen completa con Cambiar / Reubicar / Eliminar al pasar el mouse
//   'avatar' — la foto de una persona en un círculo (v2.27.0): cámara, "Subir foto / Cambiar / Quitar", iniciales
//              sin foto, recorte cuadrado con guía redonda y salida en JPG de 400 × 400
// v2.27.0 también trae lo que el ERP tenía en una copia local: proporción del recorte, tamaño, formato y calidad de
// la salida, "Reubicar" con el encuadre guardado y el segundo argumento de 'change' ({ cropData, originalFile,
// repositioned }). Y en el recorte, acercar con una barra y girar.
import { ref, computed, nextTick, watch, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import Cropper from 'cropperjs/dist/cropper.esm.js'
import 'cropperjs/dist/cropper.min.css'
import XDialog from '../XDialog/XDialog.vue'
import XButton from '../XButton/XButton.vue'
import XLoading from '../XLoading/XLoading.vue'

defineOptions({ name: 'XImageCropperUpload' })

const props = defineProps({
  previewUrl: { type: String,  default: null },
  label:      { type: String,  default: 'Click para subir imagen' },
  hint:       { type: String,  default: null },
  /** Formatos aceptados. Por defecto PNG, JPG, WEBP y SVG; en 'avatar', sin SVG */
  accept:     { type: String,  default: null },
  /** Peso máximo del archivo elegido. Por defecto 2 MB; en 'avatar', 10 MB (una foto de celular, que se reduce al recortarla) */
  maxSizeMb:  { type: Number,  default: null },
  withCrop:   { type: Boolean, default: true },
  /**
   * 'inline' — fila con thumbnail + texto + botón limpiar (default)
   * 'card'   — imagen completa con overlay Cambiar / Eliminar
   * 'avatar' — foto de una persona en un círculo (v2.27.0)
   */
  variant:    { type: String,  default: 'inline' },
  /** 'card' y 'avatar': spinner sobre la imagen */
  loading:    { type: Boolean, default: false },
  /** Solo para variant="card": altura del contenedor */
  height:     { type: String,  default: '200px' },
  /** Solo para variant="card": proporción ancho/alto del contenedor (gana sobre height) */
  previewRatio: { type: Number, default: null },
  /** Muestra la acción "Reubicar" (requiere originalLoader) */
  canReposition: { type: Boolean, default: false },
  /** Encuadre guardado a restaurar al reubicar ({x, y, width, height, ...} de cropperjs) */
  cropData:   { type: Object, default: null },
  /** async () => Blob — el padre resuelve de dónde sale la imagen original */
  originalLoader: { type: Function, default: null },
  /** Relación de aspecto del recorte (ej. 16/9); null = libre. En 'avatar', siempre cuadrado */
  aspectRatio:   { type: Number, default: null },
  /** Tamaño máximo de la imagen recortada. Por defecto 600 × 600; en 'avatar', 400 × 400 */
  cropMaxWidth:  { type: Number, default: null },
  cropMaxHeight: { type: Number, default: null },
  /** Formato y calidad de la imagen recortada. Por defecto PNG; en 'avatar', JPG al 0.9 */
  cropMimeType:  { type: String, default: null },
  cropQuality:   { type: Number, default: null },
  /** Fondo de lo transparente al guardar en JPG (sin él, lo transparente de un PNG sale negro) */
  fillColor:     { type: String, default: '#ffffff' },
  /** Título del diálogo de recorte. Por defecto "Recortar imagen"; en 'avatar', "Recortar foto" */
  cropTitle:     { type: String, default: null },
  /** Guía redonda en el recorte (la imagen se guarda cuadrada igual). Por defecto, solo en 'avatar' */
  round:         { type: Boolean, default: null },
  /** Solo para variant="avatar": diámetro del círculo */
  size:          { type: String, default: '96px' },
  /** Solo para variant="avatar": lo que se ve sin foto (sin iniciales, un ícono de persona) */
  initials:      { type: String, default: '' },
  /** Solo para variant="avatar": ofrece "Quitar" cuando hay foto */
  removable:     { type: Boolean, default: true },
  /** Solo para variant="avatar": solo mirar (sin cámara ni acciones) */
  disable:       { type: Boolean, default: false },
})

const emit = defineEmits(['change', 'remove'])

const $q = useQuasar()

const fileInput        = ref(null)
const cropImageSrc     = ref(null)
const cropImageEl      = ref(null)
const cropperInstance  = ref(null)
const showCropDialog   = ref(false)
const localBlob        = ref(null)
const localPreview     = ref(null)
const loadingOriginal  = ref(false)
// Archivo fuente cuando se sube una imagen nueva (se envía como original)
const pendingOriginal  = ref(null)
// Encuadre a restaurar cuando se reubica la imagen existente
const repositionData   = ref(null)

// ── Valores según la variante (un prop dado siempre gana) ──
const isAvatar      = computed(() => props.variant === 'avatar')
const acceptTypes   = computed(() => props.accept || (isAvatar.value
  ? 'image/png,image/jpeg,image/webp'
  : 'image/png,image/jpeg,image/webp,image/svg+xml'))
const maxMb         = computed(() => props.maxSizeMb ?? (isAvatar.value ? 10 : 2))
const cropRatio     = computed(() => (isAvatar.value ? 1 : props.aspectRatio) || null)
const outMaxWidth   = computed(() => props.cropMaxWidth ?? (isAvatar.value ? 400 : 600))
const outMaxHeight  = computed(() => props.cropMaxHeight ?? (isAvatar.value ? 400 : 600))
const outMime       = computed(() => props.cropMimeType || (isAvatar.value ? 'image/jpeg' : 'image/png'))
const outQuality    = computed(() => props.cropQuality ?? (isAvatar.value ? 0.9 : 0.92))
const roundGuide    = computed(() => props.round ?? isAvatar.value)
const dialogTitle   = computed(() => props.cropTitle || (isAvatar.value ? 'Recortar foto' : 'Recortar imagen'))
const confirmLabel  = computed(() => (isAvatar.value ? 'Usar foto' : 'Recortar'))

const displayUrl = computed(() => localPreview.value || props.previewUrl || null)

const showReposition = computed(() => props.canReposition && typeof props.originalLoader === 'function')

// "Quitar" sobre una foto nueva que todavía no se guardó deshace el cambio y vuelve a la guardada.
const removeLabel = computed(() => (localPreview.value && props.previewUrl ? 'Deshacer' : 'Quitar'))

// Con previewRatio la card adopta la forma real del destino (ej. el panel del login)
const cardStyle = computed(() => (
  props.previewRatio
    ? { aspectRatio: String(props.previewRatio), height: 'auto' }
    : { height: props.height }
))

const hintText = computed(() => {
  if (props.hint) return props.hint
  const exts = acceptTypes.value.split(',').map(t => {
    t = t.trim()
    return t.startsWith('image/') ? t.replace('image/', '').toUpperCase() : t.replace('.', '').toUpperCase()
  }).join(', ')
  return `${exts}. Máx. ${maxMb.value}MB.`
})

// ── Vista previa local ──
const clearLocal = () => {
  if (localPreview.value) URL.revokeObjectURL(localPreview.value)
  localBlob.value    = null
  localPreview.value = null
}

// El padre trae otra imagen (ya subió la recortada, o es otro registro): la vista previa local ya no hace falta y
// "Quitar" vuelve a referirse a la imagen guardada.
watch(() => props.previewUrl, () => clearLocal())

onBeforeUnmount(() => {
  clearLocal()
  if (cropperInstance.value) cropperInstance.value.destroy()
})

// ── File selection ──
const triggerFileInput = () => {
  if (props.disable) return
  fileInput.value?.click()
}

const onFileSelected = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  const accepted = acceptTypes.value.split(',').map(t => t.trim())
  const validType = accepted.some(t =>
    t.startsWith('.') ? file.name.toLowerCase().endsWith(t) : file.type === t
  )
  if (!validType) {
    $q.notify({ type: 'warning', message: 'Formato no soportado.' })
    e.target.value = ''
    return
  }
  if (file.size > maxMb.value * 1024 * 1024) {
    $q.notify({ type: 'warning', message: `La imagen no debe superar los ${maxMb.value}MB.` })
    e.target.value = ''
    return
  }

  // SVG o sin crop: usar directo (sin meta — no hay encuadre ni original que conservar)
  if (!props.withCrop || file.type === 'image/svg+xml') {
    clearLocal()
    localBlob.value    = file
    localPreview.value = URL.createObjectURL(file)
    emit('change', file, null)
    e.target.value = ''
    return
  }

  // Con crop: abrir diálogo
  pendingOriginal.value = file
  repositionData.value  = null

  const reader = new FileReader()
  reader.onload = (ev) => {
    cropImageSrc.value  = ev.target.result
    showCropDialog.value = true
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

// ── Reubicar la imagen ya subida (carga la original con su encuadre anterior) ──
const repositionCurrent = async (e) => {
  e?.stopPropagation()
  if (!props.originalLoader) return
  loadingOriginal.value = true
  try {
    const blob = await props.originalLoader()
    pendingOriginal.value = null
    repositionData.value  = props.cropData || null
    cropImageSrc.value    = URL.createObjectURL(blob)
    showCropDialog.value  = true
  } catch (error) {
    console.error(error)
    $q.notify({ type: 'warning', message: 'No hay imagen original disponible para reubicar.' })
  } finally {
    loadingOriginal.value = false
  }
}

// ── Cropper ──
// Ajusta un encuadre guardado al aspectRatio vigente: conserva el centro y
// recalcula las dimensiones, sin salirse de la imagen. Así "Reubicar" respeta
// la proporción seleccionada actualmente aunque el encuadre venga de otra.
const fitCropDataToRatio = (data, ratio, imageData) => {
  if (!data || !ratio) return data

  const naturalW = imageData?.naturalWidth || data.width
  const naturalH = imageData?.naturalHeight || data.height

  let width = data.width
  let height = width / ratio
  if (height > naturalH) {
    height = naturalH
    width = height * ratio
  }
  if (width > naturalW) {
    width = naturalW
    height = width / ratio
  }

  const cx = data.x + data.width / 2
  const cy = data.y + data.height / 2
  const x = Math.min(Math.max(0, cx - width / 2), naturalW - width)
  const y = Math.min(Math.max(0, cy - height / 2), naturalH - height)

  return { ...data, x, y, width, height }
}

// Acercar (v2.27.0): la barra va de la imagen entera (en cualquier giro) a cuatro veces lo que se ve al abrir; la
// rueda del mouse respeta los mismos topes y mueve la barra.
const zoom    = ref(1)
const zoomMin = ref(0.1)
const zoomMax = ref(1)
// Cien pasos entre los topes: con paso 0 (continuo) la barra no respondía a las flechas del teclado.
const zoomStep = computed(() => Math.max((zoomMax.value - zoomMin.value) / 100, 0.0001))

const initZoom = () => {
  const cropper = cropperInstance.value
  if (!cropper) return
  const image = cropper.getImageData()
  const container = cropper.getContainerData()
  const current = image.width / image.naturalWidth
  const fitAnyTurn = Math.min(container.width, container.height) / Math.max(image.naturalWidth, image.naturalHeight)
  zoomMin.value = Math.min(current, fitAnyTurn)
  zoomMax.value = Math.max(current * 4, zoomMin.value * 4)
  zoom.value    = current
}

const onZoomSlider = (value) => {
  cropperInstance.value?.zoomTo(value)
}

const rotate = () => {
  cropperInstance.value?.rotate(90)
}

const initCropper = () => {
  if (cropperInstance.value) {
    cropperInstance.value.destroy()
    cropperInstance.value = null
  }
  nextTick(() => {
    if (!cropImageEl.value) return
    cropperInstance.value = new Cropper(cropImageEl.value, {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      background: false,
      guides: !roundGuide.value,
      aspectRatio: cropRatio.value || undefined,
      ready: () => {
        if (repositionData.value && cropperInstance.value) {
          cropperInstance.value.setData(
            fitCropDataToRatio(repositionData.value, cropRatio.value, cropperInstance.value.getImageData())
          )
        }
        initZoom()
      },
      zoom: (event) => {
        const { ratio, oldRatio } = event.detail
        if (ratio < zoomMin.value - 1e-6 || ratio > zoomMax.value + 1e-6) {
          event.preventDefault()
          // Un paso de la rueda que se pasaría del tope deja la imagen justo en el tope (antes se quedaba un poco
          // antes). Fuera del evento: zoomTo vuelve a disparar 'zoom'.
          const edge = ratio < zoomMin.value ? zoomMin.value : zoomMax.value
          if (Math.abs(oldRatio - edge) > 1e-6) setTimeout(() => cropperInstance.value?.zoomTo(edge), 0)
          return
        }
        zoom.value = ratio
      },
    })
  })
}

watch(showCropDialog, (val) => {
  if (val) nextTick(() => nextTick(() => initCropper()))
})

const confirmCrop = () => {
  const cropper = cropperInstance.value
  if (!cropper) return
  const cropData = cropper.getData(true)
  const mime = outMime.value
  const canvas = cropper.getCroppedCanvas({
    maxWidth: outMaxWidth.value,
    maxHeight: outMaxHeight.value,
    imageSmoothingQuality: 'high',
    // JPG no tiene transparencia: sin un fondo, lo transparente de un PNG sale negro.
    ...(mime === 'image/jpeg' ? { fillColor: props.fillColor } : {}),
  })
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) {
      $q.notify({ type: 'warning', message: 'No se pudo recortar la imagen. Prueba con otra.' })
      return
    }
    clearLocal()
    localBlob.value    = blob
    localPreview.value = URL.createObjectURL(blob)
    emit('change', blob, {
      cropData,
      originalFile: pendingOriginal.value,
      repositioned: !pendingOriginal.value,
    })
    cancelCrop()
  }, mime, outQuality.value)
}

const cancelCrop = () => {
  if (cropperInstance.value) {
    cropperInstance.value.destroy()
    cropperInstance.value = null
  }
  showCropDialog.value = false
  cropImageSrc.value   = null
}

// ── Remove ──
const onRemove = (e) => {
  e?.stopPropagation()
  if (localPreview.value) {
    clearLocal()
    emit('change', null)
  } else {
    emit('remove')
  }
}

// ── Expose ──
// reset(): olvida la imagen elegida y vuelve a mostrar previewUrl (p. ej. después de subirla).
defineExpose({ blob: localBlob, triggerFileInput, repositionCurrent, reset: clearLocal })
</script>

<template>
  <div>
    <!-- ═══════════════════════════════════════
         VARIANT: inline (fila con thumbnail)
    ═══════════════════════════════════════ -->
    <template v-if="variant === 'inline'">
      <div class="x-image-cropper-upload" @click="triggerFileInput">
        <!-- Thumbnail -->
        <div class="x-image-cropper-upload__thumb">
          <img v-if="displayUrl" :src="displayUrl" class="x-image-cropper-upload__img" />
          <q-icon v-else name="fa-light fa-image" size="28px" color="grey-5" />
        </div>

        <!-- Texto -->
        <div class="col">
          <div class="x-image-cropper-upload__label">{{ label }}</div>
          <div class="x-image-cropper-upload__hint">{{ hintText }}</div>
        </div>

        <!-- Reubicar -->
        <q-btn
          v-if="displayUrl && showReposition"
          flat round dense
          icon="fa-light fa-crop-simple"
          size="sm"
          color="primary"
          :loading="loadingOriginal"
          @click="repositionCurrent"
        >
          <q-tooltip>Reubicar imagen actual</q-tooltip>
        </q-btn>

        <!-- Botón limpiar -->
        <q-btn
          v-if="displayUrl"
          flat round dense
          icon="fa-light fa-xmark"
          size="sm"
          color="grey-6"
          @click="onRemove"
        />
      </div>
    </template>

    <!-- ═══════════════════════════════════════
         VARIANT: card (imagen completa + overlay)
    ═══════════════════════════════════════ -->
    <template v-else-if="variant === 'card'">
      <!-- Con imagen: overlay Cambiar / Reubicar / Eliminar -->
      <div v-if="displayUrl" class="x-icu-card" :style="cardStyle">
        <img :src="displayUrl" class="x-icu-card__img" />
        <div class="x-icu-card__overlay">
          <div class="x-icu-card__actions">
            <div class="x-icu-card__action" @click="triggerFileInput">
              <q-icon name="fal fa-pen" size="18px" color="white" />
              <span>Cambiar</span>
            </div>
            <div v-if="showReposition" class="x-icu-card__action" @click="repositionCurrent">
              <q-icon name="fal fa-crop-simple" size="18px" color="white" />
              <span>Reubicar</span>
            </div>
            <div class="x-icu-card__action x-icu-card__action--delete" @click="onRemove">
              <q-icon name="fal fa-trash" size="18px" color="white" />
              <span>Eliminar</span>
            </div>
          </div>
        </div>
        <x-loading :loading="loading || loadingOriginal" />
      </div>

      <!-- Sin imagen: zona de upload centrada -->
      <div v-else class="x-icu-card x-icu-card--empty" :style="cardStyle" @click="triggerFileInput">
        <q-icon name="fa-light fa-image" size="36px" color="grey-5" />
        <div class="x-icu-card__empty-label">{{ label }}</div>
        <div class="x-icu-card__empty-hint">{{ hintText }}</div>
      </div>
    </template>

    <!-- ═══════════════════════════════════════
         VARIANT: avatar (foto de una persona, v2.27.0)
    ═══════════════════════════════════════ -->
    <div v-else-if="variant === 'avatar'" class="x-icu-avatar" :style="{ '--x-icu-size': size }">
      <div class="x-icu-avatar__frame">
        <div
          class="x-icu-avatar__circle"
          :class="{ 'x-icu-avatar__circle--empty': !displayUrl, 'x-icu-avatar__circle--clickable': !disable }"
          :role="disable ? undefined : 'button'"
          :tabindex="disable ? undefined : 0"
          :aria-label="disable ? undefined : (displayUrl ? 'Cambiar la foto' : 'Subir una foto')"
          @click="triggerFileInput"
          @keydown.enter.prevent="triggerFileInput"
          @keydown.space.prevent="triggerFileInput"
        >
          <img v-if="displayUrl" :src="displayUrl" class="x-icu-avatar__img" alt="" />
          <span v-else-if="initials" class="x-icu-avatar__initials">{{ initials }}</span>
          <q-icon v-else name="fa-light fa-user" class="x-icu-avatar__icon" />
          <div v-if="!disable" class="x-icu-avatar__overlay">
            <q-icon name="fa-light fa-camera" />
          </div>
          <x-loading :loading="loading || loadingOriginal" size="28px" />
        </div>
        <button
          v-if="!disable"
          type="button"
          class="x-icu-avatar__cam"
          tabindex="-1"
          aria-hidden="true"
          @click="triggerFileInput"
        >
          <q-icon name="fa-light fa-camera" />
        </button>
      </div>

      <div v-if="!disable" class="x-icu-avatar__actions">
        <button type="button" class="x-icu-avatar__link" @click="triggerFileInput">
          {{ displayUrl ? 'Cambiar' : 'Subir foto' }}
        </button>
        <template v-if="displayUrl && removable">
          <span class="x-icu-avatar__dot" aria-hidden="true">·</span>
          <button type="button" class="x-icu-avatar__link x-icu-avatar__link--danger" @click="onRemove">
            {{ removeLabel }}
          </button>
        </template>
      </div>
      <div v-if="hint" class="x-icu-avatar__hint">{{ hint }}</div>
    </div>

    <input
      ref="fileInput"
      type="file"
      :accept="acceptTypes"
      style="display: none;"
      @change="onFileSelected"
    />
  </div>

  <!-- Diálogo de recorte -->
  <x-dialog
    v-model="showCropDialog"
    :title="dialogTitle"
    width="550px"
    show-button-close
    @action-button-close="cancelCrop"
  >
    <template #content>
      <div class="x-icu-crop" :class="{ 'x-icu-crop--round': roundGuide }">
        <img
          v-if="cropImageSrc"
          ref="cropImageEl"
          :src="cropImageSrc"
          style="max-width: 100%; display: block;"
        />
      </div>
      <div class="x-icu-crop-tools">
        <q-icon name="fa-light fa-magnifying-glass-minus" size="16px" class="x-icu-crop-tools__icon" />
        <q-slider
          v-model="zoom"
          :min="zoomMin"
          :max="zoomMax"
          :step="zoomStep"
          dense
          class="col"
          aria-label="Acercar"
          @update:model-value="onZoomSlider"
        />
        <q-icon name="fa-light fa-magnifying-glass-plus" size="16px" class="x-icu-crop-tools__icon" />
        <x-button flat size="sm" icon="fa-light fa-rotate-right" label="Girar" @click="rotate" />
      </div>
      <div class="x-icu-crop-hint">Arrastra la imagen para encuadrarla. La rueda del mouse también acerca.</div>
    </template>
    <template #action-buttons>
      <x-button flat label="Cancelar" @click="cancelCrop" />
      <x-button variant="primary" :label="confirmLabel" @click="confirmCrop" />
    </template>
  </x-dialog>
</template>

<style scoped>
/* ─── Variant: inline ─── */
.x-image-cropper-upload {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.x-image-cropper-upload:hover {
  border-color: var(--q-primary);
}
.x-image-cropper-upload__thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.x-image-cropper-upload__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.x-image-cropper-upload__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.x-image-cropper-upload__hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

/* ─── Variant: card ─── */
.x-icu-card {
  position: relative;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #f3f4f6;
}
.x-icu-card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
.x-icu-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.x-icu-card:hover .x-icu-card__overlay {
  opacity: 1;
}
.x-icu-card__actions {
  display: flex;
  gap: 16px;
}
.x-icu-card__action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  transition: background 0.15s;
}
.x-icu-card__action:hover {
  background: rgba(255, 255, 255, 0.28);
}
.x-icu-card__action--delete:hover {
  background: rgba(220, 38, 38, 0.7);
}

/* Sin imagen */
.x-icu-card--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border: 2px dashed #d1d5db;
  transition: border-color 0.2s;
}
.x-icu-card--empty:hover {
  border-color: var(--q-primary);
}
.x-icu-card__empty-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.x-icu-card__empty-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* ─── Variant: avatar ─── */
.x-icu-avatar {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.x-icu-avatar__frame {
  position: relative;
  width: var(--x-icu-size);
  height: var(--x-icu-size);
  flex-shrink: 0;
}
.x-icu-avatar__circle {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}
.x-icu-avatar__circle--empty {
  background: color-mix(in srgb, var(--q-primary) 12%, transparent);
  color: var(--q-primary);
}
.x-icu-avatar__circle--clickable {
  cursor: pointer;
}
.x-icu-avatar__circle:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
.x-icu-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.x-icu-avatar__initials {
  font-size: calc(var(--x-icu-size) * 0.32);
  font-weight: 600;
  letter-spacing: 0.02em;
  user-select: none;
}
.x-icu-avatar__icon {
  font-size: calc(var(--x-icu-size) * 0.42);
}
.x-icu-avatar__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--x-icu-size) * 0.24);
  opacity: 0;
  transition: opacity 0.2s;
}
.x-icu-avatar__circle--clickable:hover .x-icu-avatar__overlay,
.x-icu-avatar__circle--clickable:focus-visible .x-icu-avatar__overlay {
  opacity: 1;
}
.x-icu-avatar__cam {
  position: absolute;
  right: 0;
  bottom: 0;
  width: max(26px, calc(var(--x-icu-size) * 0.3));
  height: max(26px, calc(var(--x-icu-size) * 0.3));
  border-radius: 50%;
  border: 2px solid #ffffff;
  background: var(--q-primary);
  color: white;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
}
.x-icu-avatar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
}
.x-icu-avatar__link {
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: var(--q-primary);
  cursor: pointer;
}
.x-icu-avatar__link:hover {
  text-decoration: underline;
}
.x-icu-avatar__link--danger {
  color: var(--q-negative);
}
.x-icu-avatar__dot {
  color: #9ca3af;
}
.x-icu-avatar__hint {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  max-width: 220px;
}

/* ─── Diálogo de recorte ─── */
.x-icu-crop {
  max-height: 400px;
  overflow: hidden;
  border-radius: 8px;
  background: #f3f4f6;
}
/* Guía redonda (la imagen se guarda cuadrada igual) */
.x-icu-crop--round :deep(.cropper-view-box),
.x-icu-crop--round :deep(.cropper-face) {
  border-radius: 50%;
}
.x-icu-crop--round :deep(.cropper-view-box) {
  outline: 0;
  box-shadow: 0 0 0 1px var(--q-primary);
}
.x-icu-crop-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.x-icu-crop-tools__icon {
  color: #6b7280;
}
.x-icu-crop-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}
</style>

<style>
/* Modo oscuro: el borde de la cámara toma el fondo del diálogo (con :global() en el bloque scoped, Vue se quedaba
   solo con .body--dark y perdía el resto del selector). */
.body--dark .x-icu-avatar__cam {
  border-color: var(--q-dark, #1d1d1d);
}
</style>
