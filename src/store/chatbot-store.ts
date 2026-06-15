import { create } from "zustand"
import type { FlowNode, FlowEdge } from "@/types"

interface ChatbotStore {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  name: string
  description: string
  welcomeMsg: string
  themeColor: string
  accentColor: string
  position: string
  bgColor: string
  textColor: string
  published: boolean
  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: FlowEdge[]) => void
  addNode: (node: FlowNode) => void
  updateNode: (id: string, data: Partial<FlowNode>) => void
  removeNode: (id: string) => void
  addEdge: (edge: FlowEdge) => void
  removeEdge: (id: string) => void
  selectNode: (id: string | null) => void
  setName: (name: string) => void
  setDescription: (description: string) => void
  setWelcomeMsg: (msg: string) => void
  setThemeColor: (color: string) => void
  setAccentColor: (color: string) => void
  setPosition: (pos: string) => void
  setBgColor: (color: string) => void
  setTextColor: (color: string) => void
  setPublished: (published: boolean) => void
  reset: () => void
  loadFromFlowData: (flowData: string, fields?: Partial<ChatbotStore>) => void
  toFlowData: () => string
}

const initialNodes: FlowNode[] = [
  {
    id: "welcome",
    type: "welcome",
    position: { x: 300, y: 50 },
    data: { message: "Hello! How can I help you today?" },
  },
]

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  selectedNodeId: null,
  name: "My Chatbot",
  description: "",
  welcomeMsg: "Hello! How can I help you today?",
  themeColor: "#3b82f6",
  accentColor: "#1d4ed8",
  position: "bottom-right",
  bgColor: "#ffffff",
  textColor: "#1f2937",
  published: false,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  updateNode: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    })),
  removeNode: (id) =>
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    })),
  addEdge: (edge) => set((s) => ({ edges: [...s.edges, edge] })),
  removeEdge: (id) =>
    set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),
  selectNode: (id) => set({ selectedNodeId: id }),
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setWelcomeMsg: (msg) => set({ welcomeMsg: msg }),
  setThemeColor: (color) => set({ themeColor: color }),
  setAccentColor: (color) => set({ accentColor: color }),
  setPosition: (pos) => set({ position: pos }),
  setBgColor: (color) => set({ bgColor: color }),
  setTextColor: (color) => set({ textColor: color }),
  setPublished: (published) => set({ published }),
  reset: () =>
    set({
      nodes: initialNodes,
      edges: [],
      selectedNodeId: null,
      name: "My Chatbot",
      description: "",
      welcomeMsg: "Hello! How can I help you today?",
      themeColor: "#3b82f6",
      accentColor: "#1d4ed8",
      position: "bottom-right",
      bgColor: "#ffffff",
      textColor: "#1f2937",
      published: false,
    }),
  loadFromFlowData: (flowData, fields) => {
    const parsed = JSON.parse(flowData)
    set({
      nodes: parsed.nodes || initialNodes,
      edges: parsed.edges || [],
      ...(fields || {}),
    })
  },
  toFlowData: () => {
    const { nodes, edges } = get()
    return JSON.stringify({ nodes, edges })
  },
}))
