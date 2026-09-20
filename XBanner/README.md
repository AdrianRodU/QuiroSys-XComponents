# XBanner Component

A flexible wrapper for Quasar's `QBanner` with predefined semantic styles for success, error, warning, and information messages.

---

## ✅ Features

- Automatically applies color schemes based on `type`
- Supports semantic types: `success`, `error`, `warning`, `information`
- Dynamic `text-*` and `bg-*` class bindings
- Optional custom attributes passed via `v-bind="attrs"`
- Supports label via prop and custom content via slot

---

## 🔧 Props

| Prop     | Type   | Default     | Description                                                |
|----------|--------|-------------|------------------------------------------------------------|
| `label`  | String | `''`        | Text content displayed in the banner                      |
| `type`   | String | `'success'` | Semantic type that defines the color scheme               |

---

## 🎨 Color Scheme Map

| Type          | Text Color   | Background   | Icon por defecto      | Cuando se usa |
|---------------|--------------|--------------|-----------------------|---------------|
| `success`     | `green-10`   | `green-11`   | `check_circle`        | Salio bien |
| `error`       | `red-10`     | `red-2`      | `error`               | Fallo algo |
| `information` | `blue-10`    | `blue-3`     | `info`                | Dato util (alias: `info`) |
| `warning`     | `yellow-10`  | `yellow-7`   | `warning`             | Ojo con esto |
| `courtesy`    | `teal-9`     | `teal-1`     | `volunteer_activism`  | Riel de cortesias y convenios (v2.7.0) |
| `neutral`     | `grey-9`     | `grey-3`     | `info`                | Situacion cerrada, sin nada que hacer (v2.8.0) |
| `trial`       | `purple-9`   | `purple-1`   | `science`             | Algo fuera de lo habitual: periodo de prueba, atencion fuera del flujo (v2.8.0) |

Un `type` NO mapeado cae a `neutral` desde v2.8.0 (antes caia a `success`, y pintaba
de verde exito un aviso cuyo tipo estaba mal escrito). El default del prop sigue
siendo `success`: un banner SIN `type` conserva su verde.

---

## 🧠 Inherits

Any native props or attributes supported by `QBanner` can be passed via `v-bind="attrs"`.

---

## 🚀 Usage Examples

### Basic success banner

```vue
<XBanner label="Operación realizada con éxito" type="success" />
```

### Warning with custom slot content

```vue
<XBanner type="warning">
  <div class="row items-center">
    <q-icon name="warning" class="q-mr-sm" />
    <span>Se requiere atención inmediata.</span>
  </div>
</XBanner>
```

### Error banner with Quasar attributes

```vue
<XBanner label="Error de validación" type="error" class="q-mb-md" dense />
```

---

## 📌 Notes

- The component applies both `text-{color}` and `bg-{color}` classes dynamically.
- Extend the scoped style in the `.vue` file to customize padding, radius, or typography.

---