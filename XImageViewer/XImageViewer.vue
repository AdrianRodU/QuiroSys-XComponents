<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue'

/**
 * XImageViewer — visor de fotos a pantalla completa (vouchers, fotos de cierre, comprobantes).
 *
 * La foto se ve encima de la pantalla, con su título y su X. Se acerca con los botones, con la
 * rueda (hacia donde apunta el cursor), con doble clic o con dos dedos; se arrastra para moverse;
 * se ajusta a la pantalla, se gira y se descarga. Con varias fotos: flechas, teclado y contador.
 *
 * Sin dependencias: solo el QDialog de Quasar. Los íconos van en SVG para no depender del juego
 * de íconos que cargue cada proyecto.
 *
 * El componente NO hace HTTP por su cuenta: el consumidor entrega un `fetcher` (así cada app usa
 * su axios con Bearer e interceptores), igual que XPdfPreview.
 *
 * Uso:
 *   const refViewer = ref(null)
 *   refViewer.value.open({
 *     items: [
 *       { key: 709, title: 'Yape directo · S/ 50.00', subtitle: 'B002-29090 · Op. 15236604', filename: 'voucher-709' },
 *     ],
 *     index: 0,                                    // con cuál empieza
 *     fetcher: async (item) => (await api.get(`/pagos/${item.key}/voucher`, { responseType: 'blob' })).data,
 *   })
 *
 * `fetcher(item, index)` puede resolver un Blob (se convierte a object URL y se libera al cerrar)
 * o un string (URL directa, p. ej. firmada). Un item también puede traer `src` y no necesitar fetcher.
 * Atajo para una sola foto: `open({ title, subtitle, filename, src | fetcher })`.
 */

defineOptions({ name: 'XImageViewer' })

const props = defineProps({
  /** Muestra el botón de descargar. */
  downloadable: { type: Boolean, default: true },
  /** Muestra el botón de girar (las fotos de celular suelen llegar giradas). */
  rotatable: { type: Boolean, default: true },
  /** Con varias fotos, pide por adelantado la anterior y la siguiente. */
  preload: { type: Boolean, default: true },
  /** Acercamiento máximo, en veces el tamaño real de la foto. */
  maxScale: { type: Number, default: 8 },
  /** Textos propios (se mezclan con los de fábrica; ver README). */
  labels: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['open', 'close', 'change', 'download'])

const DEFAULT_LABELS = {
  viewer: 'Visor de imágenes',
  close: 'Cerrar',
  previous: 'Anterior',
  next: 'Siguiente',
  zoomIn: 'Acercar',
  zoomOut: 'Alejar',
  actualSize: 'Ver en tamaño real',
  fit: 'Ajustar a la pantalla',
  rotate: 'Girar',
  download: 'Descargar',
  loading: 'Cargando…',
  loadError: 'No se pudo cargar la imagen.',
  notImage: 'Este archivo no es una imagen y no se puede mostrar aquí.',
  retry: 'Reintentar',
  counter: (current, total) => `${current} / ${total}`,
  counterLabel: (current, total) => `Imagen ${current} de ${total}`,
}
const text = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }))

// Un toque que se mueve menos que esto sigue siendo un toque, no un arrastre.
const TAP_SLOP = 6
const DOUBLE_TAP_MS = 320
const DOUBLE_TAP_SLOP = 32
// Deslizar al menos esto (sin acercar) pasa a la foto anterior o a la siguiente.
const SWIPE_MIN = 70
const ZOOM_STEP = 1.4
const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
}

const visible = ref(false)
const items = ref([])
// Una entrada por foto: { status, url, blob, objectUrl, natural, turns }.
//   status: loading (pidiéndola o decodificándola) | ready | error | unsupported (llegó, pero no es imagen).
const entries = ref([])
const index = ref(0)
const imgRef = ref(null)
// El escenario se guarda en una variable simple (no reactiva): solo se usa para medir y capturar el puntero.
let stageEl = null
const stage = reactive({ w: 0, h: 0 })
// Vista de la foto actual: escala (1 = tamaño real) y desplazamiento respecto al centro.
const view = reactive({ scale: 1, tx: 0, ty: 0 })
// La transición suave es solo para botones y teclado: con la rueda, el arrastre o los dos dedos
// la foto tiene que seguir a la mano sin retraso.
const smooth = ref(false)
const dragging = ref(false)
const swipeX = ref(0)

