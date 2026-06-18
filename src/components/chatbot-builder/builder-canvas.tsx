"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { FlowNode } from "./flow-node"
import { useChatbotStore } from "@/store/chatbot-store"
import type { FlowNode as FlowNodeType, FlowEdge } from "@/types"
import { Plus, Minus, Maximize2, Minimize2, Trash2, Grid3X3, MousePointerClick } from "lucide-react"

const SNAP = 20
const NODE_WIDTH = 224
const NODE_OUTPUT_Y = 96
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2

function snapToGrid(val: number): number { return Math.round(val / SNAP) * SNAP }

function ConnectionLines({ nodes, edges, connectingFrom, mousePos, selectedEdgeId, onEdgeClick, onEdgeDelete }: {
  nodes: FlowNodeType[]; edges: FlowEdge[]; connectingFrom: string | null
  mousePos: { x: number; y: number } | null
  selectedEdgeId: string | null; onEdgeClick: (id: string) => void; onEdgeDelete: (id: string) => void
}) {
  const markerId = "arrowhead"
  return (
    <svg className="absolute inset-0 z-10" style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
      <defs>
        <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
        <marker id={`${markerId}-selected`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
        </marker>
      </defs>
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
              strokeWidth={isSelected ? 3 : 2}
              markerEnd={`url(#${isSelected ? `${markerId}-selected` : markerId})`}
              style={{ cursor: "pointer", pointerEvents: "stroke" }}
              onClick={() => onEdgeClick(edge.id)}
            />
            {isSelected && (
              <g onClick={(e) => { e.stopPropagation(); onEdgeDelete(edge.id) }} style={{ cursor: "pointer", pointerEvents: "all" }}>
                <rect x={(x1 + x2) / 2 - 10} y={midY - 20} width="20" height="20" rx="4" fill="#ef4444" />
                <text x={(x1 + x2) / 2} y={midY - 6} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">✕</text>
              </g>
            )}
            {edge.label && (
              <text x={(x1 + x2) / 2} y={midY - 10} textAnchor="middle" fill="#6b7280" fontSize="10" style={{ pointerEvents: "none" }}>{edge.label}</text>
            )}
          </g>
        )
      })}
      {connectingFrom && nodes.find((n) => n.id === connectingFrom) && (() => {
        const src = nodes.find((n) => n.id === connectingFrom)!
        return (
          <g>
            {nodes.filter((n) => n.id !== connectingFrom && n.type !== "end").map((n) => {
              const cx = n.position.x + NODE_WIDTH / 2
              const cy = n.position.y
              return (
                <circle key={`target-${n.id}`} cx={cx} cy={cy} r={10} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,2" style={{ pointerEvents: "none" }} />
              )
            })}
            {mousePos && (
              <line
                x1={src.position.x + NODE_WIDTH / 2} y1={src.position.y + NODE_OUTPUT_Y}
                x2={mousePos.x} y2={mousePos.y}
                stroke="#3b82f6" strokeWidth={2} strokeDasharray="5,3"
                markerEnd={`url(#${markerId})`}
                style={{ pointerEvents: "none" }}
              />
            )}
          </g>
        )
      })()}
    </svg>
  )
}

