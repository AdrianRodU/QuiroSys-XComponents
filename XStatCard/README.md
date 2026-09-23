# XStatCard

Tarjeta de **un número** para dashboards: ícono, título, valor grande, un chip de contexto o de
variación frente al período anterior, un texto chico y la ayuda "?" con la definición del número.
Se arma sobre `q-card flat bordered`, así que se ve igual que el resto de las tarjetas del tema.

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `title` | String | `''` | Título del número |
| `value` | String \| Number | `null` | Valor; `null` se pinta como "—" (sin dato, no cero) |
| `icon` | String | `''` | Ícono de la baldosa |
| `tone` | String | `'primary'` | Tono del ícono: `primary`, `purple`, `orange`, `green`, `red`, `amber`, `teal`, `grey` |
| `delta` | String | `''` | Texto del chip ("4%", "5 de 7 R2") |
| `deltaTone` | String | `'neutral'` | `positive`, `negative`, `warning`, `neutral` |
| `deltaIcon` | String | `''` | `up` o `down`: flecha dentro del chip |
| `caption` | String | `''` | Texto chico debajo (o el slot por defecto) |
| `help` | String | `''` | Definición del número, en un `XHelpTip` |
| `loading` | Boolean | `false` | Esqueleto de carga |

## Uso

```vue
<XStatCard
  icon="fa-light fa-users" tone="primary" title="Pacientes que vinieron"
  :value="61" delta="4%" delta-tone="positive" delta-icon="up"
  caption="96 atenciones en total" help="Pacientes distintos atendidos en el período."
/>
```
