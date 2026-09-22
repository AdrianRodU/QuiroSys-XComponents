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
  },
  // Comprobando contra el servidor: un giro por casilla, en cascada. Existe
  // para la espera REAL — con una respuesta de 400ms casi no se ve, pero con
  // una lenta es lo que evita que la persona crea que no paso nada y teclee
  // otra vez.
  loading: {
    type: Boolean,
    default: false
  },
  // Validado: las casillas convergen en UNA sola con un check.
  success: {
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
  <div
    class="x-otp-row"
    :class="{ 'x-otp-row--load': loading, 'x-otp-row--ok': success, 'x-otp-row--err': error }"
    @paste="handlePaste"
  >
    <div v-for="(digit, index) in code" :key="index" class="x-otp-cell">
      <q-input
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
      <!-- Siempre montado: si se creara con v-if no habria transicion. -->
      <span class="x-otp-spin" aria-hidden="true" />
    </div>

    <!-- El resultado ocupa UNA casilla, no el ancho entero. El check va en SVG
         para no depender de que el proyecto cargue un set de iconos. -->
    <span class="x-otp-result" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  </div>
</template>

<style scoped>
.x-otp-row {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  transition: gap .42s cubic-bezier(.4, 0, .2, 1);
}

.x-otp-cell {
  position: relative;
  width: 52px;
  height: 58px;
  transition: width .42s cubic-bezier(.4, 0, .2, 1), opacity .3s ease;
}

.x-input-otp {
  width: 100%;
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
  transition: box-shadow .15s ease;
}

.x-input-otp :deep(input) {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 0;
  transition: color .2s ease;
}

/* El caracter del punto renderiza bastante mas chico que un digito: al mismo
   tamano de fuente se ve raquitico dentro de la casilla. Se compensa. */
.x-input-otp-mask :deep(input) {
  font-size: 38px;
  line-height: 1;
}

/* Anillo suave al enfocar: con los digitos tapados, saber en que casilla estas
   es lo unico que te orienta. El color sale del tema del cliente. */
.x-input-otp.q-field--focused :deep(.q-field__control) {
  box-shadow: 0 0 0 3px rgba(25, 118, 210, .15);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--q-primary) 18%, transparent);
}

.x-input-otp-error :deep(.q-field__control) {
  border-color: var(--q-negative) !important;
}

/* ── Comprobando ─────────────────────────────────────────────────────────── */
.x-otp-spin {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, .12);
  border-top-color: var(--q-primary);
  border-radius: 50%;
  opacity: 0;
  transition: opacity .2s ease;
  pointer-events: none;
}

/* El digito se va para que el giro quede solo. */
.x-otp-row--load .x-input-otp :deep(input) {
  color: transparent;
}

.x-otp-row--load .x-otp-spin {
  opacity: 1;
  animation: x-otp-spin .62s linear infinite;
}

/* En cascada y no a la vez: cuatro giros simultaneos parecen un parpadeo. */
.x-otp-cell:nth-child(1) .x-otp-spin { transition-delay: 0s; }
.x-otp-cell:nth-child(2) .x-otp-spin { transition-delay: .07s; }
.x-otp-cell:nth-child(3) .x-otp-spin { transition-delay: .14s; }
.x-otp-cell:nth-child(4) .x-otp-spin { transition-delay: .21s; }
.x-otp-cell:nth-child(5) .x-otp-spin { transition-delay: .28s; }
.x-otp-cell:nth-child(6) .x-otp-spin { transition-delay: .35s; }

/* ── Validado ────────────────────────────────────────────────────────────── */
.x-otp-result {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52px;
  height: 58px;
  margin: -29px 0 0 -26px;
  border-radius: 12px;
  background: rgba(33, 186, 69, .12);
  border: 1.5px solid var(--q-positive);
  color: var(--q-positive);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(.6);
  transition: opacity .28s ease .1s, transform .46s cubic-bezier(.34, 1.56, .64, 1) .1s;
  pointer-events: none;
}

.x-otp-row--ok { gap: 0; }

.x-otp-row--ok .x-otp-cell {
  width: 0;
  opacity: 0;
}

.x-otp-row--ok .x-otp-result {
  opacity: 1;
  transform: scale(1);
}

/* ── Rechazado ───────────────────────────────────────────────────────────── */
.x-otp-row--err {
  animation: x-otp-shake .42s cubic-bezier(.36, .07, .19, .97);
}

@keyframes x-otp-spin {
  to { transform: rotate(360deg); }
}

@keyframes x-otp-shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-7px); }
  40%, 60% { transform: translateX(7px); }
}

/* Quien pidio menos movimiento ve el cambio de color, no el temblor ni el
   colapso. */
@media (prefers-reduced-motion: reduce) {
  .x-otp-row,
  .x-otp-cell,
  .x-otp-result {
    transition-duration: .01s;
  }
  .x-otp-row--err { animation: none; }
}
</style>
