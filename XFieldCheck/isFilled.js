// Regla única del check verde (XFieldCheck, v2.30.0).

/**
 * ¿El campo tiene un valor? null/undefined no; '' o solo espacios no; [] no; todo lo demás sí. 0 y false cuentan:
 * son una elección (p. ej. "No" en un select Sí/No, o cantidad 0 donde se permite).
 */
export function isFilled(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'number') return !Number.isNaN(value)
  return true
}

/** ¿El campo es de solo lectura o está deshabilitado? (attrs de Quasar: `readonly`/`disable`, con o sin valor). */
export function isInactive(attrs) {
  if (!attrs) return false
  return attrs.disable === '' || !!attrs.disable || attrs.readonly === '' || !!attrs.readonly
}
