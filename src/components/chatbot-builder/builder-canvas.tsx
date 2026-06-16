"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { FlowNode } from "./flow-node"
import { useChatbotStore } from "@/store/chatbot-store"
import type { FlowNode as FlowNodeType, FlowEdge } from "@/types"
import { Plus, Minus, Maximize2 } from "lucide-react"

const SNAP = 20
const NODE_WIDTH = 224
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2

function ConnectionLines({ nodes, edges, connectingFrom }: { nodes: FlowNodeType[]; edges: FlowEdge[]; connectingFrom: string | null }) {
  return (
    <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: "100%", height: "100%" }}>
      {edges.map((edge) => {
        const source = nodes.find((n) => n.id === edge.source)
        const target = nodes.find((n) => n.id === edge.target)
        if (!source || !target) return null
        const x1 = source.position.x + NODE_WIDTH / 2
        const y1 = source.position.y + 96
        const x2 = target.position.x + NODE_WIDTH / 2
        const y2 = target.position.y
        const midY = (y1 + y2) / 2
        return (
          <g key={edge.id}>
            <path d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`} fill="none" stroke="#3b82f6" strokeWidth={2.5} />
            <circle cx={x2} cy={y2} r={4} fill="#3b82f6" />
            {edge.label && (
              <text x={(x1 + x2) / 2} y={midY - 10} textAnchor="middle" className="text-[10px] fill-gray-500" fontSize="10">{edge.label}</text>
            )}
          </g>
        )
      })}
      {connectingFrom && nodes.map((n) => {
        if (n.id === connectingFrom) return null
        const cx = n.position.x + NODE_WIDTH / 2
        const cy = n.position.y
        return (
          <g key={`target-${n.id}`}>
            <circle cx={cx} cy={cy} r={10} fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4,2" />
          </g>
        )
      })}
    </svg>
  )
}

function Port({ node, onStartConnect }: { node: FlowNodeType; onStartConnect: (id: string) => void }) {
  const edges = useChatbotStore((s) => s.edges)
  const connectingFrom = useChatbotStore((s) => s.selectedNodeId)
  const hasConnection = edges.some((e) => e.source === node.id)
  const isConnecting = connectingFrom === node.id
  if (node.type === "end") return null
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onStartConnect(node.id) }}
      className={cn(
        "absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 w-6 h-6 rounded-full border-2 border-white shadow-md transition-all duration-200 hover:scale-125",
        isConnecting ? "bg-green-500 scale-125 ring-2 ring-green-300" : hasConnection ? "bg-blue-500" : "bg-gray-300 hover:bg-blue-400"
      )}
      title={isConnecting ? "Click a target node to connect" : "Drag to connect"}
    >
      <div className={cn("w-2 h-2 rounded-full mx-auto mt-[5px]", isConnecting ? "bg-white" : hasConnection ? "bg-white/80" : "bg-white/60")} />
    </button>
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

export function BuilderCanvas({ nodes }: BuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" })
  const edges = useChatbotStore((s) => s.edges)
  const addEdge = useChatbotStore((s) => s.addEdge)
  const selectNode = useChatbotStore((s) => s.selectNode)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const pinchDist = useRef(0)
  const [isDragging, setIsDragging] = useState(false)

  const applyTransform = useCallback((z: number, p: { x: number; y: number }) => {
    const el = canvasRef.current?.firstElementChild as HTMLElement | null
    if (el) {
      el.style.transform = `scale(${z}) translate(${p.x}px, ${p.y}px)`
    }
  }, [])

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
    if ((e.target as HTMLElement).closest("[data-node-id]") || (e.target as HTMLElement).closest("button")) return
    if (e.button !== 0) return
    isPanning.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    setIsDragging(false)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }, [])

  const handlePointerUp = useCallback(() => {
    isPanning.current = false
    setIsDragging(false)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    if ((e.target as HTMLElement).closest("[data-node-id]")) return
    selectNode(null)
    setConnectingFrom(null)
  }, [isDragging, selectNode])

  const handleNodeClick = useCallback((nodeId: string) => {
    if (connectingFrom) {
      if (nodeId !== connectingFrom) {
        const exists = edges.some((e) => e.source === connectingFrom && e.target === nodeId)
        if (!exists) addEdge({ id: `e-${connectingFrom}-${nodeId}`, source: connectingFrom, target: nodeId })
      }
      setConnectingFrom(null)
    }
  }, [connectingFrom, edges, addEdge])

  const handleStartConnect = useCallback((sourceId: string) => {
    if (connectingFrom === sourceId) { setConnectingFrom(null); return }
    if (connectingFrom) {
      if (sourceId !== connectingFrom) {
        const exists = edges.some((e) => e.source === connectingFrom && e.target === sourceId)
        if (!exists && connectingFrom !== sourceId) {
          addEdge({ id: `e-${connectingFrom}-${sourceId}`, source: connectingFrom, target: sourceId })
        }
      }
      setConnectingFrom(null)
    } else {
      setConnectingFrom(sourceId)
    }
  }, [connectingFrom, edges, addEdge])

  useEffect(() => {
    applyTransform(zoom, pan)
  }, [zoom, pan, applyTransform])

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const zoomIn = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) { setZoom((z) => Math.min(z + 0.1, MAX_ZOOM)); return }
    const cx = rect.width / 2
    const cy = rect.height / 2
    setZoom((z) => {
      const newZ = Math.min(z + 0.1, MAX_ZOOM)
      const ratio = newZ / z
      setPan((prev) => ({ x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio }))
      return newZ
    })
  }, [])

  const zoomOut = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) { setZoom((z) => Math.max(z - 0.1, MIN_ZOOM)); return }
    const cx = rect.width / 2
    const cy = rect.height / 2
    setZoom((z) => {
      const newZ = Math.max(z - 0.1, MIN_ZOOM)
      const ratio = newZ / z
      setPan((prev) => ({ x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio }))
      return newZ
    })
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const cursorStyle = isDragging ? "grabbing" : connectingFrom ? "crosshair" : "grab"

  return (
    <div className="relative flex-1 overflow-hidden bg-[#f8fafc] select-none">
      <div
        ref={canvasRef}
        className={cn("absolute inset-0", cursorStyle === "grab" && "cursor-grab", cursorStyle === "grabbing" && "cursor-grabbing", cursorStyle === "crosshair" && "cursor-crosshair")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleCanvasClick}
      >
        <div
          ref={setNodeRef}
          className={cn("relative w-full h-full", isOver && "bg-blue-50/30")}
          style={{ minWidth: "3200px", minHeight: "2400px" }}
        >
          <GridPattern zoom={zoom} />
          <ConnectionLines nodes={nodes} edges={edges} connectingFrom={connectingFrom} />

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-white/80 rounded-2xl px-8 py-6 shadow-sm border border-dashed border-gray-300">
                <p className="text-base font-medium text-gray-400">Drag nodes from the left panel</p>
                <p className="text-xs text-gray-300 mt-2">Click the dot below a node → then click another node to connect them</p>
              </div>
            </div>
          )}

          {nodes.map((node) => (
            <div key={node.id} data-node-id={node.id} onClick={() => handleNodeClick(node.id)} className="absolute" style={{ left: node.position.x, top: node.position.y }}>
              <FlowNode node={node} />
              <Port node={node} onStartConnect={handleStartConnect} />
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 border border-green-200 rounded-xl px-4 py-2 text-sm font-medium shadow-lg z-40 animate-bounce">
          Click a target node to connect
        </div>
      )}
    </div>
  )
}

interface BuilderCanvasProps {
  nodes: FlowNodeType[]
}
