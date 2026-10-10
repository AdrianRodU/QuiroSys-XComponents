<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import dagre from '@dagrejs/dagre'

/**
 * XLineageTree — diagrama de linaje/flujo genérico basado en Vue Flow + dagre.
 *
 * Recibe un ÁRBOL de datos (nodos anidados con `children`) y lo pinta como un
 * grafo dirigido con layout automático. Es AGNÓSTICO al origen de los datos:
 * no hace peticiones — el proyecto consumidor le pasa el árbol ya armado.
 *
 * Cada nodo del árbol es un objeto libre; el nodo por defecto lee estos campos
 * (todos opcionales salvo `label`):
 *   label       string   título del nodo
 *   current     bool     resalta el nodo (borde primario)
 *   voided      bool     estilo "anulado" (rojo + tachado + arista punteada)
 *   badge       string   texto del badge de estado
 *   badgeColor  string   color de fondo del badge
 *   captions    string[] textos pequeños bajo el título (montos, fechas…)
 *   note        string   nota inferior (p. ej. motivo de anulación)
 *   children    array    hijos (configurable con `childrenKey`)
 *
 * Para control total del nodo, usa el slot #node="{ data }".
 */
const props = defineProps({
  /** Árbol a pintar: un nodo raíz (objeto) o varias raíces (array). */
  tree: { type: [Object, Array], default: null },

  /** Clave única del nodo: nombre de campo (String) o función (node)=>string. */
  nodeKey: { type: [String, Function], default: 'id' },
  /** Campo con los hijos. */
  childrenKey: { type: String, default: 'children' },

  /** Dirección del layout dagre. */
  direction: { type: String, default: 'TB' }, // 'TB' | 'BT' | 'LR' | 'RL'
  nodeWidth: { type: Number, default: 210 },
  nodeHeight: { type: Number, default: 66 },
  nodeSep: { type: Number, default: 30 },
  rankSep: { type: Number, default: 55 },

  /** Alto del contenedor del diagrama. */
  height: { type: String, default: '420px' },
  bordered: { type: Boolean, default: true },

  /**
   * Vue Flow monta los nodos aun con el contenedor oculto (p. ej. dentro de un
   * diálogo o un tab inactivo) y la medición inicial da 0×0 → quedan
   * visibility:hidden. Cuando el componente se vuelve visible, pon `active` en
   * true para re-medir y encuadrar. Si el diagrama siempre está visible, déjalo
   * en true (default).
   */
  active: { type: Boolean, default: true },
  fitPadding: { type: Number, default: 0.15 },
  minZoom: { type: Number, default: 0.4 },
  maxZoom: { type: Number, default: 1.5 },

  edgeType: { type: String, default: 'smoothstep' },
  /** Override del estilo de arista: (nodoDestino) => objeto de estilo. */
  edgeStyle: { type: Function, default: null },

  /** Mensaje cuando no hay nada que mostrar. */
  emptyText: { type: String, default: 'Sin datos para mostrar.' },
})

const emit = defineEmits(['node-click', 'ready'])

// API de INSTANCIA (no pasar :nodes/:edges como props): en modo prop-controlado
// Vue Flow no aplica los cambios de dimensiones y los nodos quedan
// visibility:hidden para siempre. setNodes/setEdges lo maneja internamente.
const { setNodes, setEdges, fitView, updateNodeInternals, onNodeClick } = useVueFlow()

const hasNodes = ref(false)
const isEmpty = computed(() => !hasNodes.value)

function keyOf(node) {
  if (typeof props.nodeKey === 'function') return String(props.nodeKey(node))
  return String(node?.[props.nodeKey])
}

