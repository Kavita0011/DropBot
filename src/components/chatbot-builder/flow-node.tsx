"use client"

import { memo, useState, useRef, useEffect } from "react"
import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { useChatbotStore } from "@/store/chatbot-store"
import { MessageSquare, Type, ListTodo, GitFork, Globe, StopCircle, Terminal } from "lucide-react"
import type { FlowNode as FlowNodeType, NodeType } from "@/types"

const nodeConfig: Record<NodeType, { icon: React.ReactNode; color: string; bgLight: string; label: string }> = {
  welcome: { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "bg-blue-500", bgLight: "bg-blue-50", label: "Welcome" },
  message: { icon: <Type className="h-3.5 w-3.5" />, color: "bg-green-500", bgLight: "bg-green-50", label: "Message" },
  options: { icon: <ListTodo className="h-3.5 w-3.5" />, color: "bg-purple-500", bgLight: "bg-purple-50", label: "Options" },
  input: { icon: <Type className="h-3.5 w-3.5" />, color: "bg-orange-500", bgLight: "bg-orange-50", label: "Input" },
  condition: { icon: <GitFork className="h-3.5 w-3.5" />, color: "bg-red-500", bgLight: "bg-red-50", label: "Condition" },
  api_call: { icon: <Globe className="h-3.5 w-3.5" />, color: "bg-indigo-500", bgLight: "bg-indigo-50", label: "API Call" },
  end: { icon: <StopCircle className="h-3.5 w-3.5" />, color: "bg-gray-500", bgLight: "bg-gray-50", label: "End" },
}

function FlowNodeInner({ node }: { node: FlowNodeType }) {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hasConnection = useChatbotStore((s) => s.edges.some((e) => e.source === node.id))
  const isSelected = useChatbotStore((s) => s.selectedNodeId === node.id || s.selectedNodeIds.includes(node.id))

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    data: { type: node.type, fromPalette: false },
  })

  useEffect(() => {
    if (!menuPos) return
    const close = () => setMenuPos(null)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [menuPos])

  const cfg = nodeConfig[node.type]
  const message = (node.data.message as string) || (node.data.question as string) || ""
  const choices = node.data.choices as string[] | undefined
  const condition = node.data.condition as string | undefined
  const apiUrl = node.data.apiUrl as string | undefined

  return (
    <>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onContextMenu={(e) => { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY }) }}
        className={cn(
          "group relative w-52 cursor-grab rounded-xl border-2 bg-white dark:bg-gray-800 shadow-sm transition-all active:cursor-grabbing",
          isDragging && "opacity-50 shadow-lg",
          isSelected ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/50" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md",
        )}
      >
        <div className={cn("flex items-center gap-1.5 rounded-t-xl px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white", cfg.color)}>
          {cfg.icon}{cfg.label}
        </div>

        <div className="px-3 py-2.5 min-h-[32px]">
          {node.type === "end" ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-1"><StopCircle className="h-3 w-3" /> End of flow</p>
          ) : node.type === "condition" ? (
            <div className="space-y-1">
              <p className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded px-1.5 py-1 leading-relaxed">
                {condition ? (
                  <>
                    <Terminal className="h-3 w-3 inline mr-1 -mt-0.5" />
                    {condition.length > 35 ? condition.slice(0, 35) + "…" : condition}
                  </>
                ) : (
                  <span className="italic text-gray-400">Click to configure condition</span>
                )}
              </p>
            </div>
          ) : node.type === "options" ? (
            <div className="space-y-1.5">
              {message && <p className="text-xs text-gray-700 dark:text-gray-200 font-medium leading-relaxed">{message}</p>}
              {choices && choices.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {choices.map((c, i) => (
                    <span key={i} className="inline-block rounded-md bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : node.type === "api_call" ? (
            <div className="flex items-center gap-1.5 text-xs">
              <Globe className="h-3 w-3 text-indigo-500" />
              <span className="text-gray-600 dark:text-gray-300 truncate">{apiUrl || <span className="italic text-gray-400 dark:text-gray-500">Configure API call</span>}</span>
            </div>
          ) : (
            <>
              {message ? (
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{message}</p>
              ) : (
                <p className="text-xs text-gray-400 italic">Click to configure</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-3 py-1">
          <span className="text-[10px] text-gray-400 font-mono">{node.id.slice(0, 6)}</span>
          {hasConnection && <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />}
        </div>
      </div>

      {menuPos && (
        <div ref={menuRef} className="fixed z-50 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-xl py-1 min-w-[140px]" style={{ left: menuPos.x, top: menuPos.y }}>
          <button onClick={() => { useChatbotStore.getState().duplicateNode(node.id); setMenuPos(null) }} className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">Duplicate</button>
          <button onClick={() => { useChatbotStore.getState().removeNode(node.id); setMenuPos(null) }} className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">Delete</button>
        </div>
      )}
    </>
  )
}

// Custom memo comparator: compares id, type, position by value, and data via JSON serialization
// (since data is a nested object and React.memo's shallow compare would miss changes).
export const FlowNode = memo(FlowNodeInner, (prev, next) => {
  return prev.node.id === next.node.id
    && prev.node.type === next.node.type
    && prev.node.position.x === next.node.position.x
    && prev.node.position.y === next.node.position.y
    && JSON.stringify(prev.node.data) === JSON.stringify(next.node.data)
})
