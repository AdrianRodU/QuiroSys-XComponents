<script setup>
/**
 * XHelpTip — ícono "?" de ayuda con tooltip informativo. Reemplaza descripciones
 * inline largas por un ícono discreto junto al label de un campo.
 *
 * Uso:
 *   <XHelpTip text="El precio ya trae el IGV incluido." />
 *   <XHelpTip>contenido por slot</XHelpTip>
 *
 * Los componentes de formulario (XInput, XSelect, XCheckbox) lo montan solos vía
 * su prop `help`; también se puede usar suelto.
 *
 * En el celular (v2.23.0): el q-tooltip se abría al tocar y se cerraba al levantar el
 * dedo, así que la ayuda no se alcanzaba a leer. En dispositivos móviles se usa un
 * q-menu con la misma burbuja: se abre con un toque y se cierra al tocar fuera. El
 * toque no llega al campo o casilla que contiene el "?". En escritorio sigue el
 * tooltip al pasar el mouse.
 *
 * Dentro de un campo (v2.24.0): la etiqueta flotante de XInput y XSelect es la de
 * QField, que Quasar marca con `no-pointer-events`. El "?" heredaba esa marca y el
 * mouse caía en el input de abajo, así que el tooltip nunca se abría. El ícono vuelve
 * a recibir el mouse (pointer-events: auto) y su clic, en escritorio y en el celular,
 * solo muestra la ayuda: no enfoca el campo ni marca la casilla que lo contiene.
 */
import { computed } from 'vue'
import { useQuasar } from 'quasar'

defineOptions({ name: 'XHelpTip' })

defineProps({
  text: { type: String, default: '' },
  icon: { type: String, default: 'fa-regular fa-circle-question' },
  size: { type: String, default: '15px' },
  maxWidth: { type: String, default: '260px' },
})

const $q = useQuasar()
const isTouch = computed(() => $q.platform.is.mobile === true)

// El clic o el toque solo abre la ayuda: no marca la casilla ni enfoca el campo del label (la
// raíz de QField es un <label>, y un clic dentro de él enfoca su input).
function onClick(evt) {
  evt.stopPropagation()
  evt.preventDefault()
}

// El mouse no le da el foco al "?": QField se pinta enfocado cuando algo suyo lo recibe. Con el
// teclado (tabindex) sí se alcanza.
function onMousedown(evt) {
  evt.preventDefault()
}
</script>

<template>
  <q-icon
    :name="icon"
    :size="size"
    class="x-help-tip cursor-pointer"
    tabindex="0"
    @click="onClick"
    @mousedown="onMousedown"
  >
    <q-menu
      v-if="isTouch"
      anchor="top middle"
      self="bottom middle"
      :offset="[0, 6]"
      class="x-help-tip__menu bg-grey-9 text-white"
    >
      <div class="x-help-tip__bubble" :style="{ maxWidth, whiteSpace: 'normal', lineHeight: 1.4 }">
        <slot>{{ text }}</slot>
      </div>
    </q-menu>
    <q-tooltip
      v-else
      anchor="top middle"
      self="bottom middle"
      :offset="[0, 6]"
      class="bg-grey-9 text-white"
    >
      <!-- El ancho máximo va en un div interno: el q-tooltip se teletransporta
           al body y no siempre reenvía su :style al contenido. -->
      <div class="x-help-tip__bubble" :style="{ maxWidth, whiteSpace: 'normal', lineHeight: 1.4 }">
        <slot>{{ text }}</slot>
      </div>
    </q-tooltip>
  </q-icon>
</template>

<style lang="scss" scoped>
.x-help-tip {
  // La etiqueta flotante de QField lleva `no-pointer-events`: sin esto el "?" no recibe el mouse.
  pointer-events: auto;
  color: var(--x-text-subtle, #9ca3af);
  transition: color 0.15s ease;
  &:hover,
  &:focus-visible { color: var(--x-primary-text, var(--q-primary)); }
}
.x-help-tip__bubble {
  font-size: 12px;
  line-height: 1.4;
  padding: 8px 10px;
  border-radius: 6px;
}
</style>
