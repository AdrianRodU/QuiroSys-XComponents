# XFieldCheck

El check verde de "este campo tiene valor y no está en error" (v2.30.0). Lo pintan todos los componentes de formulario
de la librería con la misma regla (`isFilled.js`): hay valor, no hay error, y el campo no es de solo lectura ni está
deshabilitado. En cada componente se apaga con `:check="false"`.

| Componente | Cuándo sale |
|---|---|
| XInput, XInputNumeric, XInputSearchPerson, XInputColor | texto o número (0 cuenta) |
| XSelect, XSelectCountry, XSelectNationality, XSelectLocation, XTreeSelect | una opción elegida (`false` cuenta; `[]` no) |
| XDatepicker, XDatepickerMonth, XDateTimepicker, XTimepicker, XInputDate, XInputTime | una fecha u hora |
| XInputPhone | un número válido (su propia validación) |
| XFile | un archivo elegido |

`isFilled(value)`: `null`/`undefined` no; `''` o solo espacios no; `[]` no; todo lo demás sí.
`isInactive(attrs)`: `readonly` o `disable` presentes.

```vue
<x-field-check />           <!-- solo el icono: check_circle teal-7 de 18px -->
<x-input v-model="x" :check="false" />   <!-- sin check en este campo -->
```

## `check="dirty"` para filtros (v2.31.0)

Adrián (24/10/2026): "los que vienen por defecto no deben tener check, solo cuando se modifica a un valor". Con
`check="dirty"` el check sale solo cuando el usuario cambió el valor respecto del que el campo tenía antes de tocarlo
(`useFieldCheck.js`); si vuelve al valor base, se va. Los filtros internos de `XTableServer` y los del filtro de período
ya lo usan; un filtro propio de una pantalla se marca con `check="dirty"`. Lo entienden XInput, XInputNumeric, XSelect,
XDatepicker, XDatepickerMonth y XTreeSelect.
