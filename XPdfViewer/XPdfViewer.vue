<template>
  <div class="x-pdf-viewer">
    <!-- Header custom: filename + boton cerrar. -->
    <div v-if="showHeader" class="x-pdf-header">
      <span v-if="filename" class="x-pdf-header__filename" :title="filename">
        {{ filename }}
      </span>
      <div class="x-pdf-header__spacer"></div>
      <button
        v-if="!hideClose"
        class="x-pdf-header__btn x-pdf-header__btn--close"
        title="Cerrar"
        type="button"
        @click="$emit('close')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- Motor: PDFium via WebAssembly (embedpdf). Corre dentro de shadow DOM,
         por eso ocultamos elementos del toolbar interno via `disabledCategories`
         del config — el CSS externo no penetra el shadow.

         :key también incluye `zoom` es necesario: PDFViewer carga el documento
         (y aplica el zoom inicial) una sola vez al montarse, no reacciona a
         que `config` cambie con el componente ya montado (visto al cambiar de
         formato con el selector: el filename y el botón activo se
         actualizaban, pero el PDF mostrado seguía siendo el anterior).
         Forzar la key remonta el visor entero con cada `src`/`zoom` nuevo,
         garantizando que siempre cargue el documento y el zoom correctos. -->
    <div class="x-pdf-viewer__viewport" ref="viewportRef">
      <PDFViewer v-if="src" :key="`${src}::${zoom}::${$q.dark.isActive}`" :config="config" style="width: 100%; height: 100%" @ready="onEmbedReady" />
      <div v-else class="x-pdf-viewer__empty">Sin PDF seleccionado</div>

      <div v-if="showActions" class="x-pdf-actions">
        <div v-if="formats.length > 1" class="x-pdf-actions__formats" role="group" aria-label="Formato del PDF">
          <button
            v-for="f in formats"
            :key="f.value"
            type="button"
            class="x-pdf-actions__format-btn"
            :class="{ 'x-pdf-actions__format-btn--active': f.value === activeFormat }"
            :title="f.label"
            @click="$emit('update:activeFormat', f.value)"
          >
            {{ f.label }}
          </button>
        </div>

        <button
          v-if="!hidePrint"
          class="x-pdf-actions__btn"
          :disabled="busy"
          :title="filename ? `Imprimir ${filename}` : 'Imprimir'"
          type="button"
          @click="printPdf"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
        </button>

        <button
          v-if="!hideDownload"
          class="x-pdf-actions__btn"
          :disabled="busy"
          :title="filename ? `Descargar ${filename}` : 'Descargar'"
          type="button"
          @click="downloadPdf"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { PDFViewer } from '@embedpdf/vue-pdf-viewer'

/**
 * XPdfViewer — visor PDF basado en @embedpdf/vue-pdf-viewer (PDFium WASM).
 *
 * v2.4.7 —
 *   - Se apagan `document-menu`, `page-settings`, `ui-menu`, `mode` via
 *     disabledCategories (el shadow DOM del componente respeta data-epdf-dis
 *     y las reglas CSS auto-generadas ocultan cada `[data-epdf-cat~="..."]`).
 *   - Botones Print/Download: 32×32, padding 5px, alineados a `top: 8px`
 *     para coincidir vertical con la fila del toolbar interno.
 */

const emit = defineEmits(['close', 'update:activeFormat'])

