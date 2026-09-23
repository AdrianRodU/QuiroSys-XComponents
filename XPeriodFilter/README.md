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

`prev_from` / `prev_to` es el **mismo tramo del período anterior**: si el rango incluye hoy se
compara solo la parte transcurrida (lunes a hoy contra lunes al mismo día de la semana pasada; 1 al 23
contra 1 al 23 del mes anterior); si no, el período anterior completo. "Hoy" se compara con el mismo
día de la semana pasada.

## Uso

```vue
<XPeriodFilter @change="(r) => load(r.date_from, r.date_to, r.prev_from, r.prev_to)" />
```

Las etiquetas van en español dentro del componente: no dependen del idioma del servidor ni de claves
i18n. Las fechas se arman en hora local (`YYYY-MM-DD`).