let fetcher = null
// Sube con cada apertura y cada cierre: una foto que llega tarde de una sesión anterior se descarta.
let session = 0
let resizeObserver = null
let gesture = null
let lastTap = null
const pointers = new Map()

const item = computed(() => items.value[index.value] || {})
const entry = computed(() => entries.value[index.value] || null)
const status = computed(() => entry.value?.status || 'loading')
const hasMany = computed(() => items.value.length > 1)
const canPrev = computed(() => index.value > 0)
const canNext = computed(() => index.value < items.value.length - 1)
const turns = computed(() => entry.value?.turns || 0)

// Tamaño de la foto tal como se ve: girada un cuarto de vuelta, ancho y alto se intercambian.
const rotated = computed(() => {
  const natural = entry.value?.natural
  if (!natural) return null
  return turns.value % 2 !== 0 ? { w: natural.h, h: natural.w } : { w: natural.w, h: natural.h }
})

// El visor ocupa toda la ventana: mientras el escenario no se haya medido, vale el tamaño de la ventana.
const stageSize = computed(() => ({
  w: stage.w || (typeof window !== 'undefined' ? window.innerWidth : 0),
  h: stage.h || (typeof window !== 'undefined' ? window.innerHeight : 0),
}))
// Margen que se reserva para el título, las flechas y la barra de herramientas al ajustar.
const inset = computed(() => {
  const narrow = stageSize.value.w < 600
  return { x: narrow ? 12 : hasMany.value ? 80 : 32, y: narrow ? 76 : 88 }
})
const safe = computed(() => ({
  w: Math.max(40, stageSize.value.w - inset.value.x * 2),
  h: Math.max(40, stageSize.value.h - inset.value.y * 2),
}))

// "Ajustar a la pantalla": la foto entera a la vista. Nunca la agranda más allá de su tamaño real.
const fitScale = computed(() => {
  const size = rotated.value
  if (!size || !size.w || !size.h) return 1
  return Math.min(safe.value.w / size.w, safe.value.h / size.h, 1)
})
const minScale = computed(() => fitScale.value)
const maxScale = computed(() => Math.max(1, props.maxScale, fitScale.value))
const isFit = computed(() => Math.abs(view.scale - fitScale.value) < 0.0005)
const isActualSize = computed(() => Math.abs(view.scale - 1) < 0.0005)
const canZoomIn = computed(() => status.value === 'ready' && view.scale < maxScale.value - 0.0005)
const canZoomOut = computed(() => status.value === 'ready' && view.scale > minScale.value + 0.0005)
const percent = computed(() => `${Math.round(view.scale * 100)}%`)
// Lo que hace el clic en el porcentaje: ir al tamaño real o, si ya está ahí, volver a ajustar.
const percentAction = computed(() =>
  status.value === 'ready' && isActualSize.value && !isFit.value ? text.value.fit : text.value.actualSize,
)

const counterText = computed(() => text.value.counter(index.value + 1, items.value.length))
const counterLabel = computed(() => text.value.counterLabel(index.value + 1, items.value.length))
const ariaLabel = computed(() => item.value.title || text.value.viewer)
const altText = computed(() => [item.value.title, item.value.subtitle].filter(Boolean).join(' · ') || text.value.viewer)

const imgStyle = computed(() => ({
  transform:
    `translate(calc(-50% + ${view.tx + swipeX.value}px), calc(-50% + ${view.ty}px)) ` +
    `rotate(${turns.value * 90}deg) scale(${view.scale})`,
}))

// ── Vista ────────────────────────────────────────────────────────────────────

function clampScale(value) {
  return Math.min(maxScale.value, Math.max(minScale.value, value))
}

/** La foto no se puede sacar de la zona visible: siempre queda un borde suyo a la vista. */
function clampPan() {
  const size = rotated.value
  if (!size) {
    view.tx = 0
    view.ty = 0
    return
  }
  const maxX = Math.max(0, (size.w * view.scale - safe.value.w) / 2)
  const maxY = Math.max(0, (size.h * view.scale - safe.value.h) / 2)
  view.tx = Math.min(maxX, Math.max(-maxX, view.tx))
  view.ty = Math.min(maxY, Math.max(-maxY, view.ty))
}

