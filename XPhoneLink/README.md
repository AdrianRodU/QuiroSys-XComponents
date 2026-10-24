# XPhoneLink

Un teléfono como se lee, con la bandera de su país y el enlace que le corresponde (v2.30.0): **WhatsApp en verde**
(icono y tooltip) si es celular, `tel:` si es fijo. Es la única fuente de estilo del teléfono en las pantallas: la
tarjeta Contacto del perfil del paciente, la celda del seguimiento, etc. Lee el número con la misma regla de
[XInputPhone](../XInputPhone/README.md) (`phone.js`): E.164 de hoy o los formatos viejos de Perú. Lo que no se
entiende sale tal cual, sin enlace ni bandera, nunca vacío.

## Instalación

```vue
<script setup>
import XPhoneLink from '@quirosys/x-components/XPhoneLink/XPhoneLink.vue'
</script>

<template>
  <x-phone-link :model-value="patient.phone" />
</template>
```

Las banderas son las clases `fi fi-xx` del paquete `flag-icons`; la app carga su CSS una vez (ver XInputPhone).

## En una tabla (XTableServer)

Desde el backend, como celda-componente:

```php
Cell::component('XPhoneLink', $patient->phone);
```

`XCellColumnRenderer` lo tiene registrado; en móvil va dentro del control de la fila, como cualquier componente.

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelValue` | `String` o `Number` | `''` | Número guardado (E.164 o un formato viejo) |
| `defaultCountry` | `String` | `'PE'` | País con el que se leen los números sin prefijo |
| `homeCountry` | `String` | `'PE'` | Sus números salen en formato nacional; los demás, internacional |
| `flags` | `Boolean` | `true` | Bandera SVG del país |
| `color` | `String` | `'green-7'` | Color Quasar del enlace de WhatsApp |
| `tooltip` | `String` | `'Escribirle por WhatsApp'` | Tooltip del enlace de WhatsApp |
| `telTooltip` | `String` | `'Llamar'` | Tooltip del enlace `tel:` |
| `empty` | `String` | `''` | Texto cuando no hay número; vacío, no pinta nada |

## Qué pinta

| Número | Resultado |
|---|---|
| Celular válido (`+51987654321`) | enlace a `wa.me/51987654321` en verde, icono de WhatsApp, bandera, "987 654 321" |
| Fijo válido (`+5113458530`) | enlace `tel:+5113458530` con icono de teléfono, bandera, "(01) 345 8530" |
| De otro país (`+584121234567`) | igual, en formato internacional "+58 412 1234567" con su bandera |
| No se entiende (`92532540`) | el texto tal cual, sin enlace ni bandera |
| Vacío | nada, o `empty` si se pasa |
