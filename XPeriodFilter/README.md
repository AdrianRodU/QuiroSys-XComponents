# XPeriodFilter

Filtro de período **único** del ERP, en dos formas con las mismas etiquetas (`periodModes.js`):

| Forma | Componente | Dónde |
|------|------------|-------|
| Compacta | `XPeriodFilter` | Dashboards: atajos + "Personalizado" con el calendario en el panel |
| En línea | `XPeriodFilterInline` | Tablas (`XTableServer`) y reportes: selector de modo + campos de fecha o mes |

## XPeriodFilter (compacta)

Atajos **Hoy / Esta semana / Este mes** y **Personalizado** (Por fecha, Entre fechas, Por semana, Por
mes, Entre meses). Se aplica al elegir, sin botón.

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelValue` | Object | `null` | Selección `{ mode, dateStart, dateEnd, weekStart, monthStart, monthEnd }` (opcional, para recordarla) |
| `defaultMode` | String | `'this_week'` | Modo inicial si no llega `modelValue` |
| `presets` | Array | `['today','this_week','this_month']` | Atajos visibles |
| `modes` | Array | los 5 | Modos de "Personalizado" (`date`, `between_dates`, `week`, `month`, `between_months`) |
| `weekDays` | Number | `6` | Días desde el lunes: 6 = lunes a sábado (la semana de la clínica y de la comisión) |
| `showLabel` | Boolean | `false` | Muestra el rango resuelto debajo de los botones |
| `disable` | Boolean | `false` | Deshabilita los botones |

### Eventos

- `change` → `{ mode, date_from, date_to, prev_from, prev_to, label }`. Se emite al montar y cada vez
  que cambia el **rango** (elegir otra vez lo mismo no vuelve a emitir).
- `update:modelValue` → la selección, para `v-model`.

`prev_from` / `prev_to` es el **mismo tramo del período anterior**. Si el rango incluye hoy se comparan
solo los días **ya terminados**, porque hoy está en curso: el miércoles, lunes y martes contra lunes y
martes de la semana pasada; el 23, del 1 al 22 contra del 1 al 22 del mes anterior. Si el rango ya
pasó, se compara con el período anterior completo. Sin días terminados (el lunes en "Esta semana", o
"Hoy") o con un rango futuro, llega `null`: todavía no hay con qué comparar. Quien consume el filtro
debe comparar contra esos mismos días.

### Personalizado

Los calendarios van **dentro del panel** (desde v2.12.0; antes cada fecha abría un segundo popup encima
del menú y, cerca del borde derecho de la pantalla, quedaba apretado contra el borde y tapaba el panel):

| Modo | Cómo se elige |
|------|---------------|
| Por fecha | Un día en el calendario |
| Entre fechas | Se toca la fecha inicial y luego la final (el panel lo indica) |
| Por semana | Se toca cualquier día y se elige su semana, o se usan las flechas |
| Por mes | Un mes en la cuadrícula de 12, con el año arriba |
| Entre meses | Se toca el mes inicial y luego el final |

Completar una elección aplica el filtro y cierra el panel; **Listo** también lo cierra. Las flechas de
semana no lo cierran.

### Uso

```vue
<XPeriodFilter @change="(r) => load(r.date_from, r.date_to, r.prev_from, r.prev_to)" />
```

Las etiquetas van en español dentro del componente: no dependen del idioma del servidor ni de claves
i18n. Las fechas se arman en hora local (`YYYY-MM-DD`).

## XPeriodFilterInline (en línea)

Un selector con los modos y los campos que pide el modo elegido, en la misma fila: **Fecha** (por
fecha), **Fecha del / Fecha al** (entre fechas), **Mes** (por mes), **Mes del / Mes al** (entre meses).
Los campos abren el calendario de `XDatepicker` / `XDatepickerMonth`.

### Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `modelValue` | Object | `{}` | El filtro con los nombres que lee el backend: `{ value, dateStart, dateEnd, monthStart, monthEnd }` |
| `options` | Array | los cuatro | Modos en su orden: ids (`'month'`, …) u objetos `{ id, name }` como los manda `Filter::makePeriod`. La etiqueta sale del componente; la del backend solo si el modo es desconocido |
| `label` | String | `'Periodo'` | Etiqueta del selector |

`value` es `'month'`, `'date'`, `'between_months'`, `'between_dates'` o `'all'` ("Todas las fechas",
el `includeAllOption` de Caja). `dateStart`/`dateEnd` van en `YYYY-MM-DD` y `monthStart`/`monthEnd` en
`YYYY-MM`, exactamente como los interpreta `FilterTrait::getFilterDate` de `quirosys/datatable`.

### Eventos

- `update:modelValue` y `change` → los cinco campos, **una vez por cada cambio del usuario**. Los que no
  cambiaron van tal como llegaron (un campo ausente sigue ausente). **No emite al montar**: quien lo usa
  decide cuándo consultar.

### Uso

`XTableServer` lo usa por dentro para el filtro `period` y aplica solo los campos que cambiaron, así el
payload de `{resource}/records` es el mismo de siempre. En un reporte con otros nombres de campo:

```vue
<XPeriodFilterInline
  :model-value="{ value: form.period, dateStart: form.date_start, dateEnd: form.date_end, monthStart: form.month_start, monthEnd: form.month_end }"
  :options="['month', 'date', 'between_months', 'between_dates']"
  @update:model-value="(v) => Object.assign(form, { period: v.value, date_start: v.dateStart, date_end: v.dateEnd, month_start: v.monthStart, month_end: v.monthEnd })"
/>
```
