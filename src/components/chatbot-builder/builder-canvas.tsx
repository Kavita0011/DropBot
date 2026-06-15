"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { FlowNode } from "./flow-node"
import { useChatbotStore } from "@/store/chatbot-store"
import type { FlowNode as FlowNodeType, FlowEdge } from "@/types"

interface BuilderCanvasProps {
  nodes: FlowNodeType[]
}

function ConnectionLines({ nodes, edges }: { nodes: FlowNodeType[]; edges: FlowEdge[] }) {
  if (edges.length === 0) return null

  return (
    <svg className="absolute inset-0 pointer-events-none z-10" style={{ width: "100%", height: "100%" }}>
      {edges.map((edge) => {
        const source = nodes.find((n) => n.id === edge.source)
        const target = nodes.find((n) => n.id === edge.target)
        if (!source || !target) return null

        const x1 = source.position.x + 112
        const y1 = source.position.y + 96
        const x2 = target.position.x + 112
        const y2 = target.position.y

        const midY = (y1 + y2) / 2
        const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`

        return (
          <g key={edge.id}>
            <path d={path} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6,3" />
            <circle cx={x1} cy={y1} r={5} fill="#3b82f6" stroke="white" strokeWidth={2} />
            {edge.label && (
              <text x={(x1 + x2) / 2} y={midY - 8} textAnchor="middle" className="text-[10px] fill-gray-500" fontSize="10">
                {edge.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function NodeOutputDots({ nodes, edges, onConnect }: { nodes: FlowNodeType[]; edges: FlowEdge[]; onConnect: (sourceId: string, targetId: string) => void }) {
  return (
    <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: "100%", height: "100%" }}>
      {nodes.map((node) => {
        if (node.type === "end") return null
        const cx = node.position.x + 112
        const cy = node.position.y + 96
        const hasConnection = edges.some((e) => e.source === node.id)
        return (
          <g key={`dot-${node.id}`} className="pointer-events-auto cursor-crosshair" onClick={() => onConnect(node.id, "")}>
            <circle cx={cx} cy={cy} r={7} fill={hasConnection ? "#3b82f6" : "#94a3b8"} stroke="white" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={3} fill="white" />
          </g>
        )
      })}
    </svg>
  )
}

export function BuilderCanvas({ nodes }: BuilderCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" })
  const edges = useChatbotStore((s) => s.edges)
  const addEdge = useChatbotStore((s) => s.addEdge)
  const addNode = useChatbotStore((s) => s.addNode)
  const nodesList = useChatbotStore((s) => s.nodes)

  const handleConnect = (sourceId: string, _targetId: string) => {
    const lastNode = nodesList[nodesList.length - 1]
    if (!lastNode || lastNode.id === sourceId) return
    const exists = edges.some((e) => e.source === sourceId && e.target === lastNode.id)
    if (exists) return
    addEdge({ id: `edge-${sourceId}-${lastNode.id}`, source: sourceId, target: lastNode.id })
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:20px_20px]",
        isOver && "bg-blue-50/50"
      )}
      style={{ minHeight: "600px" }}
    >
      <ConnectionLines nodes={nodes} edges={edges} />
      <NodeOutputDots nodes={nodes} edges={edges} onConnect={handleConnect} />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-gray-400">Drag nodes here to build your chatbot flow</p>
            <p className="text-xs text-gray-300 mt-1">Click the dot below a node to connect it to the next</p>
          </div>
        </div>
      )}

      {nodes.map((node) => (
        <FlowNode key={node.id} node={node} />
      ))}
    </div>
  )
}