/** Lleva la escala a `target` dejando quieto el punto (px, py), medido desde el centro del visor. */
function zoomTo(target, px = 0, py = 0, animated = false) {
  const next = clampScale(target)
  const ratio = next / view.scale
  smooth.value = animated
  view.tx = px - (px - view.tx) * ratio
  view.ty = py - (py - view.ty) * ratio
  view.scale = next
  clampPan()
}

function resetView(animated = false) {
  smooth.value = animated
  view.scale = fitScale.value
  view.tx = 0
  view.ty = 0
}

function zoomIn() {
  if (canZoomIn.value) zoomTo(view.scale * ZOOM_STEP, 0, 0, true)
}

function zoomOut() {
  if (canZoomOut.value) zoomTo(view.scale / ZOOM_STEP, 0, 0, true)
}

/** El porcentaje alterna entre el tamaño real (100 %) y la foto ajustada. */
function toggleActualSize() {
  if (status.value !== 'ready') return
  if (isActualSize.value) resetView(true)
  else zoomTo(1, 0, 0, true)
}

/** Doble clic o doble toque: acerca hacia ese punto; si ya estaba acercada, vuelve a ajustar. */
function toggleZoomAt(point) {
  if (status.value !== 'ready') return
  if (isFit.value) zoomTo(Math.max(1, fitScale.value * 2.5), point.x, point.y, true)
  else resetView(true)
}

function rotate() {
  const current = entry.value
  if (!current || status.value !== 'ready') return
  current.turns += 1
  resetView(true)
}

// ── Carga ────────────────────────────────────────────────────────────────────

async function ensureLoaded(position) {
  const target = items.value[position]
  if (!target) return
  if (entries.value[position] && entries.value[position].status !== 'error') return

  const record = reactive({ status: 'loading', url: '', blob: null, objectUrl: false, natural: null, turns: 0 })
  entries.value[position] = record
  const mine = session
  try {
    let result = target.src
    if (!result) {
      if (typeof fetcher !== 'function') throw new Error('XImageViewer: el item no trae `src` y no se entregó un `fetcher`.')
      result = await fetcher(target, position)
    }
    if (mine !== session) return
    if (typeof result === 'string' && result) {
      record.url = result
    } else if (typeof Blob !== 'undefined' && result instanceof Blob) {
      record.blob = result
      // Llegó un archivo que no es imagen (un PDF, por ejemplo): no se intenta dibujar; se ofrece descargarlo.
      if (result.type && !result.type.startsWith('image/')) {
        record.status = 'unsupported'
        return
      }
      record.url = URL.createObjectURL(result)
      record.objectUrl = true
    } else {
      throw new Error('XImageViewer: el `fetcher` debe resolver un Blob o una URL.')
    }
    // Sigue en "loading" hasta que el <img> termine de decodificarla (onImageLoad).
  } catch {
    if (mine === session) record.status = 'error'
  }
}

function onImageLoad(event) {
  const current = entry.value
  if (!current) return
  const image = event.target
  if (!image.naturalWidth || !image.naturalHeight) {
    current.status = 'error'
    return
  }
  // Se mide aquí y no solo con el ResizeObserver: su primer aviso puede llegar después que la foto.
  readStageSize()
  current.natural = { w: image.naturalWidth, h: image.naturalHeight }
  current.status = 'ready'
  resetView(false)
}

function onImageError() {
  const current = entry.value
  if (!current) return
  // Si el archivo llegó (hay Blob) pero el navegador no lo puede dibujar, no es una imagen: se puede descargar.
  current.status = current.blob ? 'unsupported' : 'error'
}

function releaseEntry(record) {
  if (record?.objectUrl && record.url) URL.revokeObjectURL(record.url)
}

function retry() {
  releaseEntry(entries.value[index.value])
  entries.value[index.value] = undefined
  ensureLoaded(index.value)
}

function show(position) {
  index.value = position
  smooth.value = false
  swipeX.value = 0
  view.tx = 0
  view.ty = 0
  view.scale = entries.value[position]?.natural ? fitScale.value : 1
  ensureLoaded(position)
  if (props.preload && hasMany.value) {
    ensureLoaded(position + 1)
    ensureLoaded(position - 1)
  }
}

function go(delta) {
  const next = index.value + delta
  if (next < 0 || next >= items.value.length) return
  show(next)
  emit('change', next, items.value[next])
}

