import OpenAI from "openai"
import type { FlowNode, FlowEdge } from "@/types"

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

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

async function getAIReply(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const openai = getOpenAI()
  if (!openai) return null

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 200,
    temperature: 0.7,
  })

  return completion.choices[0]?.message?.content || null
}

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
    return { reply: question, nextNodeId: match?.target || null }
  }

  if (currentNode.type === "input") {
    const question = currentNode.data?.question as string || "Please enter:"
    const connectedEdge = edges.find((e) => e.source === currentNode.id)
    return { reply: question, nextNodeId: connectedEdge?.target || null }
  }

  if (currentNode.type === "end") {
    return { reply: currentNode.data?.message as string || "Thank you! Have a great day!", nextNodeId: null }
  }

  return { reply: "How can I help you?", nextNodeId: null }
}

export async function generateChatReply(
  chatbotId: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  flowData: { nodes: FlowNode[]; edges: FlowEdge[] }
): Promise<{ reply: string; nodeId: string | null }> {
  const { nodes, edges } = flowData

  const aiReply = await getAIReply(buildConversationContext(nodes, edges, userMessage, history))

  if (aiReply) {
    return { reply: aiReply, nodeId: null }
  }

  const lastNodeId = history.length > 0 ? null : null
  const local = getLocalReply(nodes, edges, lastNodeId, userMessage)
  return { reply: local.reply, nodeId: local.nextNodeId }
}
