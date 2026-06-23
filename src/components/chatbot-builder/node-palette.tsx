"use client"

import { useDraggable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { MessageSquare, ListTodo, Type, GitFork, Globe, StopCircle } from "lucide-react"
import type { NodeType } from "@/types"

const nodeTypes: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: "welcome", label: "Welcome", icon: <MessageSquare className="h-4 w-4" />, color: "bg-blue-500" },
  { type: "message", label: "Message", icon: <Type className="h-4 w-4" />, color: "bg-green-500" },
  { type: "options", label: "Options", icon: <ListTodo className="h-4 w-4" />, color: "bg-purple-500" },
  { type: "input", label: "Input", icon: <Type className="h-4 w-4" />, color: "bg-orange-500" },
  { type: "condition", label: "Condition", icon: <GitFork className="h-4 w-4" />, color: "bg-red-500" },
  { type: "api_call", label: "API Call", icon: <Globe className="h-4 w-4" />, color: "bg-indigo-500" },
  { type: "end", label: "End", icon: <StopCircle className="h-4 w-4" />, color: "bg-gray-500" },
]

function PaletteItem({ type, label, icon, color }: (typeof nodeTypes)[0]) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, fromPalette: true },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm transition-colors hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-md text-white", color)}>
        {icon}
      </div>
      <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
    </div>
  )
}

export function NodePalette() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Nodes</h3>
      <div className="space-y-1.5">
        {nodeTypes.map((item) => (
          <PaletteItem key={item.type} {...item} />
        ))}
      </div>
    </div>
  )
}
