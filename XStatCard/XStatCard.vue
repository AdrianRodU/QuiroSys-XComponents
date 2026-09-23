<script setup>
/**
 * XStatCard — tarjeta de UN número para dashboards: ícono, título, valor
 * grande, un chip de contexto o de variación frente al período anterior, un
 * texto chico y la ayuda "?" con la definición del número.
 *
 * Uso:
 *   <XStatCard
 *     icon="fa-light fa-users" tone="primary" title="Pacientes que vinieron"
 *     :value="61" delta="4 %" delta-tone="positive" delta-icon="up"
 *     caption="96 atenciones en total" help="Pacientes distintos atendidos."
 *   />
 *
 * Se arma sobre q-card flat bordered para verse igual que el resto de las
 * tarjetas del tema. El valor null se pinta como "—" (sin dato, no cero).
 */
import XHelpTip from '../XHelpTip/XHelpTip.vue'

defineOptions({ name: 'XStatCard' })

defineProps({
  title: { type: String, default: '' },
  value: { type: [String, Number], default: null },
  icon: { type: String, default: '' },
  // Tono del ícono: primary | purple | orange | green | red | amber | teal | grey
  tone: { type: String, default: 'primary' },
  // Chip junto al valor: una variación ("4 %") o un contexto ("5 de 7 R2").
  delta: { type: String, default: '' },
  // positive | negative | warning | neutral
  deltaTone: { type: String, default: 'neutral' },
  // 'up' | 'down' | '' — flecha dentro del chip.
  deltaIcon: { type: String, default: '' },
  caption: { type: String, default: '' },
  help: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <q-card flat bordered class="x-stat-card">
    <q-card-section class="x-stat-card__body">
      <div class="x-stat-card__head">
        <span v-if="icon" class="x-stat-card__icon" :class="`x-stat-card__icon--${tone}`">
          <q-icon :name="icon" size="17px" />
        </span>
        <div class="x-stat-card__title">{{ title }}</div>
        <x-help-tip v-if="help" :text="help" class="x-stat-card__help" />
      </div>

      <template v-if="loading">
        <q-skeleton type="rect" width="45%" height="34px" class="q-mt-xs" />
        <q-skeleton type="text" width="85%" />
      </template>
      <template v-else>
        <div class="x-stat-card__value-row">
          <span class="x-stat-card__value">{{ value === null || value === undefined || value === '' ? '—' : value }}</span>
          <span
            v-if="delta"
            class="x-stat-card__delta"
            :class="`x-stat-card__delta--${deltaTone}`"
          >
            <q-icon
              v-if="deltaIcon"
              :name="deltaIcon === 'down' ? 'fa-solid fa-arrow-trend-down' : 'fa-solid fa-arrow-trend-up'"
              size="11px"
            />
            {{ delta }}
          </span>
        </div>
        <div v-if="caption || $slots.default" class="x-stat-card__caption">
          <slot>{{ caption }}</slot>
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<style lang="scss" scoped>
.x-stat-card {
  height: 100%;
}

.x-stat-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.x-stat-card__head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.x-stat-card__icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

// Fondo claro + ícono oscuro del mismo matiz (contraste AA en el ícono).
.x-stat-card__icon--primary { background: rgba(26, 86, 219, .1); color: var(--q-primary); }
.x-stat-card__icon--purple { background: #f3e5f5; color: #7b1fa2; }
.x-stat-card__icon--orange { background: #fff3e0; color: #e65100; }
.x-stat-card__icon--green { background: #e7f8ee; color: #15803d; }
.x-stat-card__icon--red { background: #fdecec; color: #b91c1c; }
.x-stat-card__icon--amber { background: #fef3c7; color: #a16207; }
.x-stat-card__icon--teal { background: #e0f2f1; color: #00796b; }
.x-stat-card__icon--grey { background: #f1f5f9; color: #475569; }

.x-stat-card__title {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  line-height: 1.25;
}

.x-stat-card__help {
  margin-left: auto;
}

.x-stat-card__value-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
}

.x-stat-card__value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: #0f172a;
}

.x-stat-card__delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.x-stat-card__delta--positive { background: #dcfce7; color: #15803d; }
.x-stat-card__delta--negative { background: #fee2e2; color: #b91c1c; }
.x-stat-card__delta--warning { background: #fef3c7; color: #92400e; }
.x-stat-card__delta--neutral { background: #f1f5f9; color: #475569; }

.x-stat-card__caption {
  font-size: 13px;
  line-height: 1.4;
  color: #64748b;
}
</style>