const props = defineProps({
  // — Contenido —
  src:          { type: String, required: true },
  filename:     { type: String, default: 'documento.pdf' },

  // — Header —
  showHeader:   { type: Boolean, default: true },
  hideClose:    { type: Boolean, default: false },

  // — Overlay Print/Download —
  showActions:  { type: Boolean, default: true },
  hidePrint:    { type: Boolean, default: false },
  hideDownload: { type: Boolean, default: false },

  // — Selector de formato (A4/Ticket/A5...) — un botón por opción, a la
  // izquierda de Imprimir. El componente NO regenera el PDF: solo avisa
  // (update:activeFormat) cuál se eligió; quien lo usa decide cómo volver a
  // pedirlo y actualiza `src`. Sin formats o con un solo valor, no se pinta
  // nada — cero impacto en los consumidores que no lo usan.
  formats:      { type: Array, default: () => [] }, // [{ value, label }]
  activeFormat: { type: String, default: null },

  // — Zoom inicial del documento — acepta 'fit-width' | 'fit-page' |
  // 'automatic' (ZoomMode de embedpdf) o un número como factor (2 = 200%).
  // Necesario porque 'fit-width' se ve bien en A4 pero es enorme en un
  // ticket (70mm de ancho): quien consume el visor decide el zoom según el
  // formato activo (p. ej. dentro de cada entrada de `formats`).
  zoom:         { type: [String, Number], default: 'fit-width' },

  // — Toolbar embedpdf (features off por default, opt-in) —
  showDocumentMenu: { type: Boolean, default: false }, // hamburger izquierdo
  showPageSettings: { type: Boolean, default: false }, // page-settings icon
  showModeTabs:     { type: Boolean, default: false }, // View / Annotate / Shapes...
  showOverflowMenu: { type: Boolean, default: false }, // 3 dots overflow
  showSearch:       { type: Boolean, default: false }, // panel-search
  showSidebar:      { type: Boolean, default: false }, // panel-sidebar + panel-comment
  showAnnotations:  { type: Boolean, default: false }, // annotation + annotation-shape
  showForms:        { type: Boolean, default: false }, // form
  showRedaction:    { type: Boolean, default: false }, // redaction + security
  showRotate:       { type: Boolean, default: false }, // page-rotate
  showCapture:      { type: Boolean, default: false }, // document-capture + tools-capture
  showInsert:       { type: Boolean, default: false }, // insert
})

const $q = useQuasar()

const config = computed(() => {
  // Print + Export SIEMPRE off (los reemplazamos con nuestros botones custom).
  const off = ['document-print', 'document-export']

  // Elementos del main-toolbar sin categoria oficial de negocio pero
  // agrupables por su data-epdf-cat.
  if (!props.showDocumentMenu) off.push('document-menu')
  if (!props.showPageSettings) off.push('page-settings')
  if (!props.showModeTabs)     off.push('mode')            // View/Annotate/...
  if (!props.showOverflowMenu) off.push('ui-menu')         // 3 dots

  if (!props.showSearch)       off.push('panel-search')
  if (!props.showSidebar)      off.push('panel-sidebar', 'panel-comment')
  if (!props.showAnnotations)  off.push('annotation', 'annotation-shape')
  if (!props.showForms)        off.push('form')
  if (!props.showRedaction)    off.push('redaction', 'security')
  if (!props.showRotate)       off.push('page-rotate')
  if (!props.showCapture)      off.push('document-capture', 'tools-capture')
  if (!props.showInsert)       off.push('insert')

  return {
    src: props.src,
    disabledCategories: off,
    // Sigue el theme de la app (Quasar), no el del SO — ver `:key` de
    // <PDFViewer> más abajo: embedpdf solo aplica el theme al montar.
    theme: { preference: $q.dark.isActive ? 'dark' : 'light' },
    zoom: {
      // Bug verificado en @embedpdf/plugin-zoom (v2.14.4, dist/index.js,
      // método ZoomPlugin.recalcAuto): al terminar de cargar el documento,
      // solo dispara la aplicación real del zoom si `zoomLevel` es un modo
      // (ZoomMode.Automatic/FitPage/FitWidth) — un número queda guardado en
      // el estado pero NUNCA se aplica al viewport, dejando el visor
      // completamente en blanco. Por eso acá siempre se carga con un modo
      // seguro; si `zoom` es un número, se aplica después "a mano" con
      // requestZoom() en onEmbedReady (ese método sí funciona con números,
      // no pasa por recalcAuto).
      defaultZoomLevel: typeof props.zoom === 'number' ? 'automatic' : props.zoom,
    },
  }
})

const busy = ref(false)
const viewportRef = ref(null)

