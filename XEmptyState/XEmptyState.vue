<script setup>
/**
 * XEmptyState — el estado vacío de la casa fuera de una tabla (v2.36.0): ícono, título, texto y botones, con el mismo
 * aspecto que el vacío de XTable y XTableServer. Para pantallas que no son tablas (un calendario, un panel, una lista
 * propia) cuando no hay nada que mostrar (Adrián 15/11/2026, revisión de Presencia del personal: el vacío era una línea
 * de texto gris y, para que se viera como el resto, había que copiar el estilo de XTable en la pantalla).
 *
 * Uso:
 *   <XEmptyState
 *     icon="fa-light fa-users"
 *     title="Todavía no hay personal en Presencia"
 *     subtitle="Usa «Sincronizar personal» para traer las fichas de las dos empresas."
 *   >
 *     <template #actions>
 *       <XButton outline color="primary" icon="sync" label="Sincronizar personal" @click="sync" />
 *     </template>
 *   </XEmptyState>
 *
 * El slot por defecto reemplaza al subtítulo (texto con formato); `icon` y `title` también tienen slot.
 */
defineOptions({ name: 'XEmptyState' })

defineProps({
  /** Ícono grande arriba (Font Awesome o Material). Vacío = sin ícono. */
  icon: { type: String, default: 'fa-light fa-inbox' },
  /** Lo que pasa, en una línea ("Todavía no hay personal en Presencia"). */
  title: { type: String, default: '' },
  /** Qué hacer, en una o dos líneas ("Usa «Sincronizar personal»…"). */
  subtitle: { type: String, default: '' },
  /** Menos aire e ícono más chico, para tarjetas pequeñas. */
  dense: { type: Boolean, default: false },
})
</script>

<template>
  <div class="x-empty-state" :class="{ 'x-empty-state--dense': dense }">
    <slot name="icon">
      <q-icon v-if="icon" :name="icon" :size="dense ? '36px' : '48px'" class="x-empty-state__icon" />
    </slot>
    <div v-if="title || $slots.title" class="x-empty-state__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div v-if="subtitle || $slots.default" class="x-empty-state__subtitle">
      <slot>{{ subtitle }}</slot>
    </div>
    <div v-if="$slots.actions" class="x-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/* Los mismos valores que el vacío de XTable (XTable.scss) y XTableServer, con los tokens del modo oscuro. */
.x-empty-state {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
}
.x-empty-state--dense {
  padding: 20px 16px;
}
.x-empty-state__icon {
  color: var(--x-text-subtle, #d0d5dd);
  margin-bottom: 12px;
}
.x-empty-state__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--x-text, #1d2939);
  margin-bottom: 4px;
}
.x-empty-state__subtitle {
  font-size: 13px;
  color: var(--x-text-muted, #667085);
  max-width: 320px;
  line-height: 1.5;
}
.x-empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}
</style>
