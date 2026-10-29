# XCoupon

Un cupón "de verdad", de los que se recortan (v2.32.0): borde punteado con la tijera, el cuerpo de la oferta en el
color de la marca (lo que se regala, el precio tachado, el precio del cupón y cuánto se ahorra) y, separado por la línea
perforada con sus muescas, el talón con el código y hasta cuándo vale. Nació para la tarjeta de recomendación del ERP
(29/10/2026): "más marketero vendedor, que se vea como un cupón de verdad, como si se cortara".

## Instalación

```vue
<script setup>
import XCoupon from '@quirosys/x-components/XCoupon/XCoupon.vue'
</script>

<template>
  <x-coupon
    eyebrow="Tarjeta de recomendación"
    title="Consulta quiropráctica + RX"
    :price="175"
    :old-price="300"
    code="REC-58-K7Q2XA"
    expires="28/11/2026"
    note="Un solo uso · Para María"
    copyable
  >
    <template #subtitle><b>Ana R.</b> te regala</template>
  </x-coupon>
</template>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `eyebrow` | `String` | `''` | Rótulo chico del cuerpo |
| `subtitle` | `String` | `''` | Línea sobre el título (también por el slot `subtitle`, con negritas) |
| `title` | `String` | `''` | Lo que se regala u ofrece |
| `price` | `Number` o `String` | `null` | Precio del cupón; sin precio no se pinta la fila |
| `oldPrice` | `Number` o `String` | `null` | Precio de lista, tachado; solo si es mayor que `price` |
| `currency` | `String` | `'S/'` | Moneda de los precios |
| `savingsLabel` | `String` | `'Ahorras'` | Etiqueta del ahorro ("Ahorras S/ 125"); vacía lo oculta |
| `code` | `String` | `''` | Código del cupón |
| `codeLabel` | `String` | `'Código'` | Rótulo del código |
| `expires` | `String` | `''` | Hasta cuándo vale, ya formateado |
| `expiresLabel` | `String` | `'Vale hasta'` | Rótulo de la vigencia |
| `note` | `String` | `''` | Nota del talón |
| `stamp` | `String` | `''` | Sello encima ("Usada", "Vencida", "Anulada"): apaga el cupón y quita el botón de copiar |
| `icon` | `String` | `'redeem'` | Ícono del cuerpo, arriba a la derecha |
| `color` | `String` | `'primary'` | Color del cuerpo: `primary` (el de la app), un nombre del mapa de colores de XBadge (`teal`, `purple`, `green`...) o un color CSS (`#0b3d6b`) |
| `copyable` | `Boolean` | `false` | Botón para copiar el código (avisa con `copyMessage`) |
| `copyMessage` | `String` | `'Código copiado'` | Aviso al copiar |
| `cutLine` | `Boolean` | `true` | Borde punteado con la tijera alrededor |

## Slots y eventos

| Nombre | Qué hace |
|--------|----------|
| `subtitle` | Reemplaza `subtitle` (por ejemplo, el nombre en negrita) |
| default | Contenido extra al final del talón |
| `copy` (evento) | Se emite con el código después de copiarlo |

## El fondo

La tijera y las muescas de la línea perforada se pintan con el color del fondo donde se apoya el cupón, para que
parezcan cortes: por defecto `var(--x-surface, #fff)` (diálogos y tarjetas). Sobre otro fondo, pasarlo en la variable
`--x-coupon-cut-bg`:

```vue
<x-coupon style="--x-coupon-cut-bg: #f0f4f9" ... />
```
