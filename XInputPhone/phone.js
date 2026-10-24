// Teléfonos con código de país (v2.29.0): UN solo lugar para leer, validar, mostrar y armar el enlace de WhatsApp.
//
// Formato guardado: internacional E.164 ("+51987654321"). Los datos de antes (9 dígitos peruanos, con o sin 51 delante,
// con espacios o guiones) se leen como de Perú, así que nada de lo viejo deja de funcionar mientras se migra.
//
// Metadata "max" de libphonenumber-js: valida fijos y celulares de todos los países y sabe de qué tipo es cada número
// (la "mobile" solo conoce celulares y da por inválido un fijo; la "min" valida pero no distingue el tipo).
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isSupportedCountry,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from 'libphonenumber-js/max'
import examples from 'libphonenumber-js/mobile/examples'

export const DEFAULT_COUNTRY = 'PE'

/** Lista corta de la clínica (Adrián, 24/10/2026): Perú primero y por defecto; "Todos los países…" abre el resto. */
export const SHORT_LIST = ['PE', 'VE', 'CO', 'EC', 'CL', 'AR', 'BO', 'BR', 'US', 'ES', 'MX']

let displayNames = null

/** Nombre del país en español ("Perú", "Estados Unidos"); el código ISO si el navegador no lo sabe. */
export function countryName(iso) {
  try {
    displayNames ||= new Intl.DisplayNames(['es'], { type: 'region' })
    return displayNames.of(iso) || iso
  } catch {
    return iso
  }
}

/** Prefijo con el más: "+51". */
export function dialCode(iso) {
  try {
    return `+${getCountryCallingCode(iso)}`
  } catch {
    return ''
  }
}

/**
 * Opciones del selector: [{ iso, dial, name }]. `list` es un arreglo de ISO (en ese orden) o 'all' (todos los países
 * que conoce la librería, ordenados por nombre en español).
 */
export function countryOptions(list = SHORT_LIST) {
  const all = list === 'all' || (Array.isArray(list) && list.includes('all'))
  const isos = all ? getCountries() : (Array.isArray(list) ? list : SHORT_LIST).filter((iso) => isSupportedCountry(iso))
  const rows = isos.map((iso) => ({ iso, dial: dialCode(iso), name: countryName(iso) }))
  if (all) rows.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return rows
}

function clean(value) {
  return String(value ?? '').trim()
}

/**
 * Lee un número guardado o escrito y devuelve el PhoneNumber de la librería (o null si no se entiende):
 *  - "+51987654321" / "+58 412 1234567": internacional, el país sale del número.
 *  - "987654321", "987-654-321", "51 987654321", "0051987654321": los formatos viejos de Perú.
 *  - cualquier otra cosa se interpreta como número nacional de `defaultCountry`.
 */
export function parsePhone(value, defaultCountry = DEFAULT_COUNTRY) {
  const raw = clean(value)
  if (!raw) return null
  if (raw.startsWith('+')) return parsePhoneNumberFromString(raw) || null
  const digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('00') && digits.length > 10) return parsePhoneNumberFromString(`+${digits.slice(2)}`) || null
  if (defaultCountry === 'PE' && /^519\d{8}$/.test(digits)) return parsePhoneNumberFromString(`+${digits}`) || null
  return parsePhoneNumberFromString(digits, defaultCountry) || null
}

/** ¿El número es de celular? (o de los que la librería no distingue, p. ej. Estados Unidos). */
export function isMobileType(pn) {
  const type = pn?.getType?.()
  return !type || type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE'
}

/** true si el valor es un número válido (y celular, si `type` es 'mobile'). */
export function isValidPhone(value, { defaultCountry = DEFAULT_COUNTRY, type = 'any' } = {}) {
  const pn = parsePhone(value, defaultCountry)
  return !!pn && pn.isValid() && (type !== 'mobile' || isMobileType(pn))
}

/** E.164 ("+51987654321") si el valor es un número válido; null si no. */
export function toE164(value, defaultCountry = DEFAULT_COUNTRY) {
  const pn = parsePhone(value, defaultCountry)
  return pn && pn.isValid() ? pn.number : null
}

/**
 * Cómo se muestra: nacional si es de casa ("987 654 321"), internacional si no ("+58 412 1234567"). Lo que no se
 * entiende sale tal cual (datos viejos sin arreglar), nunca vacío.
 */
export function formatPhone(value, { defaultCountry = DEFAULT_COUNTRY, homeCountry = DEFAULT_COUNTRY } = {}) {
  const raw = clean(value)
  if (!raw) return ''
  const pn = parsePhone(raw, defaultCountry)
  if (!pn || !pn.isValid()) return raw
  return pn.country === homeCountry ? pn.formatNational() : pn.formatInternational()
}

/** Dígitos para wa.me / api.whatsapp.com ("51987654321"); null si el número no sirve. */
export function phoneDigits(value, defaultCountry = DEFAULT_COUNTRY) {
  const pn = parsePhone(value, defaultCountry)
  return pn && pn.isValid() ? pn.number.slice(1) : null
}

/** Enlace click-to-chat de WhatsApp (o null sin número válido). */
export function whatsappLink(value, text = '', defaultCountry = DEFAULT_COUNTRY) {
  const digits = phoneDigits(value, defaultCountry)
  if (!digits) return null
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Ejemplo de celular del país, en formato nacional, para el placeholder ("912 345 678"). */
export function examplePlaceholder(iso) {
  try {
    return getExampleNumber(iso, examples)?.formatNational() || ''
  } catch {
    return ''
  }
}

/** Formatea mientras se escribe ("9876543" → "987 654 3"), en el formato nacional del país. */
export function formatAsYouType(text, iso) {
  const digits = String(text ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return new AsYouType(iso).input(digits)
}

/** Lo escrito con el más delante: de qué país es y qué parte es el número nacional. */
export function parseTyped(text) {
  const ayt = new AsYouType()
  ayt.input(String(text ?? ''))
  return { country: ayt.getCountry() || null, national: ayt.getNationalNumber() || '' }
}

/**
 * Mensaje de error en cristiano para lo escrito en `iso`, o null si el número sirve.
 * `type`: 'mobile' exige celular (pacientes, apoderados: es el WhatsApp); 'any' acepta fijos (sedes, empresas).
 */
export function validationMessage(text, iso, type = 'mobile') {
  const digits = String(text ?? '').replace(/\D/g, '')
  if (!digits) return null
  const name = countryName(iso)
  const length = validatePhoneNumberLength(digits, iso)
  if (length === 'TOO_SHORT' || length === 'NOT_A_NUMBER') return `Número incompleto para ${name}`
  if (length === 'TOO_LONG') return `Número demasiado largo para ${name}`
  const pn = parsePhoneNumberFromString(digits, iso)
  if (!pn || !pn.isValid()) return `Número no válido para ${name}`
  if (type === 'mobile' && !isMobileType(pn)) return 'No es un celular: aquí va el número de WhatsApp'
  return null
}
