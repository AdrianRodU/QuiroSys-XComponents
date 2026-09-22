<script setup>
import {ref, computed, watch, onMounted} from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  length: {
    type: Number,
    default: 6
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  autoFocus: {
    type: Boolean,
    default: true
  },
  // Oculta los digitos tras puntos (type=password). Para un codigo de un solo
  // uso que llega por SMS da igual verlo; para un PIN que la persona reutiliza
  // todo el dia, verlo en pantalla lo regala a quien mire por encima del
  // hombro. Default false para no cambiar los usos existentes.
  mask: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'complete']);

const code = ref(Array(props.length).fill(''));
const inputRefs = ref([]);

const codeString = computed(() => code.value.join(''));
const codeComplete = computed(() => code.value.every(digit => digit !== ''));

// Sincronizar con v-model externo
watch(() => props.modelValue, (newVal) => {
  if (newVal !== codeString.value) {
    const digits = (newVal || '').split('').slice(0, props.length);
    code.value = Array(props.length).fill('').map((_, i) => digits[i] || '');
  }
}, {immediate: true});

// Emitir cambios
watch(codeString, (newVal) => {
  emit('update:modelValue', newVal);
  if (codeComplete.value) {
    emit('complete', newVal);
  }
});

const handleInput = (index, event) => {
  const value = event.target.value;

  // Solo permitir números
  if (!/^\d*$/.test(value)) {
    code.value[index] = '';
    return;
  }

  // Si pegan múltiples dígitos
  if (value.length > 1) {
    const digits = value.split('').filter(d => /\d/.test(d)).slice(0, props.length);
    digits.forEach((digit, i) => {
      if (i < props.length) code.value[i] = digit;
    });
    const nextEmpty = code.value.findIndex(d => d === '');
    if (nextEmpty !== -1) {
      inputRefs.value[nextEmpty]?.focus();
    } else {
      inputRefs.value[props.length - 1]?.focus();
    }
    return;
  }

  code.value[index] = value;

  // Auto-focus siguiente
  if (value && index < props.length - 1) {
    inputRefs.value[index + 1]?.focus();
  }
};

const handleKeydown = (index, event) => {
  // Backspace: borrar actual y volver al anterior
  if (event.key === 'Backspace' && !code.value[index] && index > 0) {
    inputRefs.value[index - 1]?.focus();
  }
};

const handlePaste = (event) => {
  event.preventDefault();
  const pastedData = event.clipboardData.getData('text');
  const digits = pastedData.replace(/\D/g, '').slice(0, props.length).split('');

  digits.forEach((digit, i) => {
    code.value[i] = digit;
  });

  const nextEmpty = code.value.findIndex(d => d === '');
  if (nextEmpty !== -1) {
    inputRefs.value[nextEmpty]?.focus();
  }
};

const clear = () => {
  code.value = Array(props.length).fill('');
  inputRefs.value[0]?.focus();
};

const focus = () => {
  inputRefs.value[0]?.focus();
};

onMounted(() => {
  if (props.autoFocus) {
    setTimeout(() => focus(), 100);
  }
});

defineExpose({
  clear,
  focus
});
</script>

<template>
  <div class="flex justify-center q-gutter-sm" @paste="handlePaste">
    <q-input
      v-for="(digit, index) in code"
      :key="index"
      :ref="el => inputRefs[index] = el"
      v-model="code[index]"
      :type="mask ? 'password' : 'text'"
      inputmode="numeric"
      maxlength="1"
      outlined
      class="x-input-otp"
      :class="{ 'x-input-otp-error': error, 'x-input-otp-mask': mask }"
      @update:model-value="(val) => handleInput(index, { target: { value: val || '' } })"
      @keydown="(e) => handleKeydown(index, e)"
      :disable="disabled"
    />
  </div>
</template>

<style scoped>
.x-input-otp {
  width: 52px;
}

/* Quasar dibuja el borde del outlined en los pseudo-elementos del control, no
   en el control: redondear solo el contenedor deja las esquinas RECTAS. Hay que
   redondear los tres. */
.x-input-otp :deep(.q-field__control),
.x-input-otp :deep(.q-field__control)::before,
.x-input-otp :deep(.q-field__control)::after {
  border-radius: 12px;
}

.x-input-otp :deep(.q-field__control) {
  height: 58px;
  transition: box-shadow 0.15s ease;
}

/* Anillo suave al enfocar: con los digitos tapados, saber en que casilla estas
   es lo unico que te orienta. El color sale del tema del cliente. */
.x-input-otp.q-field--focused :deep(.q-field__control) {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.15);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--q-primary) 18%, transparent);
}

.x-input-otp :deep(input) {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 0;
}

/* El caracter del punto renderiza bastante mas chico que un digito: al mismo
   tamano de fuente se ve raquitico dentro de la casilla. Se compensa. */
.x-input-otp-mask :deep(input) {
  font-size: 38px;
  line-height: 1;
}

.x-input-otp-error :deep(.q-field__control) {
  border-color: var(--q-negative) !important;
}
</style>
