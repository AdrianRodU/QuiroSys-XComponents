<script setup>
import { computed } from 'vue'
import { numberFormatDecimal } from '@esolutions/js-utils'

defineProps({
  label: { type: String, default: '' },
  price: { type: [Number, String], default: 0 },
  currencyTypeSymbol: { type: String, default: null },
  width: { type: String, default: '120px' },
  size: { type: String, default: 'sm' },
  decimal: { type: Number, default: 2 },
})
</script>

<template>
  <div class="x-format-price"
    :class="{ 'size-sm': size === 'sm', 'size-md': size === 'md' }"
    :style="{ width }">
    <div v-if="currencyTypeSymbol" class="currency-type-symbol">{{ currencyTypeSymbol }}</div>
    <div class="information">
      <div class="label">{{ label }}</div>
      <div class="price">{{ numberFormatDecimal(price, decimal) }}</div>
    </div>
  </div>
</template>

<style scoped>
.x-format-price {
  display: flex;
  align-items: center;
  border: 1px solid var(--x-border, #e0e0e0);
  border-radius: 4px;
  padding: 4px 8px;
  background: var(--x-surface-2, #fafafa);
}
.x-format-price .currency-type-symbol {
  font-weight: 600;
  margin-right: 6px;
  font-size: 13px;
}
.x-format-price .information {
  flex: 1;
}
.x-format-price .information .label {
  font-size: 10px;
  color: var(--x-text-muted, #888);
  line-height: 1.2;
}
.x-format-price .information .price {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}
.x-format-price.size-md .information .price {
  font-size: 16px;
}
</style>
