# XTableServer

Componente de tabla con paginacion del lado del servidor, filtros dinamicos, acciones y soporte responsive para movil.

## Instalacion

```vue
<script setup>
import XTableServer from '@/components/XTableServer/XTableServer.vue'
</script>
```

## Props

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `resource` | `String` | *required* | Ruta base del recurso API (ej: `'users'`, `'documents'`) |

## Eventos

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `actions` | `{ action, id, url }` | Emitido cuando se ejecuta una accion personalizada |

## Metodos Expuestos

```javascript
const tableRef = ref(null)

// Recargar datos con filtros actuales
tableRef.value.filterData()
```

## Uso Basico

```vue
<template>
  <XTableServer
    ref="tableRef"
    resource="users"
    @actions="handleAction"
  />
</template>

<script setup>
import { ref } from 'vue'

const tableRef = ref(null)

function handleAction({ action, id, url }) {
  if (action === 'edit') {
    // Abrir modal de edicion
  }
}
</script>
```

## Configuracion Backend

El componente espera que el backend implemente los siguientes endpoints:

### GET `/{resource}/init-data-table`

Retorna la configuracion inicial de la tabla.

```json
{
  "pageTitle": "Usuarios",
  "tableTitle": "Lista de usuarios",
  "tableName": "users",
  "pagination": {
    "perPage": 10,
    "sortBy": "created_at",
    "descending": true,
    "pageSizes": [5, 10, 20, 50]
  },
  "columns": [
    {
      "name": "id",
      "label": "ID",
      "align": "left",
      "visible": true,
      "sortable": true,
      "locked": false
    },
    {
      "name": "name",
      "label": "Nombre",
      "align": "left",
      "visible": true,
      "sortable": true,
      "locked": false
    }
  ],
  "visibleColumns": ["id", "name", "email", "actions"],
  "filters": [...],
  "headerButtons": [...],
  "mobileConfig": {...}
}
```

### POST `/{resource}/records`

Retorna los datos paginados.

```json
// Request
{
  "tableName": "users",
  "page": 1,
  "rowsPerPage": 10,
  "sortBy": "created_at",
  "descending": true,
  "filters": [...]
}

// Response
{
  "data": [...],
  "meta": {
    "total": 100,
    "per_page": 10,
    "sort_by": "created_at",
    "descending": true
  }
}
```

## Configuracion Mobile (mobileConfig)

Para personalizar la vista movil desde el backend, incluye `mobileConfig` en la respuesta de `init-data-table`:

```php
// En tu DataTable PHP
public function initDataTable(): array
{
    return [
        // ... otras configuraciones ...
        
        'mobileConfig' => [
            'enabled' => true,
            'titleField' => 'name',      // Campo para titulo del bottom sheet
            'subtitleField' => 'email',  // Campo para subtitulo del bottom sheet
            'primaryFields' => [
                // Campos que se muestran en la fila compacta movil
                [
                    'field' => 'id',
                    'label' => 'ID',
                    'position' => 'left',    // 'left' o 'right'
                ],
                [
                    'field' => 'name',
                    'label' => 'Nombre',
                    'position' => 'left',
                ],
                [
                    'field' => 'email',
                    'label' => 'Email',
                    'position' => 'right',
                    'truncate' => 150,       // Opcional: max-width en px
                ],
                [
                    'field' => 'status',
                    'label' => 'Estado',
                    'position' => 'right',
                ],
            ],
        ],
    ];
}
```

### Estructura de mobileConfig

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `enabled` | `Boolean` | Habilita la configuracion personalizada |
| `titleField` | `String` | Nombre del campo a mostrar como titulo en el bottom sheet |
| `subtitleField` | `String` | Nombre del campo a mostrar como subtitulo en el bottom sheet |
| `primaryFields` | `Array` | Lista de campos a mostrar en la vista compacta |

### Estructura de primaryFields

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `field` | `String` | Nombre del campo (debe coincidir con una columna) |
| `label` | `String` | Etiqueta del campo |
| `position` | `String` | Posicion en la fila: `'left'` o `'right'` |
| `truncate` | `Number` | Opcional: max-width en pixeles para truncar texto |

### Comportamiento Automatico

Si **no** se envia `mobileConfig` desde el backend, el componente genera una configuracion automatica:

- Usa las primeras 2 columnas visibles para el lado izquierdo
- Usa las siguientes 2 columnas para el lado derecho
- Si hay columna `is_active` (interruptor "Activo"), va siempre a la derecha, en lugar de la cuarta columna
- El titulo del bottom sheet es la primera columna
- El subtitulo es la segunda columna

