"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragMoveEvent, useSensor, MouseSensor, TouchSensor } from "@dnd-kit/core"
import { useChatbotStore } from "@/store/chatbot-store"
import { BuilderCanvas, type BuilderCanvasHandle } from "./builder-canvas"
import { NodePalette } from "./node-palette"
import { NodeEditor } from "./node-editor"
import { ChatPreview } from "./chat-preview"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Eye, ArrowLeft, Palette, Play, Undo2, Redo2, Trash2, Copy, Scissors, ClipboardPaste, Globe } from "lucide-react"
import { generateId } from "@/lib/utils"
import toast from "react-hot-toast"
import type { FlowNode } from "@/types"

// Snaps a value to the nearest grid point (20px). Also used by the canvas for rendering.
const SNAP = 20
function snapToGrid(val: number): number { return Math.round(val / SNAP) * SNAP }
// Fallback position calculator for palette drags when onDragMove coordinates aren't available.
function getNextPosition(nodes: FlowNode[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 300, y: 50 }
  const maxY = Math.max(...nodes.map((n) => n.position.y))
  return { x: 300, y: maxY + 180 }
}

type Tab = "builder" | "settings" | "preview"

export function BuilderWorkspace({ chatbotId, onBack }: { chatbotId: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("builder")
  const [saving, setSaving] = useState(false)
  const [activeDrag, setActiveDrag] = useState<{ id: string; type: string } | null>(null)
  const canvasRef = useRef<BuilderCanvasHandle>(null)
  const dragClientPos = useRef<{ x: number; y: number } | null>(null)

  const store = useChatbotStore()
  const storeRef = useRef(store)
  storeRef.current = store
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = storeRef.current
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if (e.key === "Delete" || e.key === "Backspace") {
        s.removeSelectedNodes()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault()
        s.copyNodes()
        toast.success("Copied")
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault()
        s.pasteNodes()
        toast.success("Pasted")
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault()
        s.copyNodes()
        s.removeSelectedNodes()
        toast.success("Cut")
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault()
        const ids = s.selectedNodeIds.length > 0 ? s.selectedNodeIds : (s.selectedNodeId ? [s.selectedNodeId] : [])
        if (ids.length === 0) return
        ids.forEach((id) => s.duplicateNode(id))
        toast.success("Duplicated")
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    const s = storeRef.current
    const flowData = s.toFlowData()
    const res = await fetch(`/api/chatbots/${chatbotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: s.name, description: s.description, welcomeMsg: s.welcomeMsg,
        themeColor: s.themeColor, accentColor: s.accentColor, position: s.position,
        bgColor: s.bgColor, textColor: s.textColor, flowData, status: s.status, logoUrl: s.logoUrl,
      }),
    })
    if (res.ok) toast.success("Saved!"); else toast.error("Failed to save")
    setSaving(false)
  }, [chatbotId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag({ id: event.active.id as string, type: event.active.data.current?.type as string })
    dragClientPos.current = null
  }

  const handleDragMove = (event: DragMoveEvent) => {
    if (event.active.data.current?.fromPalette) {
      const ev = event.activatorEvent as MouseEvent | TouchEvent
      const startX = "touches" in ev ? ev.touches[0].clientX : ev.clientX
      const startY = "touches" in ev ? ev.touches[0].clientY : ev.clientY
      dragClientPos.current = { x: startX + event.delta.x, y: startY + event.delta.y }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over, delta } = event
    if (active.data.current?.fromPalette) {
      if (!over || over.id !== "canvas") return
      const data = active.data.current
      let pos = { x: 300, y: 50 }
      if (dragClientPos.current && canvasRef.current) {
        pos = canvasRef.current.getCanvasCoords(dragClientPos.current.x, dragClientPos.current.y)
        const maxY = store.nodes.length > 0 ? Math.max(...store.nodes.map((n) => n.position.y)) : -Infinity
        if (pos.y < maxY) pos.y = maxY + 180
      } else {
        pos = getNextPosition(store.nodes)
      }
      const newNode: FlowNode = {
        id: generateId(), type: data.type,
        position: { x: snapToGrid(pos.x), y: snapToGrid(pos.y) },
        data: data.type === "welcome" ? { message: "Hello! How can I help?" }
          : data.type === "message" ? { message: "Your message here" }
          : data.type === "options" ? { question: "Choose an option:", choices: ["Option 1", "Option 2"] }
          : data.type === "input" ? { question: "Please enter:", variable: "" }
          : data.type === "condition" ? { condition: "true" }
          : data.type === "api_call" ? { apiUrl: "", method: "GET" } : {},
      }
      store.addNode(newNode)
      store.selectNode(newNode.id)
    } else {
      const nodeId = active.id as string
      const node = store.nodes.find((n) => n.id === nodeId)
      if (node && (Math.abs(delta.x) > 2 || Math.abs(delta.y) > 2)) {
        const newX = store.snapToGrid ? snapToGrid(node.position.x + delta.x) : Math.round(node.position.x + delta.x)
        const newY = store.snapToGrid ? snapToGrid(node.position.y + delta.y) : Math.round(node.position.y + delta.y)
        store.updateNodePosition(nodeId, newX, newY)
      }
    }
  }

  const canDelete = store.selectedNodeIds.length > 0 || store.selectedNodeId !== null
  const canCopy = canDelete
  const canPaste = store.clipboard !== null && store.clipboard.length > 0

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-white dark:bg-gray-900 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
          <Input value={store.name} onChange={(e) => store.setName(e.target.value)} className="h-8 w-48 border-0 bg-transparent text-base font-semibold focus:border focus:border-gray-300 focus:bg-white" />
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => store.undo()} disabled={store.past.length === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={() => store.redo()} disabled={store.future.length === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button onClick={() => store.copyNodes()} disabled={!canCopy} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Copy (Ctrl+C)">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={() => store.pasteNodes()} disabled={!canPaste} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed" title="Paste (Ctrl+V)">
            <ClipboardPaste className="h-4 w-4" />
          </button>
          <button onClick={() => store.removeSelectedNodes()} disabled={!canDelete} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed" title="Delete (Del)">
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {store.status === "draft" && (
            <>
              <Button variant="default" size="sm" onClick={() => store.setStatus("approved")} className="gap-1">
                <Globe className="h-4 w-4" />Publish
              </Button>
              <Button variant="outline" size="sm" onClick={() => store.setStatus("pending_review")}>Submit for Review</Button>
            </>
          )}
          {store.status === "pending_review" && (
            <>
              <Badge variant="warning">Under Review</Badge>
              <Button variant="outline" size="sm" onClick={() => store.setStatus("approved")} className="gap-1 text-green-600 border-green-200 hover:bg-green-50">
                <Globe className="h-4 w-4" />Publish Now
              </Button>
            </>
          )}
          {store.status === "approved" && <Badge variant="success">Published</Badge>}
          {store.status === "rejected" && (
            <Button variant="outline" size="sm" onClick={() => store.setStatus("draft")}>Back to Draft</Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex border-b bg-white dark:bg-gray-900 dark:border-gray-700">
          {(["builder", "settings", "preview"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {tab === "builder" ? <Eye className="h-4 w-4" /> : tab === "settings" ? <Palette className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "builder" && (
          <DndContext sensors={[mouseSensor, touchSensor]} onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
            <div className="flex flex-1">
              <div className="w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-700 p-3 overflow-y-auto"><NodePalette /></div>
              <BuilderCanvas ref={canvasRef} nodes={store.nodes} />
              <div className="w-72 border-l bg-white dark:bg-gray-900 dark:border-gray-700 overflow-y-auto"><NodeEditor /></div>
            </div>
            <DragOverlay>
              {activeDrag && <div className="rounded-lg border-2 border-blue-500 bg-white dark:bg-gray-800 px-4 py-2 shadow-lg"><span className="text-sm font-medium text-gray-700 dark:text-gray-200">New {activeDrag.type} node</span></div>}
            </DragOverlay>
          </DndContext>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto p-6 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-lg font-semibold dark:text-gray-100">Chatbot Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <textarea value={store.welcomeMsg} onChange={(e) => store.setWelcomeMsg(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={store.themeColor} onChange={(e) => store.setThemeColor(e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <span className="text-sm text-gray-500">{store.themeColor}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Background</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={store.bgColor} onChange={(e) => store.setBgColor(e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <span className="text-sm text-gray-500">{store.bgColor}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={store.textColor} onChange={(e) => store.setTextColor(e.target.value)} className="h-10 w-10 rounded border cursor-pointer" />
                      <span className="text-sm text-gray-500">{store.textColor}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <select value={store.position} onChange={(e) => store.setPosition(e.target.value)} className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-200 px-3 py-2 text-sm">
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL (optional)</Label>
                    <input type="url" value={store.logoUrl} onChange={(e) => store.setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-6">
            <div className="h-[600px] w-[400px]"><ChatPreview /></div>
          </div>
        )}
      </div>
    </div>
  )
}