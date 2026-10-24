# XInputPhone

Teléfono con código de país (v2.29.0). País con su prefijo a la izquierda (lista corta de la clínica y "Todos los
países…", con búsqueda por nombre o prefijo), el número como se dicta a la derecha, formateado al vuelo y validado
para ese país con `libphonenumber-js`. La caja, la etiqueta flotante, `is-required`, `help` y el error son los de
`XInput`.

## Instalación

```vue
<script setup>
import XInputPhone from '@quirosys/x-components/XInputPhone/XInputPhone.vue'
</script>

<template>
  <x-input-phone v-model="form.phone" label="Celular" is-required help="Número de WhatsApp del paciente" :error="errors.phone" />
  <x-input-phone v-model="form.phone" label="Teléfono" type="any" />
</template>
```

Necesita `libphonenumber-js` (peer dependency opcional de la librería): `pnpm add libphonenumber-js`.

## v-model

UNA cadena en formato internacional E.164: `"+51987654321"`. Sale `''` cuando el campo está vacío o lo escrito
todavía no es un número válido, así el formulario nunca guarda un número a medias (el error propio se ve al salir
del campo y el servidor lo exige igual con la regla `PhoneE164`). Un valor viejo sin `+` (9 dígitos peruanos, con o
sin 51 delante) se lee como de Perú y se muestra formateado; no se vuelve a emitir hasta que alguien lo toque.

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelValue` | `String` | `''` | E.164 (v-model) |
| `isClassic` | `Boolean` | `formDefaults.isClassic` | Etiqueta flotante dentro del campo |
| `dense` | `Boolean` | `formDefaults.dense` | Modo compacto |
| `error` | `String \| Array` | `null` | Error del servidor (422); manda sobre el error propio |
| `isRequired` | `Boolean` | `false` | Asterisco rojo + `aria-required` |
| `help` | `String` | `''` | "?" con tooltip junto a la etiqueta |
| `bgColor` | `String` | `'x-field'` | Fondo del control, como XInput |
| `defaultCountry` | `String` | `'PE'` | País propuesto cuando el valor está vacío o no trae código |
| `countries` | `Array \| 'all'` | lista corta | Países de la lista (ISO, en ese orden). La búsqueda siempre mira todos |
| `type` | `'mobile' \| 'any'` | `'mobile'` | `mobile` exige celular (pacientes, apoderados: es el WhatsApp); `any` acepta fijos (sedes, centros, empresas) |
| `showError` | `'blur' \| 'always' \| 'never'` | `'blur'` | Cuándo se muestra el error propio |

Además acepta los atributos de `QInput` (`label`, `placeholder`, `disable`, `readonly`, `hint`, `autofocus`…). Sin
`placeholder` muestra un ejemplo de celular del país ("912 345 678").

## Eventos

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `update:modelValue` | `String` | E.164 válido, o `''` |
| `invalid` | `String \| null` | El motivo por el que lo escrito no sirve (o `null`), en cada cambio |
| `country` | `String` | Cambió el país (ISO), por el selector o al escribir el código con `+` |

## Comportamiento

- Escribir `+58 412…` cambia el país a Venezuela y deja el número nacional.
- Errores en cristiano: "Número incompleto para Perú", "Número demasiado largo para Perú", "Número no válido para
  Venezuela", "No es un celular: aquí va el número de WhatsApp".
- Con número válido aparece una marca ✓ a la derecha; el slot `append` sigue disponible (p. ej. el botón de enviar
  por WhatsApp).
- Lista corta por defecto: PE, VE, CO, EC, CL, AR, BO, BR, US, ES, MX. Sin imágenes de banderas: el código ISO y el
  prefijo se leen igual en Windows (que no dibuja las banderas emoji) y en el celular.

## Ayudantes (`XInputPhone/phone.js`)

Exportados también desde el índice de la librería, para mostrar y para WhatsApp sin repetir reglas:

```js
import { formatPhone, phoneDigits, whatsappLink, toE164, isValidPhone } from '@quirosys/x-components'

formatPhone('+51987654321')          // "987 654 321"  (de casa: nacional)
formatPhone('+584121234567')         // "+58 412 1234567" (de fuera: internacional)
formatPhone('987654321')             // "987 654 321"  (dato viejo, se lee como de Perú)
phoneDigits('+51987654321')          // "51987654321"  (para wa.me / api.whatsapp.com)
whatsappLink('987654321', 'Hola')    // "https://wa.me/51987654321?text=Hola"
toE164('51 987 654 321')             // "+51987654321"
isValidPhone('014455566', { type: 'any' })  // true (fijo de Lima)
```