// ── Descarga ─────────────────────────────────────────────────────────────────

function fileNameFor(target, record, position) {
  const base = String(target.filename || '').trim() || `imagen-${position + 1}`
  if (/\.[a-z0-9]{2,5}$/i.test(base)) return base
  return `${base}.${EXTENSION_BY_TYPE[record.blob?.type] || 'jpg'}`
}

function download() {
  const record = entry.value
  if (!record || (!record.url && !record.blob)) return
  const link = document.createElement('a')
  // Un archivo que no se pudo dibujar no tiene object URL: se crea uno solo para bajarlo.
  const temporary = record.url ? null : URL.createObjectURL(record.blob)
  link.href = record.url || temporary
  link.download = fileNameFor(item.value, record, index.value)
  if (!record.blob) {
    // URL directa: si es de otro origen el navegador puede abrirla en vez de bajarla.
    link.target = '_blank'
    link.rel = 'noopener'
  }
  document.body.appendChild(link)
  link.click()
  link.remove()
  if (temporary) setTimeout(() => URL.revokeObjectURL(temporary), 2000)
  emit('download', item.value, index.value)
}

// ── Gestos ───────────────────────────────────────────────────────────────────

function stageBox() {
  const rect = stageEl.getBoundingClientRect()
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2 }
}

function pointFrom(event) {
  const box = stageBox()
  return { x: event.clientX - box.cx, y: event.clientY - box.cy }
}

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

function onWheel(event) {
  if (status.value !== 'ready') return
  // deltaMode 1 = líneas, 2 = páginas: se llevan a píxeles para que cada ratón acerque parecido.
  const raw =
    event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * stageSize.value.h : event.deltaY
  const delta = Math.max(-120, Math.min(120, raw))
  const point = pointFrom(event)
  zoomTo(view.scale * Math.exp(-delta * 0.0022), point.x, point.y, false)
}

function startPan(x, y, onImage, moved = false) {
  gesture = {
    type: 'pan',
    startX: x,
    startY: y,
    tx: view.tx,
    ty: view.ty,
    moved,
    onImage,
    // Sin acercar, deslizar hacia los lados cambia de foto en vez de arrastrarla.
    swipe: !moved && hasMany.value && (status.value !== 'ready' || isFit.value),
  }
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  // Los botones de "Reintentar" y "Descargar" del aviso central son clics normales.
  if (event.target.closest?.('.x-image-viewer__state')) return
  // Con la captura, el arrastre sigue aunque el puntero salga del visor. Si el navegador la niega
  // (puntero ya soltado), el gesto funciona igual mientras el puntero siga dentro.
  try {
    stageEl.setPointerCapture(event.pointerId)
  } catch {
    /* sin captura */
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  smooth.value = false

  if (pointers.size === 1) {
    startPan(event.clientX, event.clientY, event.target === imgRef.value)
  } else if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    swipeX.value = 0
    gesture = { type: 'pinch', distance: distance(a, b) || 1, scale: view.scale, mid: middle(a, b), tx: view.tx, ty: view.ty }
  }
}

function onPointerMove(event) {
  if (!gesture || !pointers.has(event.pointerId)) return
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (gesture.type === 'pinch') {
    if (pointers.size < 2 || status.value !== 'ready') return
    const [a, b] = [...pointers.values()]
    const mid = middle(a, b)
    const box = stageBox()
    const next = clampScale(gesture.scale * (distance(a, b) / gesture.distance))
    const ratio = next / gesture.scale
    const px = gesture.mid.x - box.cx
    const py = gesture.mid.y - box.cy
    // Acerca respecto al punto medio de los dedos y lo sigue si los dedos se desplazan.
    view.scale = next
    view.tx = px - (px - gesture.tx) * ratio + (mid.x - gesture.mid.x)
    view.ty = py - (py - gesture.ty) * ratio + (mid.y - gesture.mid.y)
    clampPan()
    return
  }

  const dx = event.clientX - gesture.startX
  const dy = event.clientY - gesture.startY
  if (!gesture.moved && Math.hypot(dx, dy) < TAP_SLOP) return
  gesture.moved = true
  dragging.value = true
  if (gesture.swipe) {
    // En los extremos la foto se resiste: no hay otra hacia ese lado.
    const blocked = (dx > 0 && !canPrev.value) || (dx < 0 && !canNext.value)
    swipeX.value = blocked ? dx * 0.25 : dx
    return
  }
  view.tx = gesture.tx + dx
  view.ty = gesture.ty + dy
  clampPan()
}

