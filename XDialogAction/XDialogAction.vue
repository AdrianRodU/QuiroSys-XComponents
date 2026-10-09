<script setup>
import {computed, getCurrentInstance, nextTick, ref} from 'vue';
import {useQuasar} from 'quasar';
import XInput from '../XInput/XInput.vue';
import XDialog from '../XDialog/XDialog.vue';
import XButton from '../XButton/XButton.vue';

// Define las opciones del componente
defineOptions({
  name: 'XDialogAction',
  inheritAttrs: false,
});


// Props del componente
const props = defineProps({
  resource: {type: String, required: true},
  recordId: null,
  action: {type: String, required: true},
  // Campos que se suman al POST (v2.25.0): el interruptor "Activo" de XTableServer manda el valor que pidió
  // ({ is_active: false }), así el servidor guarda ese y no invierte el que tenga en ese momento.
  extraData: {type: Object, default: () => ({})}
});

// Normaliza los colores que llegan del backend a tokens semanticos del theme.
// Mapeo: 'red' -> danger, 'green' -> success, 'primary' -> primary, etc.
const iconVariant = computed(() => {
  const c = (form.value?.icon_color || 'primary').toLowerCase()
  if (['red', 'negative', 'danger', 'error'].includes(c)) return 'danger'
  if (['green', 'positive', 'success'].includes(c)) return 'success'
  if (['orange', 'warning', 'yellow'].includes(c)) return 'warning'
  if (['blue', 'info'].includes(c)) return 'info'
  if (['grey', 'gray', 'neutral'].includes(c)) return 'neutral'
  return 'primary'
})

// Eventos que puede emitir este componente
const emit = defineEmits(['success']);

const { proxy } = getCurrentInstance();
// Quasar instance
const $q = useQuasar();

// Estados reactivos
const isDialogOpen = ref(false);
const loading = ref(false);
const refPasswordInput = ref(null);
const loadingSubmit = ref(false);
const title = ref('');
const errors = ref({});
const form = ref({});

// Inicializa el formulario con valores por defecto
const initForm = () => {
  title.value = '';
  errors.value = {};
  form.value = {
    id: props.recordId,
    description: '',
    password: '',
    verify_password: false,
    button_label_submit: '',
    button_color: '',
    icon: '',
    icon_color: '',
  };
};

// Maneja apertura del diálogo y carga de datos desde el backend
const handleOpen = async () => {
  loading.value = true;
  initForm();

  let url = `/${props.resource}/record-${props.action}`;
  if (props.recordId) url += `/${props.recordId}`;

  try {
    const {data} = await proxy.$api.get(url);
    const record = data.data || data;
    title.value = record.title;
    Object.assign(form.value, {
      description: record.description,
      verify_password: record.verify_password,
      button_label_submit: record.button_label_submit,
      button_color: record.button_color,
      icon: record.icon,
      icon_color: record.icon_color,
    });
  } catch {
    $q.notify({type: 'negative', message: proxy.$t('components.dialogLoadError')});
  } finally {
    loading.value = false;
    if (form.value.verify_password) {
      nextTick(() => {
        refPasswordInput.value?.$el?.querySelector('input')?.focus();
      });
    }
  }
};

// Envío del formulario
const onSubmit = async () => {
  if (form.value.verify_password && (!form.value.password || form.value.password.length === 0)) {
    return $q.notify({type: 'error', message: proxy.$t('auth.passwordRequired')});
  }

  loading.value = true;
  loadingSubmit.value = true;

  try {
    const {data} = await proxy.$api.post(`/${props.resource}/${props.action}`, {...form.value, ...props.extraData});
    if (data.success) {
      $q.notify({type: 'success', message: data.message});
      emit('success', data.data);
      closeDialog();
    } else {
      $q.notify({type: 'error', message: data.message});
    }
  } catch (err) {
    errors.value = err.response?.data?.errors || {};
  } finally {
    loadingSubmit.value = false;
    loading.value = false;
  }
};

// Métodos para abrir y cerrar el diálogo
const openDialog = () => {
  isDialogOpen.value = true
};
const closeDialog = () => {
  isDialogOpen.value = false
};

// Expone la función para abrir el diálogo desde el padre
defineExpose({openDialog});
</script>

<template>
  <x-dialog v-model="isDialogOpen"
            :loading="loading"
            width="440px"
            @before-show="handleOpen">
    <!-- Slot: contenido del diálogo (centrado, estilo TailAdmin) -->
    <template #content>
      <div class="x-dialog-action">
        <!-- Icono dentro de circulo de color suave -->
        <div class="x-dialog-action__icon-wrap" :class="`x-dialog-action__icon-wrap--${iconVariant}`">
          <q-icon :name="`fa-light fa-${form.icon}`" size="28px" />
        </div>

        <!-- Title -->
        <div class="x-dialog-action__title">{{ title }}</div>

        <!-- Description -->
        <div class="x-dialog-action__description" v-html="form.description"></div>

        <!-- Password field opcional -->
        <div v-if="form.verify_password" class="x-dialog-action__password">
          <x-input
            ref="refPasswordInput"
            :label="$t('auth.enterPassword')"
            type="password"
            :dense="false"
            v-model="form.password"
            :error="errors.password"
          />
        </div>
      </div>
    </template>

    <!-- Slot: botones de acción (centrados, full-width en mobile) -->
    <template #action-buttons>
      <div class="x-dialog-action__buttons">
        <x-button outline
                  color="grey-8"
                  class="x-dialog-action__btn"
                  @click="closeDialog"
                  :disable="loadingSubmit"
                  :label="$t('common.cancel')" />
        <x-button :color="form.button_color"
                  unelevated
                  class="x-dialog-action__btn"
                  @click="onSubmit"
                  :loading="loadingSubmit"
                  :disable="loadingSubmit"
                  :label="form.button_label_submit" />
      </div>
    </template>
  </x-dialog>
</template>
