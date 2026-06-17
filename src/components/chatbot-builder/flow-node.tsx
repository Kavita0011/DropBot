"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { MessageSquare, ListTodo, Type, GitFork, Globe, StopCircle, Trash2, Copy, GripVertical } from "lucide-react"
import type { NodeType, FlowNode as FlowNodeType } from "@/types"
import { useChatbotStore } from "@/store/chatbot-store"
import { useState, useRef, useEffect } from "react"

const nodeConfig: Record<NodeType, { icon: React.ReactNode; color: string; bgLight: string; label: string }> = {
  welcome: { icon: <MessageSquare className="h-4 w-4" />, color: "bg-blue-500", bgLight: "bg-blue-50", label: "Welcome" },
  message: { icon: <Type className="h-4 w-4" />, color: "bg-green-500", bgLight: "bg-green-50", label: "Message" },
  options: { icon: <ListTodo className="h-4 w-4" />, color: "bg-purple-500", bgLight: "bg-purple-50", label: "Options" },
  input: { icon: <Type className="h-4 w-4" />, color: "bg-orange-500", bgLight: "bg-orange-50", label: "Input" },
  condition: { icon: <GitFork className="h-4 w-4" />, color: "bg-red-500", bgLight: "bg-red-50", label: "Condition" },
  api_call: { icon: <Globe className="h-4 w-4" />, color: "bg-indigo-500", bgLight: "bg-indigo-50", label: "API Call" },
  end: { icon: <StopCircle className="h-4 w-4" />, color: "bg-gray-500", bgLight: "bg-gray-50", label: "End" },
}

interface FlowNodeProps {
  node: FlowNodeType
}

export function FlowNode({ node }: FlowNodeProps) {
  const store = useChatbotStore()
  const config = nodeConfig[node.type]
  const isSelected = store.selectedNodeId === node.id
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { type: node.type, fromPalette: false, node },
  })

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

  const message = (node.data.message as string) || (node.data.question as string) || ""
  const choices = node.data.choices as string[] | undefined
  const hasConnection = store.edges.some((e) => e.source === node.id)

  useEffect(() => {
    if (!showMenu) return
    const handler = () => setShowMenu(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [showMenu])

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{ ...style, left: node.position.x, top: node.position.y }}
        className={cn(
          "absolute w-56 rounded-xl border-2 bg-white shadow-md transition-all duration-150",
          isSelected ? "border-blue-500 shadow-lg ring-2 ring-blue-100 ring-offset-1" : "border-gray-200 hover:border-gray-300 hover:shadow-lg",
          isDragging && "opacity-70 shadow-2xl z-50 scale-[1.02] rotate-0"
        )}
        onClick={(e) => { e.stopPropagation(); store.selectNode(node.id) }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenuPos({ x: e.clientX, y: e.clientY }); setShowMenu(true) }}
      >
        <div className={cn("flex items-center gap-2 rounded-t-xl px-3 py-2.5 border-b", isSelected ? "border-blue-100 bg-blue-50/50" : "border-gray-100 bg-gray-50/50")}>
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-sm", config.color)}>
            {config.icon}
          </div>
          <span className="flex-1 text-xs font-semibold text-gray-700">{config.label}</span>
          <button
            onClick={(e) => { e.stopPropagation(); store.removeNode(node.id) }}
            className="text-gray-400 hover:text-red-500 transition-colors rounded p-0.5 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-3 py-2.5 min-h-[32px]">
          {node.type === "end" ? (
            <p className="text-xs text-gray-400 italic flex items-center gap-1"><StopCircle className="h-3 w-3" /> End of flow</p>
          ) : message ? (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{message}</p>
          ) : choices && choices.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {choices.map((c, i) => (
                <span key={i} className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">{c}</span>
              ))}
            </div>
          ) : node.type === "api_call" ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-400"><Globe className="h-3 w-3" />{(node.data.apiUrl as string) || "Configure API call"}</div>
          ) : (
            <p className="text-xs text-gray-400 italic">Click to configure</p>
          )}
        </div>

        <div className={cn("absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-20", (isSelected || hasConnection) ? "bg-blue-400" : "bg-gray-300")} />
      </div>

      {showMenu && (
        <div ref={menuRef} className="fixed z-[100] bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 min-w-[140px]" style={{ left: menuPos.x, top: menuPos.y }} onClick={(e) => e.stopPropagation()}>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { const newNode = { ...node, id: crypto.randomUUID(), position: { x: node.position.x + 40, y: node.position.y + 60 } }; store.addNode(newNode); store.selectNode(newNode.id); setShowMenu(false) }}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => { store.removeNode(node.id); setShowMenu(false) }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </>
  )
}