function onPointerUp(event) {
  if (!pointers.has(event.pointerId)) return
  pointers.delete(event.pointerId)
  try {
    stageEl?.releasePointerCapture(event.pointerId)
  } catch {
    /* no estaba capturado */
  }
  const finished = gesture

  if (finished?.type === 'pinch' && pointers.size === 1) {
    // Quedó un dedo: sigue como arrastre desde donde está, sin saltos.
    const [rest] = [...pointers.values()]
    startPan(rest.x, rest.y, true, true)
    return
  }
  if (pointers.size > 0) return

  gesture = null
  dragging.value = false
  if (!finished || finished.type !== 'pan') return

  if (finished.swipe && finished.moved) {
    const travelled = swipeX.value
    smooth.value = true
    swipeX.value = 0
    if (travelled <= -SWIPE_MIN) go(1)
    else if (travelled >= SWIPE_MIN) go(-1)
    return
  }
  if (!finished.moved && event.type === 'pointerup') onTap(event, finished)
}

function onTap(event, finished) {
  // Toque fuera de la foto: se cierra, como en cualquier visor.
  if (!finished.onImage) {
    close()
    return
  }
  const now = performance.now()
  const isDouble =
    lastTap &&
    now - lastTap.time < DOUBLE_TAP_MS &&
    Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < DOUBLE_TAP_SLOP
  if (isDouble) {
    lastTap = null
    toggleZoomAt(pointFrom(event))
  } else {
    lastTap = { time: now, x: event.clientX, y: event.clientY }
  }
}

function onKeydown(event) {
  if (!visible.value || event.altKey || event.ctrlKey || event.metaKey) return
  switch (event.key) {
    case 'ArrowLeft':
      go(-1)
      break
    case 'ArrowRight':
      go(1)
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
    case '_':
      zoomOut()
      break
    case '0':
      if (status.value === 'ready') resetView(true)
      break
    case 'r':
    case 'R':
      if (props.rotatable) rotate()
      break
    default:
      return
  }
  // La tecla es del visor: no debe llegar a los atajos de la pantalla que quedó detrás.
  event.preventDefault()
  event.stopPropagation()
}

// ── Tamaño del escenario ─────────────────────────────────────────────────────

function readStageSize() {
  if (!stageEl) return
  stage.w = stageEl.clientWidth
  stage.h = stageEl.clientHeight
}

function measureStage() {
  if (!stageEl) return
  const wasFit = isFit.value
  readStageSize()
  if (status.value !== 'ready') return
  // Si la foto estaba ajustada, sigue ajustada al nuevo tamaño; si estaba acercada, se respeta.
  if (wasFit) resetView(false)
  else {
    view.scale = clampScale(view.scale)
    clampPan()
  }
}

// Vue llama a esta función en cada repintado, no solo al montar: si el elemento es el mismo no hay nada
// que hacer (volver a medir aquí cortaría la transición de "ajustar a la pantalla").
function bindStage(el) {
  if (el === stageEl) return
  stageEl = el
  resizeObserver?.disconnect()
  resizeObserver = null
  if (!el) return
  measureStage()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measureStage)
    resizeObserver.observe(el)
  }
}

// ── Abrir y cerrar ───────────────────────────────────────────────────────────

function releaseAll() {
  entries.value.forEach(releaseEntry)
  entries.value = []
  pointers.clear()
  gesture = null
  lastTap = null
  dragging.value = false
  swipeX.value = 0
}

function open(options = {}) {
  session += 1
  releaseAll()
  const list =
    Array.isArray(options.items) && options.items.length
      ? options.items
      : [{ key: options.key, title: options.title, subtitle: options.subtitle, filename: options.filename, src: options.src }]
  items.value = list.map((entryItem) => ({ ...entryItem }))
  fetcher = typeof options.fetcher === 'function' ? options.fetcher : null
  const start = Math.min(items.value.length - 1, Math.max(0, Number(options.index) || 0))
  // En fase de captura: el visor recibe la tecla antes que cualquier atajo de la pantalla de atrás.
  window.addEventListener('keydown', onKeydown, true)
  visible.value = true
  show(start)
  emit('open', start, items.value[start])
}

