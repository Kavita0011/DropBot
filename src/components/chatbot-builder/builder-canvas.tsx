"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { FlowNode } from "./flow-node"
import { useChatbotStore } from "@/store/chatbot-store"
import type { FlowNode as FlowNodeType, FlowEdge } from "@/types"
import { Plus, Minus, Maximize2, Trash2 } from "lucide-react"

const SNAP = 20
const NODE_WIDTH = 224
const NODE_OUTPUT_Y = 96
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2

function snapToGrid(val: number): number {
  return Math.round(val / SNAP) * SNAP
}

function ConnectionLines({ nodes, edges, connectingFrom, mousePos, selectedEdgeId, onEdgeClick, onEdgeDelete }: {
  nodes: FlowNodeType[]; edges: FlowEdge[]; connectingFrom: string | null
  mousePos: { x: number; y: number } | null
  selectedEdgeId: string | null; onEdgeClick: (id: string) => void; onEdgeDelete: (id: string) => void
}) {
  return (
    <svg className="absolute inset-0 z-10" style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      {edges.map((edge) => {
        const source = nodes.find((n) => n.id === edge.source)
        const target = nodes.find((n) => n.id === edge.target)
        if (!source || !target) return null
        const x1 = source.position.x + NODE_WIDTH / 2
        const y1 = source.position.y + NODE_OUTPUT_Y
        const x2 = target.position.x + NODE_WIDTH / 2
        const y2 = target.position.y
        const midY = (y1 + y2) / 2
        const isSelected = selectedEdgeId === edge.id
        return (
          <g key={edge.id}>
            <path
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              fill="none"
              stroke={isSelected ? "#2563eb" : "#3b82f6"}
              strokeWidth={isSelected ? 3.5 : 2.5}
              strokeDasharray={isSelected ? "none" : "none"}
              style={{ cursor: "pointer", pointerEvents: "stroke" }}
              onClick={() => onEdgeClick(edge.id)}
            />
            <circle cx={x2} cy={y2} r={isSelected ? 6 : 4} fill={isSelected ? "#2563eb" : "#3b82f6"} style={{ pointerEvents: "none" }} />
            {edge.label && (
              <text x={(x1 + x2) / 2} y={midY - 10} textAnchor="middle" fill="#6b7280" fontSize="10" style={{ pointerEvents: "none" }}>{edge.label}</text>
            )}
            {isSelected && (
              <g
                onClick={(e) => { e.stopPropagation(); onEdgeDelete(edge.id) }}
                style={{ cursor: "pointer", pointerEvents: "all" }}
              >
                <rect x={(x1 + x2) / 2 - 10} y={midY - 20} width="20" height="20" rx="4" fill="#ef4444" />
                <text x={(x1 + x2) / 2} y={midY - 6} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">✕</text>
              </g>
            )}
          </g>
        )
      })}
      {connectingFrom && nodes.find((n) => n.id === connectingFrom) && (() => {
        const src = nodes.find((n) => n.id === connectingFrom)!
        return (
          <g>
            {nodes.filter((n) => n.id !== connectingFrom).map((n) => {
              const cx = n.position.x + NODE_WIDTH / 2
              const cy = n.position.y
              return (
                <circle key={`target-${n.id}`} cx={cx} cy={cy} r={10} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,2" style={{ pointerEvents: "none" }} />
              )
            })}
            {mousePos && (
              <line
                x1={src.position.x + NODE_WIDTH / 2}
                y1={src.position.y + NODE_OUTPUT_Y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5,3"
                style={{ pointerEvents: "none" }}
              />
            )}
          </g>
        )
      })()}
    </svg>
  )
}

function GridPattern({ zoom }: { zoom: number }) {
  const dotSize = Math.max(0.3, 0.5 / Math.sqrt(zoom))
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <defs>
        <pattern id="grid" width={SNAP} height={SNAP} patternUnits="userSpaceOnUse">
          <circle cx={SNAP / 2} cy={SNAP / 2} r={dotSize} fill="#cbd5e1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

export function BuilderCanvas({ nodes }: { nodes: FlowNodeType[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" })
  const store = useChatbotStore()
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const pinchDist = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const applyTransform = useCallback((z: number, p: { x: number; y: number }) => {
    const el = canvasRef.current?.firstElementChild as HTMLElement | null
    if (el) el.style.transform = `scale(${z}) translate(${p.x}px, ${p.y}px)`
  }, [])

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom }
  }, [zoom, pan])

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = -e.deltaY * 0.001
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta * zoom))
    const ratio = newZoom / zoom
    setPan((prev) => ({ x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio }))
    setZoom(newZoom)
  }, [zoom])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-node-id]") || (e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("svg")) return
    if (e.button !== 0) return
    isPanning.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setIsDragging(false)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (connectingFrom) {
      const coords = getCanvasCoords(e.clientX, e.clientY)
      setMousePos(coords)
      return
    }
    if (!isPanning.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }, [connectingFrom, getCanvasCoords])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (connectingFrom) {
      const targetEl = (e.target as HTMLElement).closest("[data-node-id]")
      if (targetEl) {
        const targetId = targetEl.getAttribute("data-node-id")
        if (targetId && targetId !== connectingFrom) {
          const exists = store.edges.some((ed) => ed.source === connectingFrom && ed.target === targetId)
          if (!exists) store.addEdge({ id: `e-${connectingFrom}-${targetId}`, source: connectingFrom, target: targetId })
        }
      }
      setConnectingFrom(null)
      setMousePos(null)
      return
    }
    isPanning.current = false
    setIsDragging(false)
  }, [connectingFrom, store.edges, store.addEdge])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    if ((e.target as HTMLElement).closest("[data-node-id]") || (e.target as HTMLElement).closest("svg")) return
    store.selectNode(null)
    store.selectEdge(null)
    setConnectingFrom(null)
  }, [isDragging, store])

  const handlePortMouseDown = useCallback((sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectingFrom === sourceId) { setConnectingFrom(null); setMousePos(null); return }
    if (connectingFrom) {
      if (sourceId !== connectingFrom) {
        const exists = store.edges.some((ed) => ed.source === connectingFrom && ed.target === sourceId)
        if (!exists) store.addEdge({ id: `e-${connectingFrom}-${sourceId}`, source: connectingFrom, target: sourceId })
      }
      setConnectingFrom(null)
      setMousePos(null)
    } else {
      setConnectingFrom(sourceId)
      const coords = getCanvasCoords(e.clientX, e.clientY)
      setMousePos(coords)
    }
  }, [connectingFrom, store.edges, store.addEdge, getCanvasCoords])

  const handleEdgeClick = useCallback((edgeId: string) => {
    store.selectEdge(edgeId)
  }, [store])

  const handleEdgeDelete = useCallback((edgeId: string) => {
    store.removeEdge(edgeId)
  }, [store])

  useEffect(() => { applyTransform(zoom, pan) }, [zoom, pan, applyTransform])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const zoomIn = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) { setZoom((z) => Math.min(z + 0.1, MAX_ZOOM)); return }
    const cx = rect.width / 2; const cy = rect.height / 2
    setZoom((z) => { const nz = Math.min(z + 0.1, MAX_ZOOM); const r = nz / z; setPan((p) => ({ x: cx - (cx - p.x) * r, y: cy - (cy - p.y) * r })); return nz })
  }, [])

  const zoomOut = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) { setZoom((z) => Math.max(z - 0.1, MIN_ZOOM)); return }
    const cx = rect.width / 2; const cy = rect.height / 2
    setZoom((z) => { const nz = Math.max(z - 0.1, MIN_ZOOM); const r = nz / z; setPan((p) => ({ x: cx - (cx - p.x) * r, y: cy - (cy - p.y) * r })); return nz })
  }, [])

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  const cursorStyle = isDragging ? "grabbing" : connectingFrom ? "crosshair" : "grab"

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#f8fafc] select-none">
      <div
        ref={canvasRef}
        className={cn("absolute inset-0", cursorStyle === "grab" && "cursor-grab", cursorStyle === "grabbing" && "cursor-grabbing", cursorStyle === "crosshair" && "cursor-crosshair")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCanvasClick}
      >
        <div ref={setNodeRef} className={cn("relative w-full h-full", isOver && "bg-blue-50/30")} style={{ minWidth: "3200px", minHeight: "2400px" }}>
          <GridPattern zoom={zoom} />
          <ConnectionLines nodes={nodes} edges={store.edges} connectingFrom={connectingFrom} mousePos={mousePos} selectedEdgeId={store.selectedEdgeId} onEdgeClick={handleEdgeClick} onEdgeDelete={handleEdgeDelete} />

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-white/80 rounded-2xl px-8 py-6 shadow-sm border border-dashed border-gray-300">
                <p className="text-base font-medium text-gray-400">Drag nodes from the left panel</p>
                <p className="text-xs text-gray-300 mt-2">Click and drag from a node&apos;s bottom dot to connect</p>
              </div>
            </div>
          )}

          {nodes.map((node) => (
            <div key={node.id} data-node-id={node.id} className="absolute" style={{ left: node.position.x, top: node.position.y }}>
              <FlowNode node={node} />
              {node.type !== "end" && (
                <button
                  onPointerDown={(e) => handlePortMouseDown(node.id, e)}
                  className={cn(
                    "absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full border-2 border-white shadow-md transition-all duration-200 hover:scale-125 hover:shadow-lg",
                    connectingFrom === node.id ? "bg-green-500 scale-125 ring-2 ring-green-300" : store.edges.some((e) => e.source === node.id) ? "bg-blue-500" : "bg-gray-300 hover:bg-blue-400"
                  )}
                  title={connectingFrom === node.id ? "Drop on target node" : "Drag to connect"}
                >
                  <div className={cn("w-2 h-2 rounded-full mx-auto mt-[5px]", connectingFrom === node.id ? "bg-white" : store.edges.some((e) => e.source === node.id) ? "bg-white/80" : "bg-white/60")} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-40">
        <button onClick={zoomOut} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Minus className="h-4 w-4" /></button>
        <span className="text-xs font-medium text-gray-600 min-w-[40px] text-center w-10">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Plus className="h-4 w-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button onClick={resetView} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Reset view"><Maximize2 className="h-4 w-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <span className="text-[10px] text-gray-400 px-1">Ctrl+Scroll | Drag to pan</span>
      </div>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm font-medium shadow-lg z-40">
          Drop on a target node to connect
        </div>
      )}

      {store.selectedEdgeId && (
        <div className="absolute top-4 right-72 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg z-40 flex items-center gap-3 text-sm">
          <span className="text-gray-500">Edge selected</span>
          <button onClick={() => store.removeEdge(store.selectedEdgeId!)} className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}