"use client"

import { useState, useCallback } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, MouseSensor, TouchSensor } from "@dnd-kit/core"
import { useChatbotStore } from "@/store/chatbot-store"
import { BuilderCanvas } from "./builder-canvas"
import { NodePalette } from "./node-palette"
import { NodeEditor } from "./node-editor"
import { ChatPreview } from "./chat-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Eye, ArrowLeft, Palette, Play } from "lucide-react"
import { generateId } from "@/lib/utils"
import toast from "react-hot-toast"
import type { FlowNode } from "@/types"

type Tab = "builder" | "settings" | "preview"

export function BuilderWorkspace({ chatbotId, onBack }: { chatbotId: string; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("builder")
  const [saving, setSaving] = useState(false)
  const [activeDrag, setActiveDrag] = useState<{ id: string; type: string } | null>(null)

  const store = useChatbotStore()
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 8 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })

  const handleSave = useCallback(async () => {
    setSaving(true)
    const flowData = store.toFlowData()
    const res = await fetch(`/api/chatbots/${chatbotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: store.name, description: store.description, welcomeMsg: store.welcomeMsg,
        themeColor: store.themeColor, accentColor: store.accentColor, position: store.position,
        bgColor: store.bgColor, textColor: store.textColor, flowData,
      }),
    })
    if (res.ok) toast.success("Saved!"); else toast.error("Failed to save")
    setSaving(false)
  }, [store, chatbotId])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag({ id: event.active.id as string, type: event.active.data.current?.type as string })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over || over.id !== "canvas") return
    const data = active.data.current
    if (data?.fromPalette) {
      const newNode: FlowNode = {
        id: generateId(), type: data.type,
        position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
        data: data.type === "welcome" ? { message: "Hello! How can I help?" }
          : data.type === "message" ? { message: "Your message here" }
          : data.type === "options" ? { question: "Choose an option:", choices: ["Option 1", "Option 2"] }
          : data.type === "input" ? { question: "Please enter:", variable: "" }
          : data.type === "condition" ? { condition: "true" }
          : data.type === "api_call" ? { apiUrl: "", method: "GET" } : {},
      }
      store.addNode(newNode); store.selectNode(newNode.id)
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></button>
          <Input value={store.name} onChange={(e) => store.setName(e.target.value)} className="h-8 w-48 border-0 bg-transparent text-base font-semibold focus:border focus:border-gray-300 focus:bg-white" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => store.setPublished(!store.published)}>
            {store.published ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-4 w-4" />{saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex border-b bg-white">
          {(["builder", "settings", "preview"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "builder" ? <Eye className="h-4 w-4" /> : tab === "settings" ? <Palette className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "builder" && (
          <DndContext sensors={[mouseSensor, touchSensor]} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-1">
              <div className="w-64 border-r bg-white p-3 overflow-y-auto"><NodePalette /></div>
              <BuilderCanvas nodes={store.nodes} />
              <div className="w-72 border-l bg-white overflow-y-auto"><NodeEditor /></div>
            </div>
            <DragOverlay>
              {activeDrag && <div className="rounded-lg border-2 border-blue-500 bg-white px-4 py-2 shadow-lg"><span className="text-sm font-medium text-gray-700">New {activeDrag.type} node</span></div>}
            </DragOverlay>
          </DndContext>
        )}

        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="text-lg font-semibold">Chatbot Settings</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Welcome Message</Label>
                  <textarea value={store.welcomeMsg} onChange={(e) => store.setWelcomeMsg(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
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
                    <select value={store.position} onChange={(e) => store.setPosition(e.target.value)} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preview" && (
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-6">
            <div className="h-[600px] w-[400px]"><ChatPreview /></div>
          </div>
        )}
      </div>
    </div>
  )
}