function close() {
  visible.value = false
}

// Lo dispara el QDialog al terminar de cerrarse, también con Esc.
function onHide() {
  session += 1
  window.removeEventListener('keydown', onKeydown, true)
  releaseAll()
  items.value = []
  fetcher = null
  emit('close')
}

onBeforeUnmount(() => {
  session += 1
  window.removeEventListener('keydown', onKeydown, true)
  resizeObserver?.disconnect()
  releaseAll()
})

defineExpose({ open, close })
</script>

<template>
  <q-dialog
    v-model="visible"
    maximized
    transition-show="fade"
    transition-hide="fade"
    :transition-duration="180"
    class="x-image-viewer-dialog"
    :aria-label="ariaLabel"
    @hide="onHide"
  >
    <div
      class="x-image-viewer"
      :class="{
        'x-image-viewer--dragging': dragging,
        'x-image-viewer--zoomed': status === 'ready' && !isFit,
      }"
    >
      <!-- Escenario: la foto y los gestos. Todo lo demás flota encima. -->
      <div
        :ref="bindStage"
        class="x-image-viewer__stage"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          v-if="entry && entry.url && status !== 'unsupported' && status !== 'error'"
          :key="`${index}:${entry.url}`"
          ref="imgRef"
          class="x-image-viewer__img"
          :class="{
            'x-image-viewer__img--ready': status === 'ready',
            'x-image-viewer__img--smooth': smooth && !dragging,
          }"
          :src="entry.url"
          :alt="altText"
          :style="imgStyle"
          draggable="false"
          @load="onImageLoad"
          @error="onImageError"
          @dragstart.prevent
        />

        <div v-if="status === 'loading'" class="x-image-viewer__state" role="status">
          <span class="x-image-viewer__spinner" aria-hidden="true" />
          <span>{{ text.loading }}</span>
        </div>

        <div v-else-if="status === 'error' || status === 'unsupported'" class="x-image-viewer__state" role="alert">
          <svg class="x-image-viewer__state-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.8v5.2M12 16.1v.4" />
          </svg>
          <span>{{ status === 'error' ? text.loadError : text.notImage }}</span>
          <div class="x-image-viewer__state-actions">
            <button v-if="status === 'error'" type="button" class="x-image-viewer__pill" @click="retry">
              {{ text.retry }}
            </button>
            <button
              v-if="status === 'unsupported' && downloadable"
              type="button"
              class="x-image-viewer__pill"
              @click="download"
            >
              {{ text.download }}
            </button>
          </div>
        </div>
      </div>

      <!-- Título, contador y X -->
      <header class="x-image-viewer__top">
        <div class="x-image-viewer__titles">
          <div v-if="item.title" class="x-image-viewer__title">{{ item.title }}</div>
          <div v-if="item.subtitle" class="x-image-viewer__subtitle">{{ item.subtitle }}</div>
        </div>
        <div class="x-image-viewer__top-actions">
          <span v-if="hasMany" class="x-image-viewer__counter" :aria-label="counterLabel">{{ counterText }}</span>
          <button
            type="button"
            class="x-image-viewer__btn x-image-viewer__btn--close"
            :aria-label="text.close"
            @click="close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            <q-tooltip :delay="500">{{ text.close }} (Esc)</q-tooltip>
          </button>
        </div>
      </header>

      <!-- Flechas (solo con varias fotos) -->
      <template v-if="hasMany">
        <button
          type="button"
          class="x-image-viewer__nav x-image-viewer__nav--prev"
          :aria-label="text.previous"
          :disabled="!canPrev"
          @click="go(-1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" /></svg>
        </button>
        <button
          type="button"
          class="x-image-viewer__nav x-image-viewer__nav--next"
          :aria-label="text.next"
          :disabled="!canNext"
          @click="go(1)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5L16 12l-6.5 6.5" /></svg>
        </button>
      </template>

      <!-- Barra de herramientas -->
      <div class="x-image-viewer__toolbar" role="toolbar" :aria-label="text.viewer">
        <button type="button" class="x-image-viewer__btn" :aria-label="text.zoomOut" :disabled="!canZoomOut" @click="zoomOut">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.4 15.4L20 20M7.8 10.5h5.4" />
          </svg>
          <q-tooltip :delay="500" anchor="top middle" self="bottom middle" :offset="[0, 10]">{{ text.zoomOut }} (−)</q-tooltip>
        </button>
        <button
          type="button"
          class="x-image-viewer__btn x-image-viewer__btn--percent"
          :aria-label="percentAction"
          :disabled="status !== 'ready'"
          @click="toggleActualSize"
        >
          {{ status === 'ready' ? percent : '—' }}
          <q-tooltip :delay="500" anchor="top middle" self="bottom middle" :offset="[0, 10]">
            {{ percentAction }}
          </q-tooltip>
        </button>
        <button type="button" class="x-image-viewer__btn" :aria-label="text.zoomIn" :disabled="!canZoomIn" @click="zoomIn">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.4 15.4L20 20M7.8 10.5h5.4M10.5 7.8v5.4" />
          </svg>
          <q-tooltip :delay="500" anchor="top middle" self="bottom middle" :offset="[0, 10]">{{ text.zoomIn }} (+)</q-tooltip>
        </button>

        <span class="x-image-viewer__divider" aria-hidden="true" />

        <button
          type="button"
          class="x-image-viewer__btn"
          :aria-label="text.fit"
          :disabled="status !== 'ready' || isFit"
          @click="resetView(true)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4.5 9V6a1.5 1.5 0 0 1 1.5-1.5h3M19.5 9V6A1.5 1.5 0 0 0 18 4.5h-3M4.5 15v3A1.5 1.5 0 0 0 6 19.5h3M19.5 15v3a1.5 1.5 0 0 1-1.5 1.5h-3" />
          </svg>
          <q-tooltip :delay="500" anchor="top middle" self="bottom middle" :offset="[0, 10]">{{ text.fit }} (0)</q-tooltip>
        </button>
        <button
          v-if="rotatable"
          type="button"
          class="x-image-viewer__btn"
          :aria-label="text.rotate"
          :disabled="status !== 'ready'"
          @click="rotate"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19.5 12a7.5 7.5 0 1 1-2.3-5.4" />
            <path d="M19.6 3.9v4.4h-4.4" />
          </svg>
          <q-tooltip :delay="500" anchor="top middle" self="bottom middle" :offset="[0, 10]">{{ text.rotate }} (R)</q-tooltip>
        </button>

        <template v-if="downloadable">
          <span class="x-image-viewer__divider" aria-hidden="true" />
          <button
            type="button"
            class="x-image-viewer__btn"
            :aria-label="text.download"
            :disabled="!entry || (!entry.url && !entry.blob)"
            @click="download"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4.5v10M7.8 10.6L12 14.8l4.2-4.2M5.5 19.5h13" />
            </svg>
            <q-tooltip :delay="500" anchor="top middle" self="bottom middle" :offset="[0, 10]">{{ text.download }}</q-tooltip>
          </button>
        </template>
      </div>
    </div>
  </q-dialog>
