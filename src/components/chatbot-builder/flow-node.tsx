"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { MessageSquare, ListTodo, Type, GitFork, Globe, StopCircle, Trash2, GripVertical } from "lucide-react"
import type { NodeType, FlowNode as FlowNodeType } from "@/types"
import { useChatbotStore } from "@/store/chatbot-store"

const nodeConfig: Record<NodeType, { icon: React.ReactNode; color: string; label: string }> = {
  welcome: { icon: <MessageSquare className="h-4 w-4" />, color: "bg-blue-500", label: "Welcome" },
  message: { icon: <Type className="h-4 w-4" />, color: "bg-green-500", label: "Message" },
  options: { icon: <ListTodo className="h-4 w-4" />, color: "bg-purple-500", label: "Options" },
  input: { icon: <Type className="h-4 w-4" />, color: "bg-orange-500", label: "Input" },
  condition: { icon: <GitFork className="h-4 w-4" />, color: "bg-red-500", label: "Condition" },
  api_call: { icon: <Globe className="h-4 w-4" />, color: "bg-indigo-500", label: "API Call" },
  end: { icon: <StopCircle className="h-4 w-4" />, color: "bg-gray-500", label: "End" },
}

interface FlowNodeProps {
  node: FlowNodeType
}

export function FlowNode({ node }: FlowNodeProps) {
  const { selectedNodeId, selectNode, removeNode } = useChatbotStore()
  const config = nodeConfig[node.type]
  const isSelected = selectedNodeId === node.id

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { type: node.type, fromPalette: false, node },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const message = (node.data.message as string) || (node.data.question as string) || ""
  const choices = node.data.choices as string[] | undefined

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        left: node.position.x,
        top: node.position.y,
      }}
      className={cn(
        "absolute w-56 rounded-xl border-2 bg-white shadow-md transition-shadow",
        isSelected ? "border-blue-500 shadow-lg ring-2 ring-blue-100" : "border-gray-200",
        isDragging && "opacity-50 shadow-2xl z-50"
      )}
      onClick={() => selectNode(node.id)}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className={cn("flex h-6 w-6 items-center justify-center rounded text-white", config.color)}>
          {config.icon}
        </div>
        <span className="flex-1 text-xs font-semibold text-gray-700">{config.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); removeNode(node.id) }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 py-2">
        {message && (
          <p className="text-xs text-gray-600 line-clamp-2">{message}</p>
        )}
        {choices && choices.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {choices.map((c, i) => (
              <span
                key={i}
                className="inline-block mr-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
              >
                {c}
              </span>
            ))}
          </div>
        )}
        {!message && choices === undefined && (
          <p className="text-xs text-gray-400 italic">Click to configure</p>
        )}
      </div>
    </div>
  )
}
