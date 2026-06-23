import OpenAI from "openai"
import type { FlowNode, FlowEdge } from "@/types"

// Attempts to init OpenAI client — returns null if API key is not configured (local-only mode)
function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

// Builds the message array for OpenAI: system prompt (from welcome node) + last 10 history turns + current user message
function buildConversationContext(nodes: FlowNode[], edges: FlowEdge[], userMessage: string, history: { role: "user" | "assistant"; content: string }[]) {
  const welcomeNode = nodes.find((n) => n.type === "welcome")
  const systemPrompt = welcomeNode?.data?.message
    ? `You are a helpful chatbot. Initial greeting: "${welcomeNode.data.message}". Respond naturally and conversationally. Keep responses concise (under 3 sentences).`
    : "You are a helpful chatbot. Respond naturally and conversationally. Keep responses concise."

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ]

  for (const msg of history.slice(-10)) {
    messages.push(msg)
  }

  messages.push({ role: "user", content: userMessage })

  return messages
}

// Calls OpenAI gpt-4o-mini; returns null if key is missing or API call fails (triggers local fallback)
async function getAIReply(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const openai = getOpenAI()
  if (!openai) return null

  const modelName = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const completion = await openai.chat.completions.create({
    model: modelName,
    messages,
    max_tokens: 200,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || null
}

// Fallback flow engine: walks the node graph based on current node type.
// Used when OpenAI is unavailable — handles all 7 node types.
function getLocalReply(nodes: FlowNode[], edges: FlowEdge[], currentNodeId: string | null, userMessage: string): { reply: string; nextNodeId: string | null } {
  if (!currentNodeId) {
    const welcome = nodes.find((n) => n.type === "welcome")
    return { reply: welcome?.data?.message as string || "Hello!", nextNodeId: welcome?.id || null }
  }

  const currentNode = nodes.find((n) => n.id === currentNodeId)
  if (!currentNode) return { reply: "I'm not sure how to respond.", nextNodeId: null }

  if (currentNode.type === "message") {
    const connectedEdge = edges.find((e) => e.source === currentNode.id)
    return { reply: currentNode.data?.message as string || "Here's some information.", nextNodeId: connectedEdge?.target || null }
  }

  if (currentNode.type === "options") {
    const question = currentNode.data?.question as string || "Please choose:"
    const match = edges.find((e) => e.source === currentNode.id && e.label?.toLowerCase() === userMessage.toLowerCase())
    if (match) {
      const options = currentNode.data?.options as Array<{ label: string; text: string }> | undefined
      const matchedOption = options?.find((o) => o.label?.toLowerCase() === userMessage.toLowerCase())
      return { reply: matchedOption?.text || question, nextNodeId: match.target }
    }
    return { reply: question, nextNodeId: currentNode.id }
  }

  if (currentNode.type === "input") {
    const question = currentNode.data?.question as string || "Please enter:"
    const connectedEdge = edges.find((e) => e.source === currentNode.id)
    return { reply: question, nextNodeId: connectedEdge?.target || null }
  }

  if (currentNode.type === "condition") {
    const variable = currentNode.data?.variable as string || ""
    const operator = currentNode.data?.operator as string || "equals"
    const value = currentNode.data?.value as string || ""
    const trueEdge = edges.find((e) => e.source === currentNode.id && e.label === "true")
    const falseEdge = edges.find((e) => e.source === currentNode.id && e.label === "false")
    const userVal = userMessage
    let matched = false
    if (operator === "equals") matched = userVal.toLowerCase() === value.toLowerCase()
    else if (operator === "contains") matched = userVal.toLowerCase().includes(value.toLowerCase())
    else if (operator === "not_empty") matched = userVal.trim().length > 0
    return { reply: `Evaluating condition: ${variable} ${operator} "${value}"`, nextNodeId: matched ? (trueEdge?.target || null) : (falseEdge?.target || null) }
  }

  if (currentNode.type === "api_call") {
    const connectedEdge = edges.find((e) => e.source === currentNode.id)
    return { reply: currentNode.data?.successMessage as string || "API call completed.", nextNodeId: connectedEdge?.target || null }
  }

  if (currentNode.type === "end") {
    return { reply: currentNode.data?.message as string || "Thank you! Have a great day!", nextNodeId: null }
  }

  return { reply: "How can I help you?", nextNodeId: null }
}

// Dual-mode chat reply: tries OpenAI first; falls back to local flow traversal if AI is unavailable or fails.
// nodeId is returned for the client to track position in the flow graph for subsequent requests.
export async function generateChatReply(
  chatbotId: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  flowData: { nodes: FlowNode[]; edges: FlowEdge[] }
): Promise<{ reply: string; nodeId: string | null }> {
  const { nodes, edges } = flowData

  let aiReply: string | null = null
  try {
    aiReply = await getAIReply(buildConversationContext(nodes, edges, userMessage, history))
  } catch (e) {
    console.error("AI reply error:", e)
  }

  if (aiReply) {
    return { reply: aiReply, nodeId: null }
  }

  const lastNodeId = history.length > 0 ? null : null
  const local = getLocalReply(nodes, edges, lastNodeId, userMessage)
  return { reply: local.reply, nodeId: local.nextNodeId }
}
