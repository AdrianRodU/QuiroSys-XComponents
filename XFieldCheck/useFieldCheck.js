// Regla del check verde con sus modos (XFieldCheck, v2.31.0): la usan los componentes de formulario.
import { computed, ref, watch } from 'vue'
import { isFilled } from './isFilled.js'

/**
 * - check=true: hay valor, no hay error y el campo no está inactivo.
 * - check='dirty' (filtros, Adrián 24/10/2026: "los que vienen por defecto no deben tener check, solo cuando se
 *   modifica a un valor"): además, el valor tiene que ser distinto del que el campo tenía antes de que el usuario lo
 *   tocara. El valor base sigue a los cambios del padre hasta el primer cambio del usuario (así un default que llega
 *   después, p. ej. la sede al cargar, no cuenta como cambio); si el usuario vuelve al valor base, el check se va.
 * - check=false: nunca.
 * `markUserChange()` lo llama el componente en su propio update (teclear, elegir, limpiar).
 */
export function useFieldCheck({ check, value, inactive, error }) {
  const baseline = ref(value())
  const userChanged = ref(false)
  watch(value, (v) => {
    if (!userChanged.value) baseline.value = v
  })
  const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
  const showOk = computed(() => {
    const mode = check()
    if (!mode || inactive() || error() || !isFilled(value())) return false
    if (mode === 'dirty') return userChanged.value && !same(value(), baseline.value)
    return true
  })
  const markUserChange = () => {
    userChanged.value = true
  }
  return { showOk, markUserChange }
}
