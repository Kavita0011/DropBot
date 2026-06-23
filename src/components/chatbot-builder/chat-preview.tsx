"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useChatbotStore } from "@/store/chatbot-store"
import { cn } from "@/lib/utils"
import type { FlowNode } from "@/types"
import { MessageSquare, Send, Loader2, Check, Terminal, Braces, ExternalLink } from "lucide-react"

function evaluateCondition(condition: string, variables: Record<string, string>): boolean {
  const trimmed = condition.trim()
  const match = trimmed.match(/^(\w+)\s*(==|!=|>|<|>=|<=|contains|is_empty|is_not_empty)\s*(.+)?$/)
  if (!match) return trimmed === "true"
  const [, varName, op, rawVal] = match
  const val = variables[varName] || ""
  const compareVal = rawVal?.trim().replace(/^["']|["']$/g, "") || ""
  switch (op) {
    case "==": return val === compareVal
    case "!=": return val !== compareVal
    case "contains": return val.includes(compareVal)
    case ">": return Number(val) > Number(compareVal)
    case "<": return Number(val) < Number(compareVal)
    case ">=": return Number(val) >= Number(compareVal)
    case "<=": return Number(val) <= Number(compareVal)
    case "is_empty": return val === ""
    case "is_not_empty": return val !== ""
    default: return true
  }
}

export function ChatPreview() {
  const nodes = useChatbotStore((s) => s.nodes)
  const welcomeMsg = useChatbotStore((s) => s.welcomeMsg)
  const themeColor = useChatbotStore((s) => s.themeColor)
  const bgColor = useChatbotStore((s) => s.bgColor)
  const textColor = useChatbotStore((s) => s.textColor)

  const [messages, setMessages] = useState<{ role: "bot" | "user" | "system"; text: string; type?: string }[]>([])
  const [input, setInput] = useState("")
  const [currentNodeIdx, setCurrentNodeIdx] = useState(-1)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [awaitingInput, setAwaitingInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const addBotMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "bot", text }])
  }, [])

  const advanceNode = useCallback(() => {
    if (currentNodeIdx >= nodes.length - 1) {
      setFinished(true)
      addBotMessage("This concludes the chat preview.")
      return
    }
    const nextIdx = currentNodeIdx + 1
    setCurrentNodeIdx(nextIdx)
    processNode(nodes[nextIdx])
  }, [currentNodeIdx, nodes, addBotMessage])

  const processNode = useCallback((node: FlowNode) => {
    setAwaitingInput(false)
    setLoading(false)
    switch (node.type) {
      case "welcome":
      case "message": {
        const msg = node.data.message as string
        if (msg) addBotMessage(msg)
        setTimeout(() => { setAwaitingInput(true); setTimeout(() => inputRef.current?.focus(), 50) }, 300)
        break
      }
      case "options": {
        const question = (node.data.question as string) || "Choose an option:"
        const choices = (node.data.choices as string[]) || []
        addBotMessage(`📋 ${question}`)
        setMessages((prev) => [...prev, { role: "system", text: "", type: "options" }])
        break
      }
      case "input": {
        const question = (node.data.question as string) || "Please enter:"
        addBotMessage(`✏️ ${question}`)
        setTimeout(() => { setAwaitingInput(true); setTimeout(() => inputRef.current?.focus(), 50) }, 300)
        break
      }
      case "condition": {
        const condExpr = node.data.condition as string || "true"
        const condVariable = node.data.condVariable as string || ""
        const condOperator = node.data.condOperator as string || "equals"
        const condValue = node.data.condValue as string || ""

        setMessages((prev) => [...prev, {
          role: "system", text: "", type: "condition",
          data: { condVariable, condOperator, condValue, condExpr }
        }])

        const result = condVariable && condOperator && condValue
          ? evaluateCondition(`${condVariable} ${condOperator === "equals" ? "==" : condOperator === "not_equals" ? "!=" : condOperator === "is_empty" ? "is_empty" : condOperator === "is_not_empty" ? "is_not_empty" : condOperator} ${condValue}`, variables)
          : evaluateCondition(condExpr, variables)

        if (result) {
          addBotMessage(`✅ Condition met → continuing`)
        } else {
          addBotMessage(`⏭️ Condition not met → skipping`)
        }
        setTimeout(() => advanceNode(), 600)
        break
      }
      case "api_call": {
        const apiUrl = (node.data.apiUrl as string) || ""
        const method = (node.data.method as string) || "GET"
        setLoading(true)
        addBotMessage(`🔗 Calling ${method} ${apiUrl || "(no URL configured)"}...`)
        setTimeout(() => {
          setLoading(false)
          addBotMessage(`✅ API call completed (simulated)`)
          setTimeout(() => advanceNode(), 400)
        }, 1200)
        break
      }
      case "end": {
        setFinished(true)
        addBotMessage("Thank you for using the chatbot!")
        break
      }
      default: {
        setAwaitingInput(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
    }
  }, [addBotMessage, advanceNode, variables, nodes])

  const startChat = () => {
    addBotMessage(welcomeMsg || "Hello! How can I help you?")
    setCurrentNodeIdx(0)
    if (nodes.length === 0) {
      setAwaitingInput(true)
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }
    const firstNode = nodes[0]
    if (firstNode.type === "welcome" || firstNode.type === "message") {
      const msg = firstNode.data.message as string
      if (msg) addBotMessage(msg)
      if (nodes.length === 1) {
        setAwaitingInput(true)
      } else {
        setTimeout(() => { setAwaitingInput(true); setTimeout(() => inputRef.current?.focus(), 50) }, 300)
      }
    } else {
      processNode(firstNode)
    }
  }

  const handleOptionSelect = (option: string) => {
    setMessages((prev) => [...prev, { role: "user", text: option }])
    setVariables((prev) => ({ ...prev, lastChoice: option }))
    setAwaitingInput(false)
    setTimeout(() => {
      addBotMessage(`You selected: "${option}"`)
      setTimeout(() => advanceNode(), 400)
    }, 200)
  }

  const handleSend = () => {
    if (!input.trim() || !awaitingInput || loading || finished) return
    const text = input.trim()
    setMessages((prev) => [...prev, { role: "user", text }])
    setInput("")
    setAwaitingInput(false)
    const currentNode = nodes[currentNodeIdx]
    if (currentNode?.type === "input") {
      const varName = (currentNode.data.variable as string) || "userInput"
      setVariables((prev) => ({ ...prev, [varName]: text }))
    }
    setTimeout(() => {
      addBotMessage(`Got it! Thanks for your response.`)
      setTimeout(() => advanceNode(), 400)
    }, 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const showOptionsInCurrent = nodes[currentNodeIdx]?.type === "options" && messages.some((m) => m.type === "options")

  return (
    <div className={cn("flex h-full flex-col rounded-xl border shadow-sm overflow-hidden ", !bgColor && "")}
      style={{ backgroundColor: bgColor || undefined }}
    >
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ backgroundColor: themeColor || "#3b82f6" }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">Chat Preview</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
              <button onClick={startChat}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: themeColor || undefined }}
            >
              Start Preview
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "system" && msg.type === "options" && (
                  <div className="flex flex-wrap gap-2 justify-center my-2">
                    {(() => {
                      const node = nodes[currentNodeIdx]
                      const choices = (node?.data?.choices as string[]) || []
                      return choices.map((choice: string, ci: number) => (
                        <button key={ci} onClick={() => handleOptionSelect(choice)}
                          disabled={!awaitingInput}
                          className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{
                            borderColor: themeColor || "#3b82f6",
                            color: themeColor || "#3b82f6",
                            backgroundColor: `${themeColor}10` || "#3b82f610",
                          }}
                        >
                          {choice}
                        </button>
                      ))
                    })()}
                  </div>
                )}
                {msg.role === "system" && msg.type === "condition" && (
                  <div className="flex justify-center my-1">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50  border border-red-200  text-xs text-red-600  font-mono">
                      <Terminal className="h-3 w-3" />
                      {(msg as any).data?.condExpr || `${(msg as any).data?.condVariable || ""} ${(msg as any).data?.condOperator || ""} ${(msg as any).data?.condValue || ""}`}
                    </div>
                  </div>
                )}
                {(msg.role === "bot" || msg.role === "user") && (
                  <div className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                      msg.role === "user" ? "rounded-br-md" : "rounded-bl-md bg-gray-100 "
                    )}
                      style={msg.role === "user"
                        ? { backgroundColor: themeColor || undefined, color: "#fff" }
                        : { color: textColor || undefined }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-gray-100  px-4 py-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </div>
              </div>
            )}
            {finished && (
              <div className="flex justify-center mt-4">
                <button onClick={() => { setMessages([]); setCurrentNodeIdx(-1); setVariables({}); setAwaitingInput(false); setFinished(false); setLoading(false) }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Restart preview
                </button>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {messages.length > 0 && !finished && (
        <div className={cn("border-t  p-3", !bgColor && "")} style={{ backgroundColor: bgColor || undefined }}>
          {showOptionsInCurrent && awaitingInput ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 ">
              <Check className="h-4 w-4" /> Select an option above
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input ref={inputRef}
                value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!awaitingInput || loading}
                placeholder={awaitingInput ? "Type a message..." : loading ? "Processing..." : "Waiting..."}
                className="flex-1 rounded-lg border border-gray-200  bg-gray-50   px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:opacity-50"
              />
              <button onClick={handleSend}
                disabled={!awaitingInput || loading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: themeColor || undefined }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
