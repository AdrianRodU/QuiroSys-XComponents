# XCallout

Aviso al estilo de las **alertas de GitHub**: barra de color a la izquierda, título con ícono y el texto
debajo. Sirve para explicar un dato "en cristiano" junto a él (qué mide, cómo va, qué hacer), sin el peso
de un `XBanner`, que es un aviso de pantalla.

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `type` | String | `note` | `note` (azul), `tip` (verde), `important` (morado), `warning` (ámbar), `caution` (rojo). Un tipo desconocido cae a `note`. |
| `title` | String | el del tipo | Título. Vacío = Nota, Consejo, Importante, Advertencia o Cuidado. |
| `icon` | String | el del tipo | Ícono propio (Material o Font Awesome). |
| `dense` | Boolean | `false` | Compacto: menos relleno y letra más chica, para usarlo dentro de tarjetas. |

## Slots

| Slot | Uso |
|------|-----|
| default | El texto del aviso (admite varios `<p>`). |
| `title` | Título con marcado propio (reemplaza a la prop `title`). |

## Uso

```vue
<XCallout type="tip" title="¡Felicitaciones!">
  Esta semana ya llevas 10 pacientes nuevos, 4 más que la semana pasada a esta misma altura.
</XCallout>

<!-- Dentro de una tarjeta -->
<XCallout type="warning" title="Ojo con esta semana" dense>
  <p>Semana 1: 208 · semana 2: 217 · semana 3: 238.</p>
  <p>Esta semana llevas 144 de lunes a viernes, frente a 186 en los mismos días de la semana pasada.</p>
</XCallout>
```

Primera versión: v2.16.0 (Mi panel del ERP, avisos por tarjeta en "¿Cómo voy?").