/**
 * Inyecta un <style> dentro del shadowRoot del <embedpdf-container> para
 * ocultar bloques del toolbar interno que no tienen data-epdf-cat propia.
 *
 * IMPORTANTE — sobre @init:
 *   @PDFViewer emit("init", viewer) NO pasa el HTMLElement — pasa el
 *   VIEWER OBJECT (retorno de EmbedPDF.init()). Por eso `viewer.shadowRoot`
 *   es undefined. Este bug estuvo activo en v2.4.7 → v2.4.10.
 *   Fix: usar @ready + querySelector desde nuestro propio wrapper Vue.
 *
 * Estructura del main-toolbar de embedpdf:
 *   left-group  → document-menu, sidebar, overflow-menu, page-settings
 *   divider-2   → separador entre left y center
 *   center-group → zoom + pan + pointer (SIEMPRE visible)
 *   spacer-1
 *   mode-select-button + mode-tabs → View/Annotate/Shapes/Insert/Form/Redact
 *   spacer-2
 *   right-group → search + comment
 */
function onEmbedReady(registry) {
  nextTick(() => injectShadowStyles())
  if (typeof props.zoom === 'number') {
    applyNumericZoom(registry)
  }
}

/**
 * Workaround del bug descrito arriba en `config`: aplica el zoom numérico
 * "a mano" vía la capability del plugin de zoom (requestZoom sí funciona
 * con números — no pasa por el recalcAuto que los ignora).
 *
 * requestZoom() internamente no-opea EN SILENCIO (sin lanzar excepción) si
 * el viewport todavía mide 0x0 justo después de "ready" — visto en vivo:
 * la llamada "funcionaba" (sin catch) pero el zoom quedaba en el que puso
 * el modo 'automatic' inicial, no en el número pedido. Por eso acá no basta
 * con reintentar solo ante una excepción: hay que confirmar con getState()
 * que currentZoomLevel realmente cambió, y reintentar si no.
 */
function applyNumericZoom(registry, retriesLeft = 15) {
  try {
    const capability = registry?.getPlugin?.('zoom')?.provides?.()
    if (!capability) throw new Error('zoom capability aún no disponible')
    capability.requestZoom(props.zoom)
    const applied = capability.getState?.()?.currentZoomLevel
    const appliedOk = typeof applied === 'number' && Math.abs(applied - props.zoom) < 0.05
    if (appliedOk) {
      scrollToTop(registry)
      return
    }
    throw new Error(`requestZoom no-opeó (currentZoomLevel=${applied}, esperado=${props.zoom})`)
  } catch (e) {
    if (retriesLeft > 0) {
      setTimeout(() => applyNumericZoom(registry, retriesLeft - 1), 150)
    } else {
      console.warn('[XPdfViewer] no se pudo aplicar el zoom numérico:', e)
    }
  }
}

/**
 * requestZoom(level, center) sin `center` mantiene el foco vertical en el
 * CENTRO del viewport (default interno de embedpdf: VerticalZoomFocus.Center),
 * a diferencia de la carga inicial en modo automático/fit-*, que sí explicita
 * VerticalZoomFocus.Top — por eso al pasar a un zoom numérico la vista no
 * arrancaba en el inicio de la hoja. La capability pública no expone ese
 * parámetro, así que se corrige forzando el scroll al origen después.
 *
 * Un solo scrollTo() no bastó: el propio cambio de zoom recalcula scroll
 * internamente de forma asíncrona (rAF/resize) y esa recentrada tardía podía
 * llegar DESPUÉS del scrollTo() y pisarlo, dejando la vista centrada otra
 * vez. Por eso se reafirma varias veces en una ventana corta — no hay forma
 * de saber desde afuera cuándo terminó el recálculo interno de embedpdf.
 */
function scrollToTop(registry, attemptsLeft = 8) {
  try {
    registry?.getPlugin?.('viewport')?.provides?.()?.scrollTo({ x: 0, y: 0, behavior: 'instant' })
  } catch (e) {
    console.warn('[XPdfViewer] no se pudo posicionar el scroll al inicio:', e)
    return
  }
  if (attemptsLeft > 0) {
    setTimeout(() => scrollToTop(registry, attemptsLeft - 1), 100)
  }
}

