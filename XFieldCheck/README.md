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