</template>

<style>
/* Sin `scoped`: el QDialog se monta fuera del componente y hay que ganarle a su regla
   `.q-dialog__inner > div` (sombra, esquinas y scroll). Todo va con el prefijo x-image-viewer. */
.q-dialog__inner > .x-image-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
  border-radius: 0;
  box-shadow: none;
  background: rgba(11, 13, 17, 0.9);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  color: #fff;
  user-select: none;
  -webkit-user-select: none;
}

.x-image-viewer__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* Los gestos los maneja el componente: sin esto el navegador se queda con el arrastre y el pellizco. */
  touch-action: none;
}

.x-image-viewer__img {
  position: absolute;
  left: 50%;
  top: 50%;
  max-width: none;
  max-height: none;
  transform-origin: center center;
  opacity: 0;
  cursor: zoom-in;
  border-radius: 2px;
  box-shadow: 0 16px 56px rgba(0, 0, 0, 0.5);
  transition: opacity 0.18s ease;
  -webkit-user-drag: none;
}

.x-image-viewer__img--ready {
  opacity: 1;
}

.x-image-viewer__img--smooth {
  transition: opacity 0.18s ease, transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.x-image-viewer--zoomed .x-image-viewer__img {
  cursor: grab;
}

.x-image-viewer--dragging .x-image-viewer__img {
  cursor: grabbing;
}

/* ── Cargando, error ─────────────────────────────────────────────────────── */
.x-image-viewer__state {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: min(360px, 80vw);
  text-align: center;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.86);
}