function injectShadowStyles(retriesLeft = 5) {
  const container = viewportRef.value?.querySelector('embedpdf-container')
  const shadow = container?.shadowRoot

  if (!shadow) {
    if (retriesLeft > 0) {
      setTimeout(() => injectShadowStyles(retriesLeft - 1), 150)
    }
    return
  }

  // Evitar duplicar si ya se inyecto (por remontajes).
  if (shadow.querySelector('style[data-x-pdf-viewer="overrides"]')) return

  const rules = []

  if (!props.showDocumentMenu && !props.showPageSettings
      && !props.showSidebar && !props.showOverflowMenu) {
    rules.push('[data-epdf-i="left-group"]{display:none!important;}')
    rules.push('[data-epdf-i="divider-2"]{display:none!important;}')
  }

  if (!props.showSearch && !props.showSidebar) {
    rules.push('[data-epdf-i="right-group"]{display:none!important;}')
  }

  if (!props.showModeTabs) {
    rules.push('[data-epdf-i="mode-tabs"]{display:none!important;}')
    rules.push('[data-epdf-i="mode-select-button"]{display:none!important;}')
  }

  if (!rules.length) return

  const style = document.createElement('style')
  style.setAttribute('data-x-pdf-viewer', 'overrides')
  style.textContent = rules.join('\n')
  shadow.appendChild(style)
}

async function downloadPdf() {
  if (!props.src) return
  busy.value = true
  let objUrl = null
  try {
    const res = await fetch(props.src, { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = props.filename || 'documento.pdf'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch (e) {
    console.error('[XPdfViewer] download failed:', e)
  } finally {
    busy.value = false
    if (objUrl) setTimeout(() => URL.revokeObjectURL(objUrl), 5000)
  }
}

function printPdf() {
  if (!props.src) return
  busy.value = true
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('aria-hidden', 'true')
  iframe.src = props.src
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch (e) {
      console.warn('[XPdfViewer] print failed:', e)
    } finally {
      busy.value = false
    }
  }
  iframe.onerror = () => {
    busy.value = false
    console.error('[XPdfViewer] iframe error for print')
    iframe.remove()
  }
  document.body.appendChild(iframe)
  setTimeout(() => iframe.remove(), 60000)
}
</script>

<style lang="scss">
.x-pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f3f4f6; /* --ep-background-app: coincide con fondo del visor embedpdf */
  overflow: hidden;
}

/* Header con filename + close — replica los tokens visuales de XDialog:
   height 60px, padding 16px, filename 20px/600, boton cerrar round 32px
   con hover gray-100 (#f2f4f7) + gray-800 (#1d2939). */
.x-pdf-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 16px;
  background: #fafafa;
  color: inherit;
  border-bottom: 1px solid rgba(0, 0, 0, 0.24);

  &__filename {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
    color: #1d2939;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__spacer { display: none; }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    margin-left: 8px;
    border: none;
    border-radius: 50%; /* q-btn round */
    background: transparent;
    color: #757575; /* $x-text-secondary */
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover:not(:disabled) {
      background: #f2f4f7; /* gray-100 */
      color: #1d2939;      /* gray-800 */
    }
  }
}

.x-pdf-viewer__viewport {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.x-pdf-viewer__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
  font-size: 14px;
}

/* Overlay Print/Download — mismos tamanos y estilo del toolbar embedpdf
   (32x32, radius 6px, hover #f3f4f6). El toolbar interno usa `py-2 px-4`
   (padding vertical 8px) + botones 32px, altura total 48px. Nuestro overlay
   con top: 8px alinea centro vertical con los botones internos. */
.x-pdf-actions {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    padding: 5px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #111827; /* --ep-foreground-primary */
    cursor: pointer;
    transition: background 0.12s, box-shadow 0.12s;

    &:hover:not(:disabled) {
      background: #f3f4f6; /* --ep-interactive-hover */
      box-shadow: 0 0 0 1px #3b82f6; /* ring-accent */
    }

    &:active:not(:disabled) {
      background: #e5e7eb; /* --ep-interactive-active */
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  /* Selector de formato: segmented control compacto, misma altura visual
     que los botones 32x32 de al lado (28px + 2px de padding del wrapper). */
  &__formats {
    display: flex;
    align-items: center;
    gap: 2px;
    background: #f3f4f6; /* --ep-interactive-hover */
    border-radius: 6px;
    padding: 2px;
    margin-right: 4px;
  }

  &__format-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    padding: 0 10px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;

    &:hover {
      color: #111827; /* --ep-foreground-primary */
    }

    &--active {
      background: #ffffff;
      color: #111827;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }
  }
}
</style>
