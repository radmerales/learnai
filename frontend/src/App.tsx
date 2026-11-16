import { useMemo, useRef, useState, type PointerEvent } from "react"

type Node = {
  id: string
  label: string
  x: number
  y: number
  parentId: string | null
}

const NODE_W = 140
const NODE_H = 44

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; ox: number; oy: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const idCounter = useRef(1)

  const selected = nodes.find((n) => n.id === selectedId) ?? null

  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: clientX, y: clientY }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: clientX, y: clientY }
    const p = pt.matrixTransform(ctm.inverse())
    return { x: p.x, y: p.y }
  }

  function addRoot() {
    const id = uid()
    const label = `Topic ${idCounter.current++}`
    setNodes((prev) => [...prev, { id, label, x: 420, y: 120 + prev.length * 30, parentId: null }])
    setSelectedId(id)
  }

  function addChild() {
    if (!selected) return
    const id = uid()
    const label = `Node ${idCounter.current++}`
    const childCount = nodes.filter((n) => n.parentId === selected.id).length
    setNodes((prev) => [
      ...prev,
      {
        id,
        label,
        x: selected.x + 200,
        y: selected.y + childCount * 70 - 20,
        parentId: selected.id,
      },
    ])
    setSelectedId(id)
  }

  function deleteSelected() {
    if (!selected) return
    const toDelete = new Set<string>()
    function collect(id: string) {
      toDelete.add(id)
      nodes.forEach((n) => {
        if (n.parentId === id) collect(n.id)
      })
    }
    collect(selected.id)
    setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)))
    setSelectedId(null)
  }

  function renameSelected(label: string) {
    if (!selected) return
    setNodes((prev) => prev.map((n) => (n.id === selected.id ? { ...n, label } : n)))
  }

  function onNodePointerDown(e: PointerEvent<SVGGElement>, id: string) {
    e.stopPropagation()
    const n = nodes.find((x) => x.id === id)
    if (!n) return
    const p = toSvgPoint(e.clientX, e.clientY)
    setSelectedId(id)
    setDrag({ id, ox: p.x - n.x, oy: p.y - n.y })
    ;(e.currentTarget as SVGGElement).setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    if (!drag) return
    const p = toSvgPoint(e.clientX, e.clientY)
    setNodes((prev) => prev.map((n) => (n.id === drag.id ? { ...n, x: p.x - drag.ox, y: p.y - drag.oy } : n)))
  }

  function onPointerUp() {
    setDrag(null)
  }

  const byId = useMemo(() => {
    const m = new Map<string, Node>()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  const edges = nodes.filter((n) => n.parentId && byId.has(n.parentId))

  return (
    <div className="flex h-full flex-col bg-paper text-ink">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline bg-surface px-6 py-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-mutedink">Mindmap MVP</p>
          <h1 className="text-2xl font-semibold leading-tight">Topic node network</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#1d1d1d]">
            Create nodes, branch into subnodes, and drag to arrange. Structure is a tree (no cycles).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addRoot}
            className="border border-ink bg-accent px-3 py-2 text-sm font-medium text-accentink hover:brightness-95"
          >
            + Root node
          </button>
          <button
            onClick={addChild}
            disabled={!selected}
            className="border border-hairline bg-paper px-3 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#e1e0dd]"
          >
            + Child node
          </button>
          <button
            onClick={deleteSelected}
            disabled={!selected}
            className="border border-hairline bg-paper px-3 py-2 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#e1e0dd]"
          >
            Delete
          </button>
          <label className="ml-2 flex items-center gap-2 text-sm">
            <span className="font-mono text-xs text-mutedink">Label</span>
            <input
              value={selected?.label ?? ""}
              onChange={(e) => renameSelected(e.target.value)}
              disabled={!selected}
              placeholder={selected ? "Node label" : "Select a node"}
              className="w-48 border border-hairline bg-paper px-2 py-2 text-sm text-ink placeholder:text-[#6b6a6a] disabled:cursor-not-allowed disabled:opacity-40"
            />
          </label>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {nodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="border border-hairline bg-surface px-6 py-5 text-center">
              <p className="font-medium">Empty canvas</p>
              <p className="mt-1 text-sm text-[#3f3e3e]">Click “+ Root node” to create your first topic.</p>
            </div>
          </div>
        )}
        <svg
          ref={svgRef}
          className="h-full w-full touch-none select-none"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onPointerDown={() => setSelectedId(null)}
        >
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#d8d7d3" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {edges.map((n) => {
            const p = byId.get(n.parentId!)!
            return (
              <line
                key={`e-${n.id}`}
                x1={p.x}
                y1={p.y}
                x2={n.x}
                y2={n.y}
                stroke="#6b6a6a"
                strokeWidth={2}
              />
            )
          })}
          {nodes.map((n) => {
            const isSel = n.id === selectedId
            return (
              <g
                key={n.id}
                transform={`translate(${n.x - NODE_W / 2}, ${n.y - NODE_H / 2})`}
                onPointerDown={(e) => onNodePointerDown(e, n.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  fill={isSel ? "#f5c518" : "#e1e0dd"}
                  stroke={isSel ? "#000000" : "#cbcac7"}
                  strokeWidth={isSel ? 2 : 1}
                />
                <text
                  x={NODE_W / 2}
                  y={NODE_H / 2 + 5}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="IBM Plex Sans, sans-serif"
                  fill={isSel ? "#040404" : "#000000"}
                >
                  {n.label.length > 16 ? n.label.slice(0, 15) + "…" : n.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <footer className="border-t border-hairline bg-surface px-6 py-2 font-mono text-xs text-mutedink">
        {selected ? (
          <span>
            Selected: <strong className="font-medium text-ink">{selected.label}</strong> · drag to move · add child to branch
          </span>
        ) : (
          <span>{nodes.length} node{nodes.length === 1 ? "" : "s"} · select a node to edit or branch</span>
        )}
      </footer>
    </div>
  )
}
