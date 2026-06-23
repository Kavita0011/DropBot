"use client"

import { useCallback } from "react"
import { useChatbotStore } from "@/store/chatbot-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, ArrowRight } from "lucide-react"

function useLazyUpdate(nodeId: string) {
  const updateData = useChatbotStore((s) => (key: string, value: unknown) => {
    const node = s.nodes.find((n) => n.id === nodeId)
    if (node) s.updateNode(nodeId, { data: { ...node.data, [key]: value } }, true)
  })
  const commitHistory = useChatbotStore((s) => s.commitHistory)
  const onBlur = useCallback(() => { commitHistory() }, [commitHistory])
  return { updateData, onBlur }
}

export function NodeEditor() {
  const nodes = useChatbotStore((s) => s.nodes)
  const edges = useChatbotStore((s) => s.edges)
  const selectedNodeId = useChatbotStore((s) => s.selectedNodeId)
  const selectedEdgeId = useChatbotStore((s) => s.selectedEdgeId)
  const updateNode = useChatbotStore((s) => s.updateNode)
  const updateEdge = useChatbotStore((s) => s.updateEdge)
  const removeNode = useChatbotStore((s) => s.removeNode)
  const removeEdge = useChatbotStore((s) => s.removeEdge)
  const selectNode = useChatbotStore((s) => s.selectNode)
  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId)

  if (selectedEdge) {
    const source = nodes.find((n) => n.id === selectedEdge.source)
    const target = nodes.find((n) => n.id === selectedEdge.target)
    return (
      <div className="h-full overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 ">Edge Properties</h3>
          <button onClick={() => { removeEdge(selectedEdge.id) }} className="text-gray-400  hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50  rounded-lg p-3">
            <span className="font-medium">{source?.type || "?"}</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{target?.type || "?"}</span>
          </div>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={selectedEdge.label || ""} onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })} placeholder="e.g. Yes / No" className="h-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" className="w-full text-red-600  border-red-200  hover:bg-red-50  gap-1" onClick={() => removeEdge(selectedEdge.id)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete Connection
          </Button>
        </div>
      </div>
    )
  }

  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm text-gray-400  text-center">Select a node or edge to edit</p>
      </div>
    )
  }

  return <NodeForm node={selectedNode} />
}

function NodeForm({ node }: { node: { id: string; type: string; data: Record<string, unknown> } }) {
  const updateNode = useChatbotStore((s) => s.updateNode)
  const removeNode = useChatbotStore((s) => s.removeNode)
  const selectNode = useChatbotStore((s) => s.selectNode)
  const commitHistory = useChatbotStore((s) => s.commitHistory)

  const updateData = useCallback((key: string, value: unknown) => {
    updateNode(node.id, { data: { ...node.data, [key]: value } }, true)
  }, [node.id, node.data, updateNode])

  const message = (node.data.message as string) || ""
  const question = (node.data.question as string) || ""
  const choices = (node.data.choices as string[]) || []
  const variable = (node.data.variable as string) || ""
  const apiUrl = (node.data.apiUrl as string) || ""
  const condition = (node.data.condition as string) || ""
  const condVariable = (node.data.condVariable as string) || ""
  const condOperator = (node.data.condOperator as string) || "equals"
  const condValue = (node.data.condValue as string) || ""

  const addChoice = () => updateData("choices", [...choices, ""])
  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices]; newChoices[index] = value; updateData("choices", newChoices)
  }
  const removeChoice = (index: number) => {
    updateData("choices", choices.filter((_: string, i: number) => i !== index))
  }

  const conditionExpr = condVariable
    ? `${condVariable} ${condOperator} ${condValue}`
    : condition

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 ">Edit Node</h3>
        <button onClick={() => { removeNode(node.id); selectNode(null) }} className="text-gray-400  hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {(node.type === "welcome" || node.type === "message") && (
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => updateData("message", e.target.value)} onBlur={commitHistory} placeholder="Enter your message..." rows={3} />
          </div>
        )}

        {node.type === "options" && (
          <>
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea value={question} onChange={(e) => updateData("question", e.target.value)} onBlur={commitHistory} placeholder="Ask a question..." rows={2} />
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
                  <Input value={choice} onChange={(e) => updateChoice(i, e.target.value)} onBlur={commitHistory} placeholder={`Option ${i + 1}`} className="h-8 text-sm" />
                  <button onClick={() => removeChoice(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {choices.length > 0 && (
                <p className="text-[10px] text-gray-400 ">Connect edges from this node for each choice. Set edge labels to match.</p>
              )}
            </div>
          </>
        )}

        {node.type === "input" && (
          <>
            <div className="space-y-2">
              <Label>Question / Prompt</Label>
              <Textarea value={question} onChange={(e) => updateData("question", e.target.value)} onBlur={commitHistory} placeholder="What info do you need from the user?" rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Variable Name</Label>
              <Input value={variable} onChange={(e) => updateData("variable", e.target.value)} onBlur={commitHistory} placeholder="e.g., user_email" />
              <p className="text-[10px] text-gray-400 ">Stores user input in this variable for use in conditions</p>
            </div>
          </>
        )}

        {node.type === "condition" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Variable</Label>
              <Input value={condVariable} onChange={(e) => updateData("condVariable", e.target.value)} onBlur={commitHistory} placeholder="e.g., user_input, score" />
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <select value={condOperator} onChange={(e) => updateData("condOperator", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300  bg-white  px-3 py-2 text-sm">
                <option value="equals">equals</option>
                <option value="not_equals">not equals</option>
                <option value="contains">contains</option>
                <option value="greater_than">greater than</option>
                <option value="less_than">less than</option>
                <option value="is_empty">is empty</option>
                <option value="is_not_empty">is not empty</option>
              </select>
            </div>
            {condOperator !== "is_empty" && condOperator !== "is_not_empty" && (
              <div className="space-y-2">
                <Label>Value</Label>
                <Input value={condValue} onChange={(e) => updateData("condValue", e.target.value)} onBlur={commitHistory} placeholder="e.g., yes, 42, @gmail.com" />
              </div>
            )}
            {conditionExpr && (
              <div className="rounded-lg bg-gray-50  p-2">
                <p className="text-[10px] text-gray-400  mb-1">Preview:</p>
                <p className="text-xs font-mono text-red-600 ">{conditionExpr}</p>
              </div>
            )}
            <p className="text-[10px] text-gray-400 ">Add two edges from this node with labels like "True" and "False" for each branch.</p>
          </div>
        )}

        {node.type === "api_call" && (
          <>
            <div className="space-y-2">
              <Label>API URL</Label>
              <Input value={apiUrl} onChange={(e) => updateData("apiUrl", e.target.value)} onBlur={commitHistory} placeholder="https://api.example.com/endpoint" />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <select value={(node.data.method as string) || "GET"} onChange={(e) => updateData("method", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300  bg-white  px-3 py-2 text-sm">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
