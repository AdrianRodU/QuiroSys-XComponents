<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/services/api'
import { PDFViewer } from '@embedpdf/vue-pdf-viewer'
import XDialog from '../XDialog/XDialog.vue'

const props = defineProps({
  src: { type: String, default: '' },
  title: { type: String, default: 'Documento PDF' },
  width: { type: String, default: '80vw' },
})

const $q = useQuasar()

const isDialogOpen = ref(false)
const isLoading = ref(false)
const blobUrl = ref(null)
const hasError = ref(false)

const viewerConfig = ref({})

const openDialog = () => {
  isLoading.value = true
  hasError.value = false
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
}

const cleanup = () => {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = null
  }
  viewerConfig.value = {}
}

const handleOpen = async () => {
  if (!props.src) return

  cleanup()
  isLoading.value = true
  hasError.value = false

  try {
    const response = await api.get(props.src, { responseType: 'blob' })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    blobUrl.value = URL.createObjectURL(blob)

    viewerConfig.value = {
      src: blobUrl.value,
      theme: { preference: $q.dark.isActive ? 'dark' : 'light' },
      tabBar: 'never',
      disabledCategories: [
        'annotation',
        'redaction',
        'form',
        'stamp',
        'history',
        'capture',
        'pan',
        'search',
        'bookmark',
        'attachment',
        'selection',
        'thumbnail',
      ],
    }

    isLoading.value = false
  } catch {
    hasError.value = true
    isLoading.value = false
  }
}

const handleHide = () => {
  cleanup()
}

watch(
  () => props.src,
  (newSrc) => {
    if (newSrc && isDialogOpen.value) handleOpen()
  },
)

watch(
  () => $q.dark.isActive,
  (isDark) => {
    if (viewerConfig.value.src) {
      viewerConfig.value = { ...viewerConfig.value, theme: { preference: isDark ? 'dark' : 'light' } }
    }
  },
)

onBeforeUnmount(() => {
  cleanup()
})

defineExpose({ openDialog })
</script>

<template>
  <x-dialog
    v-model="isDialogOpen"
    :title="title"
    :width="width"
    :loading="isLoading"
    show-button-close
    content-flush
    full-screen
    @action-button-close="closeDialog"
    @before-show="handleOpen"
    @hide="handleHide"
  >
    <template #content>
      <PDFViewer
        v-if="blobUrl && !hasError"
        :config="viewerConfig"
        :style="{ width: '100%', height: '100%' }"
      />

      <div v-else-if="hasError" class="x-pdf-viewer__empty">
        <q-icon name="fal fa-file-pdf" size="48px" color="grey-5" />
        <div class="text-grey-6 q-mt-sm">{{ $t('components.pdfLoadError') }}</div>
      </div>
    </template>
  </x-dialog>
</template>
