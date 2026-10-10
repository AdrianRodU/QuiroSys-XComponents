<script setup>
import { inject, computed } from 'vue'

defineOptions({
  name: 'XOptionCard',
})

const props = defineProps({
  value: {
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  disable: {
    type: Boolean,
    default: false,
  },
})

const group = inject('xOptionCardGroup', null)

const isSelected = computed(() =>
  group ? group.modelValue.value === props.value : false
)

const select = () => {
  if (!props.disable && group) {
    group.select(props.value)
  }
}
</script>

<template>
  <div
    class="x-option-card"
    :class="{
      'x-option-card--active': isSelected,
      'x-option-card--disabled': disable,
    }"
    @click="select"
  >
    <div class="x-option-card__header">
      <q-icon
        :name="isSelected ? 'fal fa-circle-check' : 'fal fa-circle'"
        :color="isSelected ? 'primary' : 'grey-5'"
        size="18px"
      />
      <span class="x-option-card__label">{{ label }}</span>
    </div>
    <div v-if="description" class="x-option-card__desc">{{ description }}</div>
    <slot />
  </div>
</template>

<style scoped>
.x-option-card {
  border: 2px solid var(--x-border, #e5e7eb);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  background: var(--x-surface, #ffffff);
  user-select: none;
}

.x-option-card:hover {
  border-color: var(--x-tone-blue-border, #93c5fd);
  background: rgba(37, 99, 235, 0.03);
}

.x-option-card--active {
  border-color: var(--q-primary, #1976d2);
  background: rgba(37, 99, 235, 0.05);
}

.x-option-card--active:hover {
  border-color: var(--q-primary, #1976d2);
  background: rgba(37, 99, 235, 0.08);
}

.x-option-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.x-option-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.x-option-card__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--x-text, #111827);
  line-height: 1.3;
}

.x-option-card__desc {
  font-size: 12px;
  color: var(--x-text-muted, #6b7280);
  line-height: 1.4;
  margin-top: 2px;
  padding-left: 26px;
}
</style>
