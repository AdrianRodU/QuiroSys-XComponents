<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

function onHide() {
  emit('update:modelValue', false)
}
</script>

<template>
  <q-dialog
    :model-value="modelValue"
    @hide="onHide"
    position="bottom"
    class="x-mobile-menu-action"
  >
    <q-card style="width: 100%">
      <q-card-section class="q-pa-none">
        <q-list class="rounded-borders">
          <slot></slot>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style lang="scss">
// Items del mobile menu: mismo hover que XDropdownMenu / table dropdowns.
// Se aplica a nivel global (no scoped) porque q-dialog se teleporta al body.
//
// IMPORTANTE: solo aplica hover a items clickables (q-item--clickable).
// Asi MobileLinkTitle (item informativo sin prop clickable) no recibe hover.
.x-mobile-menu-action {
  // Padding uniforme alrededor de la lista (margen interior simetrico).
  .q-list {
    padding: 8px;
  }

  .q-item--clickable {
    border-radius: 8px;
    padding: 10px 12px;
    min-height: auto;
    color: var(--x-text-2, #344054); // gray-700
    transition: background-color 0.15s ease, color 0.15s ease;

    & + .q-item--clickable {
      margin-top: 2px; // separacion entre items clickables consecutivos
    }

    &:hover {
      background-color: var(--x-surface-3, #f2f4f7); // gray-100
      color: var(--x-text, #1d2939); // gray-800

      .q-icon {
        color: var(--x-text-2, #344054);
      }
    }

    .q-item__section--avatar {
      color: var(--x-text-muted, #667085); // gray-500
    }
  }
}
</style>
