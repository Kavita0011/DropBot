"use client"

import { useChatbotStore } from "@/store/chatbot-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus } from "lucide-react"
import { useState } from "react"

export function NodeEditor() {
  const { nodes, selectedNodeId, updateNode, removeNode, selectNode } = useChatbotStore()
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-gray-400 text-center">
          Select a node to edit its properties
        </p>
      </div>
    )
  }

  const message = (selectedNode.data.message as string) || ""
  const question = (selectedNode.data.question as string) || ""
  const choices = (selectedNode.data.choices as string[]) || []
  const variable = (selectedNode.data.variable as string) || ""
  const apiUrl = (selectedNode.data.apiUrl as string) || ""
  const condition = (selectedNode.data.condition as string) || ""

  const updateData = (key: string, value: unknown) => {
    updateNode(selectedNode.id, { data: { ...selectedNode.data, [key]: value } })
  }

  const addChoice = () => {
    updateData("choices", [...choices, ""])
  }

  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices]
    newChoices[index] = value
    updateData("choices", newChoices)
  }

  const removeChoice = (index: number) => {
    updateData("choices", choices.filter((_: string, i: number) => i !== index))
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Edit Node</h3>
        <button
          onClick={() => { removeNode(selectedNode.id); selectNode(null) }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {(selectedNode.type === "welcome" || selectedNode.type === "message") && (
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => updateData("message", e.target.value)}
              placeholder="Enter your message..."
              rows={3}
            />
          </div>
        )}

        {selectedNode.type === "options" && (
          <>
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                value={question}
                onChange={(e) => updateData("question", e.target.value)}
                placeholder="Ask a question..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Choices</Label>
                <Button variant="ghost" size="sm" onClick={addChoice} className="h-7 gap-1 text-xs">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {choices.map((choice: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={choice}
                    onChange={(e) => updateChoice(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="h-8 text-sm"
                  />
                  <button
                    onClick={() => removeChoice(i)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedNode.type === "input" && (
          <div className="space-y-2">
            <Label>Question / Prompt</Label>
            <Textarea
              value={question}
              onChange={(e) => updateData("question", e.target.value)}
              placeholder="What info do you need from the user?"
              rows={2}
            />
            <Label>Variable Name</Label>
            <Input
              value={variable}
              onChange={(e) => updateData("variable", e.target.value)}
              placeholder="e.g., user_email"
            />
          </div>
        )}

        {selectedNode.type === "condition" && (
          <div className="space-y-2">
            <Label>Condition Logic</Label>
            <Textarea
              value={condition}
              onChange={(e) => updateData("condition", e.target.value)}
              placeholder="e.g., user_input === 'yes'"
              rows={3}
            />
          </div>
        )}

        {selectedNode.type === "api_call" && (
          <div className="space-y-2">
            <Label>API URL</Label>
            <Input
              value={apiUrl}
              onChange={(e) => updateData("apiUrl", e.target.value)}
              placeholder="https://api.example.com/endpoint"
            />
            <Label>Method</Label>
            <select
              value={(selectedNode.data.method as string) || "GET"}
              onChange={(e) => updateData("method", e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