## Clase por fila (`_row_class`)

Cada registro puede traer un campo especial **`_row_class`** que XTableServer
aplica como clase CSS a su fila (`<q-tr>`), tanto en escritorio como en móvil.
Sirve para resaltar/atenuar filas según su estado (inhabilitado, vencido, etc.)
sin agregar columnas.

El backend lo incluye en cada record; el valor es el nombre de una clase CSS
que **define el proyecto consumidor** (XTableServer solo la aplica):

```json
{
  "id": 12,
  "name": "Producto X",
  "_row_class": "x-row-inactive"
}
```

```css
/* en el proyecto consumidor */
.x-row-inactive { opacity: .55; }
```

Si un registro no trae `_row_class`, la fila se muestra normal. No colisiona con
el resaltado interno de selección (`x-table-row--selected`).

## Filtros

Los filtros se configuran en el backend:

```php
'filters' => [
    [
        'name' => 'status',
        'label' => 'Estado',
        'type' => 'select',           // 'select', 'input', 'tree-select'
        'options' => [...],
        'default' => 'all',
        'includeAllOption' => true,
        'class' => 'col-12 col-md-3',
    ],
    [
        'name' => 'category',
        'label' => 'Categoria',
        'type' => 'select',
        'dependsOn' => 'status',      // Filtro dependiente
        'remote' => [
            'url' => '/api/categories',
            'method' => 'post',
            'params' => ['status_id' => '$parent'],
        ],
    ],
]
```

## Acciones de Fila

Las acciones se definen por fila en el backend:

```php
// En cada fila de data
'actions' => [
    [
        'action' => 'edit',
        'label' => 'Editar',
        'icon' => 'fal fa-edit',
        'color' => 'primary',
    ],
    [
        'type' => 'group',
        'icon' => 'fal fa-ellipsis-v',
        'buttons' => [
            ['action' => 'view', 'label' => 'Ver', 'icon' => 'fal fa-eye'],
            ['type' => 'separator'],
            ['action' => 'delete', 'label' => 'Eliminar', 'icon' => 'fal fa-trash', 'color' => 'negative'],
        ],
    ],
]
```

## Interruptor "Activo" (v2.25.0)

Convención de todas las tablas para activar y desactivar: la columna `Column::isActive()` ("Activo") con
`Cell::activeToggle($row, $puedeCambiar)` del paquete `quirosys/datatable`. No se usan botones de activar.

- **Apagar** abre el diálogo de confirmación de la tabla: `GET /{resource}/record-active/{id}` (título y texto)
  y `POST /{resource}/active` con `{ id, is_active: false }`.
- **Encender** va directo, sin diálogo: `POST /{resource}/active` con `{ id, is_active: true }`.
- El interruptor no se mueve hasta que el servidor confirma; la tabla se refresca con el valor real.
- Sin permiso (`$puedeCambiar = false`) se ve bloqueado.
- Una acción propia (`Cell::activeToggle($row, true, 'toggle-active')`) llega al evento `actions` de la página
  en los dos sentidos, con `value` (lo que pidió: `true` o `false`): sirve para un diálogo propio (p. ej. una
  baja con fecha).

La celda es `{ type_input: 'component', component: 'XToggle', action: { type: 'active', action } }`.

## Botones de Header

```php
'headerButtons' => [
    [
        'action' => 'create',
        'label' => 'Nuevo',
        'icon' => 'fal fa-plus',
        'color' => 'primary',
    ],
    [
        'action' => 'export',
        'icon' => 'fal fa-file-excel',
    ],
    [
        'action' => 'refresh',
        'icon' => 'fal fa-sync',
    ],
]
```

## Vista Movil

En dispositivos moviles (`$q.platform.is.mobile || $q.screen.lt.lg`):

1. **Tabla compacta**: Las filas se muestran en formato compacto con campos izquierda/derecha
2. **Bottom Sheet**: Al hacer click en una fila, se abre un menu inferior con todas las acciones
3. **Sin header de tabla**: Se oculta el encabezado para ahorrar espacio

## Componentes Internos

- `XCellColumnRenderer.vue` - Renderiza celdas en vista desktop
- `XCellRenderer.vue` - Renderiza celdas en vista movil
- `XMobileMenuAction.vue` - Bottom sheet para acciones movil
- `MobileLinkAction.vue` - Item de accion en el bottom sheet
- `MobileLinkTitle.vue` - Titulo del bottom sheet
