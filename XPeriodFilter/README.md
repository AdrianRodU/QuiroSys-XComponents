# XPeriodFilter

Filtro de período **único** del ERP. Forma compacta: atajos **Hoy / Esta semana / Este mes** y
**Personalizado** (Por fecha, Entre fechas, Por semana, Por mes, Entre meses). Se aplica al elegir,
sin botón.

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelValue` | Object | `null` | Selección `{ mode, dateStart, dateEnd, weekStart, monthStart, monthEnd }` (opcional, para recordarla) |
| `defaultMode` | String | `'this_week'` | Modo inicial si no llega `modelValue` |
| `presets` | Array | `['today','this_week','this_month']` | Atajos visibles |
| `modes` | Array | los 5 | Modos de "Personalizado" (`date`, `between_dates`, `week`, `month`, `between_months`) |
| `weekDays` | Number | `6` | Días desde el lunes: 6 = lunes a sábado (la semana de la clínica y de la comisión) |
| `showLabel` | Boolean | `false` | Muestra el rango resuelto debajo de los botones |
| `disable` | Boolean | `false` | Deshabilita los botones |

## Eventos

- `change` → `{ mode, date_from, date_to, prev_from, prev_to, label }`. Se emite al montar y cada vez
  que cambia el **rango** (elegir otra vez lo mismo no vuelve a emitir).
- `update:modelValue` → la selección, para `v-model`.

`prev_from` / `prev_to` es el **mismo tramo del período anterior**. Si el rango incluye hoy se comparan
solo los días **ya terminados**, porque hoy está en curso: el miércoles, lunes y martes contra lunes y
martes de la semana pasada; el 23, del 1 al 22 contra del 1 al 22 del mes anterior. Si el rango ya
pasó, se compara con el período anterior completo. Sin días terminados (el lunes en "Esta semana", o
"Hoy") o con un rango futuro, llega `null`: todavía no hay con qué comparar. Quien consume el filtro
debe comparar contra esos mismos días.

## Uso

```vue
<XPeriodFilter @change="(r) => load(r.date_from, r.date_to, r.prev_from, r.prev_to)" />
```

Las etiquetas van en español dentro del componente: no dependen del idioma del servidor ni de claves
i18n. Las fechas se arman en hora local (`YYYY-MM-DD`).