.x-image-viewer__spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(255, 255, 255, 0.18);
  border-top-color: #fff;
  border-radius: 50%;
  animation: x-image-viewer-spin 0.8s linear infinite;
}

.x-image-viewer__state-icon {
  width: 38px;
  height: 38px;
  fill: none;
  stroke: rgba(255, 255, 255, 0.7);
  stroke-width: 1.6;
  stroke-linecap: round;
}

.x-image-viewer__state-actions {
  display: flex;
  gap: 8px;
}

/* ── Botones ─────────────────────────────────────────────────────────────── */
.x-image-viewer__btn,
.x-image-viewer__nav,
.x-image-viewer__pill {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  color: #fff;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  transition: background-color 0.15s ease, transform 0.1s ease, opacity 0.15s ease;
}

.x-image-viewer__btn {
  width: 38px;
  height: 38px;
  border-radius: 999px;
}

.x-image-viewer__btn svg,
.x-image-viewer__nav svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.x-image-viewer__btn:hover:not(:disabled),
.x-image-viewer__nav:hover:not(:disabled),
.x-image-viewer__pill:hover {
  background: rgba(255, 255, 255, 0.16);
}

.x-image-viewer__btn:active:not(:disabled),
.x-image-viewer__nav:active:not(:disabled),
.x-image-viewer__pill:active {
  transform: scale(0.94);
}

.x-image-viewer__btn:focus-visible,
.x-image-viewer__nav:focus-visible,
.x-image-viewer__pill:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.85);
  outline-offset: 2px;
}

.x-image-viewer__btn:disabled,
.x-image-viewer__nav:disabled {
  opacity: 0.32;
  cursor: default;
}

.x-image-viewer__btn--close {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
}

.x-image-viewer__btn--percent {
  width: auto;
  min-width: 60px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.x-image-viewer__pill {
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 600;
}

/* ── Título y X ──────────────────────────────────────────────────────────── */
.x-image-viewer__top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 16px 36px 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.38) 55%, rgba(0, 0, 0, 0));
  /* La franja deja pasar los gestos al escenario; solo sus botones reciben el clic. */
  pointer-events: none;
}

.x-image-viewer__titles {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 2px;
}

.x-image-viewer__title,
.x-image-viewer__subtitle {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.x-image-viewer__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.x-image-viewer__subtitle {
  margin-top: 2px;
  font-size: 13px;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.76);
}

.x-image-viewer__top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  pointer-events: auto;
}

.x-image-viewer__counter {
  padding: 6px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ── Flechas ─────────────────────────────────────────────────────────────── */
.x-image-viewer__nav {
  position: absolute;
  top: 50%;
  width: 44px;
  height: 44px;
  margin-top: -22px;
  border-radius: 999px;
  background: rgba(30, 32, 38, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.x-image-viewer__nav--prev {
  left: calc(16px + env(safe-area-inset-left, 0px));
}

.x-image-viewer__nav--next {
  right: calc(16px + env(safe-area-inset-right, 0px));
}

/* ── Barra de herramientas ───────────────────────────────────────────────── */
.x-image-viewer__toolbar {
  position: absolute;
  left: 50%;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px 6px;
  border-radius: 999px;
  background: rgba(30, 32, 38, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
}

.x-image-viewer__divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.14);
}

@media (max-width: 599px) {
  .x-image-viewer__nav {
    width: 38px;
    height: 38px;
    margin-top: -19px;
  }

  .x-image-viewer__nav--prev {
    left: calc(8px + env(safe-area-inset-left, 0px));
  }

  .x-image-viewer__nav--next {
    right: calc(8px + env(safe-area-inset-right, 0px));
  }
}

@keyframes x-image-viewer-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Quien pidió menos movimiento ve el cambio sin desplazamientos animados. */
@media (prefers-reduced-motion: reduce) {
  .x-image-viewer__img,
  .x-image-viewer__img--smooth,
  .x-image-viewer__btn,
  .x-image-viewer__nav,
  .x-image-viewer__pill {
    transition: none;
  }

  .x-image-viewer__spinner {
    animation-duration: 1.8s;
  }
}
</style>
