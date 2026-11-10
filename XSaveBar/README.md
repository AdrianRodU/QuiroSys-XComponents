# XSaveBar

Barra de guardado de una pantalla de configuración (v2.33.0). A la izquierda el estado ("Sin cambios", "3 cambios sin
guardar"), a la derecha "Descartar" (opcional) y "Guardar". Va como primer hijo del contenido de la tarjeta y se queda
pegada debajo del header fijo de la app al hacer scroll (mide su alto, que cambia en el celular).

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `changes` | Number \| Boolean | `0` | Cambios sin guardar. Un número se cuenta ("2 cambios sin guardar"); `true` dice "Cambios sin guardar". |
| `saving` | Boolean | `false` | Guardando: carga en el botón y no se puede volver a pulsar. |
| `error` | String | `''` | Texto en rojo junto al estado ("Revisa los campos marcados."). Mientras haya uno no se puede guardar. |
| `disable` | Boolean | `false` | Apaga Guardar por una razón propia de la pantalla. |
| `discardable` | Boolean | `false` | Muestra "Descartar" cuando hay cambios. |
| `saveLabel` | String | `Guardar` | |
| `saveIcon` | String | `fa-light fa-floppy-disk` | |
| `discardLabel` | String | `Descartar` | |
| `cleanLabel` | String | `Sin cambios` | Estado cuando no hay cambios. |
| `top` | String | `''` | Distancia desde arriba al pegarse. Vacío = el alto del header de la app (`.layout-header` o `.q-header`). |

## Eventos

- `save`: solo si hay cambios, no está guardando, no hay `error` ni `disable`.
- `discard`

## Slot

- Por defecto: va junto al estado (una nota corta, p. ej. "al guardar eliges desde qué mes rigen").

## Uso

```vue
<x-card title="Notificaciones" icon="notifications_active">
  <x-save-bar
    :changes="dirtyItems.length"
    :saving="saving"
    :error="isValid ? '' : 'Revisa los valores marcados.'"
    @save="saveAll"
  />
  <!-- contenido -->
</x-card>
```

El aviso de "Cambios sin guardar" al salir de la pantalla (`onBeforeRouteLeave`) sigue siendo de cada pantalla: la barra
solo pinta el estado y los botones.