function GridPattern({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.5 }}>
      <defs>
        <pattern id="grid" width={SNAP} height={SNAP} patternUnits="userSpaceOnUse">
          <circle cx={SNAP / 2} cy={SNAP / 2} r={0.4} fill="#94a3b8" />
        </pattern>
        <pattern id="grid-lg" width={SNAP * 5} height={SNAP * 5} patternUnits="userSpaceOnUse">
          <circle cx={0} cy={0} r={0.6} fill="#64748b" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <rect width="100%" height="100%" fill="url(#grid-lg)" />
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
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number } | null>(null)
  const [selectRect, setSelectRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const selectStart = useRef<{ x: number; y: number } | null>(null)

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
    if (!e.ctrlKey && !e.metaKey) { return }
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
    setContextMenu(null)
    const target = e.target as HTMLElement
    if (target.closest("[data-node-id]") || target.closest("button") || target.closest("svg") || target.closest("[data-port]")) return
    if (e.button !== 0) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = (e.clientX - rect.left - pan.x) / zoom
    const cy = (e.clientY - rect.top - pan.y) / zoom

    if (e.shiftKey) {
      selectStart.current = { x: e.clientX, y: e.clientY }
      setSelectRect({ x1: cx, y1: cy, x2: cx, y2: cy })
      return
    }

    isPanning.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setIsDragging(false)
  }, [zoom, pan])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (connectingFrom) {
      setMousePos(getCanvasCoords(e.clientX, e.clientY))
      return
    }
    if (selectStart.current) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const cx = (e.clientX - rect.left - pan.x) / zoom
      const cy = (e.clientY - rect.top - pan.y) / zoom
      const startCanvas = getCanvasCoords(selectStart.current.x, selectStart.current.y)
      setSelectRect({ x1: startCanvas.x, y1: startCanvas.y, x2: cx, y2: cy })
      return
    }
    if (!isPanning.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }, [connectingFrom, zoom, pan, getCanvasCoords])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (selectStart.current && selectRect) {
      const x1 = Math.min(selectRect.x1, selectRect.x2)
      const y1 = Math.min(selectRect.y1, selectRect.y2)
      const x2 = Math.max(selectRect.x1, selectRect.x2)
      const y2 = Math.max(selectRect.y1, selectRect.y2)
      const selected = nodes.filter((n) => n.position.x >= x1 && n.position.x + NODE_WIDTH <= x2 && n.position.y >= y1 && n.position.y + 130 <= y2)
      if (selected.length > 0) {
        store.selectNode(selected[0].id)
        const allIds = selected.map((n) => n.id)
        store.toggleNodeSelection(allIds[0]) // not ideal but sets the array
      }
      selectStart.current = null
      setSelectRect(null)
      return
    }
    if (connectingFrom) {
      const targetEl = (e.target as HTMLElement).closest("[data-node-id]")
      if (targetEl) {
        const targetId = targetEl.getAttribute("data-node-id")
        if (targetId && targetId !== connectingFrom) {
          store.addEdge({ id: `e-${connectingFrom}-${targetId}`, source: connectingFrom, target: targetId })
        }
      }
      setConnectingFrom(null)
      setMousePos(null)
      return
    }
    isPanning.current = false
    setIsDragging(false)
  }, [connectingFrom, selectRect, nodes, store, getCanvasCoords])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    const target = e.target as HTMLElement
    if (target.closest("[data-node-id]") || target.closest("svg") || target.closest("[data-port]")) return
    if (selectStart.current) return
    store.selectNode(null)
    store.selectEdge(null)
    setConnectingFrom(null)
  }, [isDragging, store])

  const handlePortMouseDown = useCallback((sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (connectingFrom === sourceId) { setConnectingFrom(null); setMousePos(null); return }
    if (connectingFrom) {
      if (sourceId !== connectingFrom) store.addEdge({ id: `e-${connectingFrom}-${sourceId}`, source: connectingFrom, target: sourceId })
      setConnectingFrom(null); setMousePos(null)
    } else {
      setConnectingFrom(sourceId)
      setMousePos(getCanvasCoords(e.clientX, e.clientY))
    }
  }, [connectingFrom, store, getCanvasCoords])

  const handleEdgeClick = useCallback((edgeId: string) => store.selectEdge(edgeId), [store])
  const handleEdgeDelete = useCallback((edgeId: string) => store.removeEdge(edgeId), [store])

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

  const zoomToFit = useCallback(() => {
    if (nodes.length === 0) { resetView(); return }
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const minX = Math.min(...nodes.map((n) => n.position.x)) - 60
    const minY = Math.min(...nodes.map((n) => n.position.y)) - 60
    const maxX = Math.max(...nodes.map((n) => n.position.x + NODE_WIDTH)) + 60
    const maxY = Math.max(...nodes.map((n) => n.position.y + 130)) + 60
    const w = maxX - minX
    const h = maxY - minY
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(rect.width / w, rect.height / h) * 0.9))
    const newPan = { x: (rect.width - w * newZoom) / 2 - minX * newZoom, y: (rect.height - h * newZoom) / 2 - minY * newZoom }
    setZoom(newZoom); setPan(newPan)
  }, [nodes])

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  useEffect(() => { applyTransform(zoom, pan) }, [zoom, pan, applyTransform])
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  useEffect(() => {
    if (!contextMenu) return
    const handler = () => setContextMenu(null)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [contextMenu])

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
        onContextMenu={(e) => { e.preventDefault(); const coords = getCanvasCoords(e.clientX, e.clientY); setContextMenu({ x: e.clientX, y: e.clientY, canvasX: coords.x, canvasY: coords.y }) }}
      >
        <div ref={setNodeRef} className={cn("relative w-full h-full", isOver && "bg-blue-50/30")} style={{ minWidth: "3200px", minHeight: "2400px" }}>
          <GridPattern show={store.showGrid} />
          <ConnectionLines nodes={nodes} edges={store.edges} connectingFrom={connectingFrom} mousePos={mousePos} selectedEdgeId={store.selectedEdgeId} onEdgeClick={handleEdgeClick} onEdgeDelete={handleEdgeDelete} />

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-white/90 rounded-2xl px-8 py-8 shadow-md border border-gray-200 max-w-sm">
                <MousePointerClick className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <p className="text-base font-semibold text-gray-700">Start Building Your Flow</p>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">Drag a node from the left panel to begin.<br />Click the bottom dot to connect nodes.</p>
                <div className="mt-4 flex gap-2 justify-center text-[10px] text-gray-300">
                  <span className="bg-gray-50 px-2 py-1 rounded">Ctrl+Scroll Zoom</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Drag to Pan</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">Shift+Drag Select</span>
                </div>
              </div>
            </div>
          )}

          {nodes.map((node) => (
            <div key={node.id} data-node-id={node.id} className="absolute" style={{ left: node.position.x, top: node.position.y }}>
              <FlowNode node={node} />
              {node.type !== "end" && (
                <button
                  data-port="true"
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

          {selectRect && (
            <div className="absolute border-2 border-blue-400 bg-blue-100/20 pointer-events-none z-50" style={{
              left: Math.min(selectRect.x1, selectRect.x2),
              top: Math.min(selectRect.y1, selectRect.y2),
              width: Math.abs(selectRect.x2 - selectRect.x1),
              height: Math.abs(selectRect.y2 - selectRect.y1),
            }} />
          )}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-40">
        <button onClick={zoomOut} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Minus className="h-4 w-4" /></button>
        <span className="text-xs font-medium text-gray-600 min-w-[36px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={zoomIn} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Plus className="h-4 w-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <button onClick={zoomToFit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Fit to screen"><Maximize2 className="h-4 w-4" /></button>
        <button onClick={resetView} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="Reset zoom"><Minimize2 className="h-4 w-4" /></button>
        <div className="w-px h-5 bg-gray-200 mx-0.5" />
        <button onClick={() => store.toggleGrid()} className={cn("p-1.5 rounded-lg transition-colors", store.showGrid ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-400")} title="Toggle grid"><Grid3X3 className="h-4 w-4" /></button>
        <button onClick={() => store.toggleSnap()} className={cn("p-1.5 rounded-lg transition-colors", store.snapToGrid ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100 text-gray-400")} title="Toggle snap"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="1"/></svg></button>
      </div>

      {connectingFrom && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm font-medium shadow-lg z-40 flex items-center gap-2">
          <span className="animate-pulse">●</span> Drop on a target node to connect
        </div>
      )}

      {store.selectedEdgeId && (
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg z-40 flex items-center gap-3 text-sm">
          <span className="text-gray-500">Edge selected</span>
          <button onClick={() => store.removeEdge(store.selectedEdgeId!)} className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {contextMenu && (
        <div className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[160px]" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50" onClick={() => { setContextMenu(null); store.pasteNodes(contextMenu.canvasX, contextMenu.canvasY) }}>
            <Plus className="h-3.5 w-3.5" /> Paste here
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { zoomToFit(); setContextMenu(null) }}>
            <Maximize2 className="h-3.5 w-3.5" /> Fit to screen
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { resetView(); setContextMenu(null) }}>
            <Minimize2 className="h-3.5 w-3.5" /> Reset zoom
          </button>
        </div>
      )}
    </div>
  )
}

