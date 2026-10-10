<script setup>
import { computed, useAttrs } from 'vue'
import { useQuasar } from 'quasar'
import VueApexCharts from 'vue3-apexcharts'
import XChartHeader from './XChartHeader.vue'
import XChartFooter from './XChartFooter.vue'

defineOptions({
  name: 'XChart',
  inheritAttrs: false,
})

const props = defineProps({
  // Header
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    default: '',
  },
  percentage: {
    type: String,
    default: '',
  },
  direction: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  iconColor: {
    type: String,
    default: 'grey-4',
  },

  // Chart
  type: {
    type: String,
    default: 'area',
  },
  series: {
    type: Array,
    default: () => [],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  colors: {
    type: Array,
    default: null,
  },
  height: {
    type: [Number, String],
    default: 350,
  },
  chartOptions: {
    type: Object,
    default: () => ({}),
  },

  // Footer
  footerLinkLabel: {
    type: String,
    default: '',
  },
  footerLinkTo: {
    type: String,
    default: '',
  },

  // State
  loading: {
    type: Boolean,
    default: false,
  },

  // Card style
  bordered: {
    type: Boolean,
    default: false,
  },
  flat: {
    type: Boolean,
    default: true,
  },
})

const attrs = useAttrs()
const $q = useQuasar()

// Modo oscuro (v2.27.0): ApexCharts pinta con atributos SVG, que no admiten var(); los colores del tema se leen de los
// tokens (themes/tokens.scss) al dibujar y el gráfico se redibuja al cambiar de modo. En claro, los de siempre.
const isDark = computed(() => $q.dark.isActive)
const themeColor = (token, light) =>
  (isDark.value && getComputedStyle(document.body).getPropertyValue(token).trim()) || light

const hasHeader = computed(() =>
  props.title || props.value || props.percentage || props.icon,
)

const hasFooter = computed(() =>
  props.footerLinkLabel || props.footerLinkTo,
)

const mergedOptions = computed(() => {
  const base = {
    chart: {
      type: props.type,
      height: props.height,
      sparkline: { enabled: false },
      toolbar: { show: false },
      zoom: { enabled: false },
      // Leyenda y textos sin color propio (en claro, el gris oscuro de ApexCharts).
      ...(isDark.value ? { foreColor: themeColor('--x-text-2', '#373d3f') } : {}),
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: props.categories,
      labels: {
        rotate: -45,
        hideOverlappingLabels: true,
        style: {
          fontSize: '11px',
          colors: themeColor('--x-text-muted', '#9CA3AF'),
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          xaxis: { tickAmount: 10 },
        },
      },
      {
        breakpoint: 600,
        options: {
          xaxis: { tickAmount: 6 },
        },
      },
    ],
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
          colors: themeColor('--x-text-muted', '#9CA3AF'),
        },
      },
    },
    grid: {
      borderColor: themeColor('--x-divider', '#F3F4F6'),
      strokeDashArray: 4,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      markers: {
        size: 5,
        shape: 'circle',
      },
      itemMargin: {
        horizontal: 10,
      },
    },
    tooltip: {
      theme: isDark.value ? 'dark' : 'light',
    },
    // El total encima de una barra apilada: ApexCharts lo pinta con su gris oscuro fijo (no sigue a foreColor).
    ...(isDark.value ? { plotOptions: { bar: { dataLabels: { total: { style: { color: themeColor('--x-text-2', '#373d3f') } } } } } } : {}),
    fill: {
      type: props.type === 'area' ? 'gradient' : 'solid',
      gradient: {
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
  }

  if (props.colors) {
    base.colors = props.colors
  }

  // Deep merge with user overrides
  return deepMerge(base, props.chartOptions)
})

function deepMerge(target, source) {
  const output = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key])
    } else {
      output[key] = source[key]
    }
  }
  return output
}
</script>

<template>
  <q-card
    v-bind="attrs"
    :bordered="bordered"
    :flat="flat"
    class="x-card"
  >
    <!-- Header -->
    <q-card-section v-if="hasHeader || $slots.header || $slots['header-right']" class="q-py-none x-card-section-title">
      <slot name="header">
        <x-chart-header
          :title="title"
          :subtitle="subtitle"
          :value="value"
          :percentage="percentage"
          :direction="direction"
          :color="color"
          :icon="icon"
          :icon-color="iconColor"
        >
          <template #actions>
            <slot name="header-right" />
          </template>
        </x-chart-header>
      </slot>
    </q-card-section>

    <!-- Extra content slot -->
    <q-card-section v-if="$slots.default" class="x-form-section-content q-pa-none">
      <slot />
    </q-card-section>

    <!-- Chart -->
    <q-card-section class="x-form-section-content q-pa-none">
      <div v-if="loading" class="x-chart-loading row justify-center items-center" :style="{ height: height + 'px' }">
        <q-spinner-dots color="primary" size="40px" />
      </div>
      <vue-apex-charts
        v-else-if="series.length > 0"
        :type="type"
        :height="height"
        :options="mergedOptions"
        :series="series"
      />
      <div
        v-else
        class="x-chart-empty row justify-center items-center text-grey-5"
        :style="{ height: height + 'px' }"
      >
        <div class="text-center">
          <q-icon name="fal fa-chart-line" size="32px" class="q-mb-sm" />
          <div class="text-caption">Sin datos disponibles</div>
        </div>
      </div>
    </q-card-section>

    <!-- Footer -->
    <template v-if="hasFooter || $slots.footer || $slots['footer-left'] || $slots['footer-right']">
      <q-separator />
      <q-card-section>
        <slot name="footer">
          <x-chart-footer
            :link-label="footerLinkLabel"
            :link-to="footerLinkTo"
          >
            <slot name="footer-left" />
            <template #right>
              <slot name="footer-right" />
            </template>
          </x-chart-footer>
        </slot>
      </q-card-section>
    </template>
  </q-card>
</template>

<style scoped>
.x-chart-loading,
.x-chart-empty {
  min-height: 200px;
}
</style>
