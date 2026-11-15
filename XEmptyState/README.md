# XEmptyState

El estado vacío de la casa fuera de una tabla (v2.36.0): ícono, título, texto y botones, con el mismo aspecto que el
vacío de XTable y XTableServer. Para pantallas que no son tablas (un calendario, un panel, una lista propia) cuando no
hay nada que mostrar. En una tabla, el vacío ya lo pone la tabla (`no-data-label` y `no-data-subtitle`).

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | String | `fa-light fa-inbox` | Ícono grande arriba (Font Awesome o Material). Vacío = sin ícono. |
| `title` | String | `''` | Lo que pasa, en una línea. |
| `subtitle` | String | `''` | Qué hacer, en una o dos líneas. |
| `dense` | Boolean | `false` | Menos aire e ícono más chico, para tarjetas pequeñas. |

## Slots

- Por defecto: reemplaza al subtítulo (texto con formato, enlaces).
- `actions`: botones debajo del texto, centrados.
- `icon` y `title`: reemplazan al ícono y al título.

## Uso

```vue
<x-empty-state
  icon="fa-light fa-users"
  title="Todavía no hay personal en Presencia"
  subtitle="Usa «Sincronizar personal» para traer las fichas de las dos empresas."
>
  <template #actions>
    <x-button outline color="primary" icon="sync" label="Sincronizar personal" :loading="syncing" @click="sync" />
  </template>
</x-empty-state>
```

El título dice lo que pasa y el texto qué hacer. Si la carga falló, no es un estado vacío: va un aviso con «Reintentar»
(XBanner), para no confundir "no hay datos" con "no se pudieron traer".
