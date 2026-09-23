<script setup>
import XBadge from '../XBadge/XBadge.vue';

defineProps({
  cell: {type: [Object, String, Number, Boolean], default: null}
});

// Una celda-ícono con `action` se vuelve clickeable y emite la acción hacia arriba.
const emit = defineEmits(['cell-action']);
</script>

<template>
  <!-- 1. Si cell es null, undefined, string o number, mostrar directamente -->
  <span v-if="cell === null || cell === undefined || typeof cell === 'string' || typeof cell === 'number'">
    {{ cell ?? '' }}
  </span>

  <!-- 2. El resto de lógica SOLO para objetos -->
  <template v-else>
    <!-- COMPOSITE (varias líneas o elementos en línea) -->
    <template v-if="cell.type_input === 'composite'">
      <template v-for="(line, i) in cell.lines" :key="i">
        <template v-for="(el, j) in line" :key="j">
          <x-cell-renderer :cell="el" @cell-action="emit('cell-action', $event)"/>
        </template>
        <br v-if="i < cell.lines.length - 1"/>
      </template>
    </template>

    <!-- MULTI-LINE SOLO TEXTO -->
    <template v-else-if="cell.type_input === 'multi_line'">
      <template v-for="(line, i) in cell.value" :key="i">
        <span>{{ line }}</span><br v-if="i < cell.value.length - 1"/>
      </template>
    </template>

    <!-- TEXTO (con estilos) -->
    <span v-else-if="cell.type_input === 'text'"
          :style="{
          color: cell.color || undefined,
          fontSize: cell.size || undefined,
          fontWeight: cell.bold ? 'bold' : undefined
        }">
    {{ cell.value }}
  </span>

    <!-- BADGE -->
    <x-badge v-else-if="cell.type_input === 'badge'"
             :color="cell.color"
             :type="cell.type"
             :label="cell.label"
             :title="cell.value"
             :is-lighten-color="cell.is_lighten_color"
             :variant="cell.variant || 'light'"
             :icon="cell.icon || null"
             :icon-position="cell.icon_position || 'left'"
             :class="['q-mx-xs x-badge', { 'cursor-pointer': cell.action }]"
             @click="cell.action && emit('cell-action', cell.action)"></x-badge>

    <!-- CHIP -->
    <q-chip v-else-if="cell.type_input === 'chip'"
            :color="cell.color || 'primary'"
            :icon="cell.icon || undefined"
            text-color="white"
            dense
            class="q-mx-xs">
      {{ cell.label }}
    </q-chip>

    <!-- ÍCONO (clickeable si trae `action`) -->
    <q-icon v-else-if="cell.type_input === 'icon'"
            :name="cell.icon"
            :color="cell.color || undefined"
            :title="cell.tooltip || undefined"
            :size="cell.size || undefined"
            :class="['q-mx-xs', { 'cursor-pointer': cell.action }]"
            @click="cell.action && emit('cell-action', cell.action)"/>

    <!-- AVATAR -->
    <q-avatar v-else-if="cell.type_input === 'avatar'"
              :size="cell.size || '32px'"
              class="q-mx-xs">
      <img :src="cell.src" :alt="cell.alt || ''" />
    </q-avatar>

    <!-- IMAGE (rectangular, object-fit contain) -->
    <div v-else-if="cell.type_input === 'image'"
         class="x-cell-image"
         :style="{
           width:  cell.width  || '64px',
           height: cell.height || '36px',
         }">
      <img
        :src="cell.src"
        :alt="cell.alt || ''"
        :style="{ borderRadius: cell.radius || '4px' }"
      />
    </div>

    <!-- LINK. Opcionales (v2.10.1): tooltip (q-tooltip), color Quasar del texto
         e icono (`text-<color>`) y underline:false para ir sin subrayado. -->
    <a v-else-if="cell.type_input === 'link'"
       :href="cell.url"
       :target="cell.target || '_self'"
       :class="['q-mx-xs', cell.color ? `text-${cell.color}` : '']"
       :style="{
         textDecoration: cell.underline === false ? 'none' : 'underline',
         display: 'inline-flex',
         alignItems: 'center',
         fontWeight: cell.underline === false ? 500 : undefined,
       }">
      <q-icon v-if="cell.icon" :name="cell.icon" class="q-mr-xs"/>
      {{ cell.label }}
      <q-tooltip v-if="cell.tooltip">{{ cell.tooltip }}</q-tooltip>
    </a>

    <!-- SWITCH (visual, solo lectura por default) -->
    <q-toggle v-else-if="cell.type_input === 'switch'"
              :model-value="cell.checked"
              :color="cell.color || 'primary'"
              :readonly="cell.readonly !== false"
              dense
              class="q-mx-xs"/>
    <!-- FALLBACK: Muestra cualquier otro valor por si acaso -->
    <span v-else>
      {{ cell.value ?? '' }}
  </span>
  </template>
</template>

<style scoped>
.x-cell-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}
.x-cell-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}
</style>