/** Aplana el/los árbol(es) a nodos+aristas y calcula posiciones con dagre. */
function relayout() {
  const roots = Array.isArray(props.tree) ? props.tree : (props.tree ? [props.tree] : [])
  const flatNodes = []
  const flatEdges = []
  const seen = new Set()

  const walk = (n, parentKey) => {
    if (!n) return
    let key = keyOf(n)
    // Evita colisiones de clave (ids repetidos entre "tipos").
    if (seen.has(key)) key = `${key}#${flatNodes.length}`
    seen.add(key)

    // width/height explícitos: sin ellos Vue Flow espera al ResizeObserver
    // para medir el nodo y dentro de un contenedor oculto esa medición no
    // llega — los nodos quedan visibility:hidden para siempre.
    flatNodes.push({
      id: key, type: 'x', position: { x: 0, y: 0 },
      width: props.nodeWidth, height: props.nodeHeight, data: n,
    })

    if (parentKey) {
      const style = props.edgeStyle
        ? props.edgeStyle(n)
        : (n.voided ? { stroke: '#f44336', strokeDasharray: '6 4' } : { stroke: '#9e9e9e' })
      flatEdges.push({
        id: `${parentKey}->${key}`, source: parentKey, target: key,
        type: props.edgeType, animated: !!n.current, style,
      })
    }
    ;(n[props.childrenKey] || []).forEach((c) => walk(c, key))
  }
  roots.forEach((r) => walk(r, null))

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: props.direction, nodesep: props.nodeSep, ranksep: props.rankSep })
  flatNodes.forEach((n) => g.setNode(n.id, { width: props.nodeWidth, height: props.nodeHeight }))
  flatEdges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  flatNodes.forEach((n) => {
    const pos = g.node(n.id)
    n.position = { x: pos.x - props.nodeWidth / 2, y: pos.y - props.nodeHeight / 2 }
  })

  setNodes(flatNodes)
  setEdges(flatEdges)
  hasNodes.value = flatNodes.length > 0

  // Re-medir + encuadrar tras el montaje (contenedor pudo estar oculto).
  nextTick(() => setTimeout(() => {
    updateNodeInternals()
    fit()
    emit('ready')
  }, 80))
}

/** Reencuadra el diagrama al viewport. */
function fit() {
  if (hasNodes.value) fitView({ padding: props.fitPadding })
}

onNodeClick(({ node }) => emit('node-click', node?.data))

watch(
  () => [props.tree, props.active],
  ([, active]) => { if (active) relayout() },
  { immediate: true, deep: true },
)

defineExpose({ fit, relayout })
</script>

<template>
  <div class="x-lineage-tree">
    <div
      v-show="!isEmpty"
      class="x-lineage-tree__canvas"
      :class="{ 'x-lineage-tree__canvas--bordered': bordered }"
      :style="{ height }"
    >
      <VueFlow
        :nodes-draggable="false"
        :nodes-connectable="false"
        :edges-updatable="false"
        :zoom-on-double-click="false"
        :min-zoom="minZoom"
        :max-zoom="maxZoom"
        fit-view-on-init
      >
        <template #node-x="{ data }">
          <!-- Nodo custom del consumidor; si no, el nodo por defecto. -->
          <slot name="node" :data="data">
            <div
              class="x-lineage-node"
              :class="{
                'x-lineage-node--current': data.current,
                'x-lineage-node--voided': data.voided,
              }"
              :style="{ width: nodeWidth + 'px' }"
            >
              <div class="x-lineage-node__title">
                <span :class="{ 'x-lineage-node__title--strike': data.voided }">{{ data.label }}</span>
              </div>
              <div v-if="data.badge || (data.captions && data.captions.length)" class="x-lineage-node__meta">
                <span
                  v-if="data.badge"
                  class="x-lineage-node__badge"
                  :style="{ backgroundColor: data.badgeColor || '#9e9e9e' }"
                >{{ data.badge }}</span>
                <span
                  v-for="(c, i) in (data.captions || [])"
                  :key="i"
                  class="x-lineage-node__caption"
                >{{ c }}</span>
              </div>
              <div v-if="data.note" class="x-lineage-node__note">{{ data.note }}</div>
            </div>
          </slot>
        </template>
      </VueFlow>
    </div>

    <div v-if="isEmpty" class="x-lineage-tree__empty">
      <slot name="empty">{{ emptyText }}</slot>
    </div>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';

.x-lineage-tree__canvas {
  border-radius: 8px;
  overflow: hidden;
}
.x-lineage-tree__canvas--bordered {
  border: 1px solid var(--x-border, #e0e0e0);
}
.x-lineage-tree__empty {
  padding: 16px;
  font-size: 13px;
  color: var(--x-text-muted, #6b7280);
}

/* Nodo por defecto */
.x-lineage-node {
  background: var(--x-surface, #fff);
  border: 1px solid var(--x-border-strong, #d0d0d0);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
}
.x-lineage-node--current {
  border: 2px solid var(--q-primary, #1976d2);
  box-shadow: 0 1px 6px rgba(25, 118, 210, 0.25);
}
.x-lineage-node--voided {
  background: var(--x-tone-red-soft, #fff5f5);
  border-color: #f44336;
}
.x-lineage-node__title {
  font-weight: 600;
  font-size: 12.5px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.x-lineage-node__title--strike { text-decoration: line-through; }
.x-lineage-node__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.x-lineage-node__badge {
  color: #fff;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 11px;
  line-height: 1.4;
}
.x-lineage-node__caption { color: var(--x-text-muted, #6b7280); font-size: 11px; }
.x-lineage-node__note {
  margin-top: 4px;
  color: var(--x-tone-red-text, #c62828);
  font-size: 11px;
}
</style>
