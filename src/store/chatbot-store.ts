"use client"

import { create } from "zustand"
import type { FlowNode, FlowEdge } from "@/types"

interface HistoryEntry {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface ChatbotStore {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  name: string
  description: string
  welcomeMsg: string
  themeColor: string
  accentColor: string
  position: string
  bgColor: string
  textColor: string
  status: string
  logoUrl: string
  past: HistoryEntry[]
  future: HistoryEntry[]
  setNodes: (nodes: FlowNode[]) => void
  setEdges: (edges: FlowEdge[]) => void
  addNode: (node: FlowNode) => void
  updateNode: (id: string, data: Partial<FlowNode>) => void
  updateNodePosition: (id: string, x: number, y: number) => void
  removeNode: (id: string) => void
  addEdge: (edge: FlowEdge) => void
  removeEdge: (id: string) => void
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  setName: (name: string) => void
  setDescription: (description: string) => void
  setWelcomeMsg: (msg: string) => void
  setThemeColor: (color: string) => void
  setAccentColor: (color: string) => void
  setPosition: (pos: string) => void
  setBgColor: (color: string) => void
  setTextColor: (color: string) => void
  setStatus: (status: string) => void
  setLogoUrl: (url: string) => void
  undo: () => void
  redo: () => void
  reset: () => void
  loadFromFlowData: (flowData: string, fields?: Record<string, unknown>) => void
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

function snapshot(get: () => ChatbotStore): HistoryEntry {
  return { nodes: JSON.parse(JSON.stringify(get().nodes)), edges: JSON.parse(JSON.stringify(get().edges)) }
}

function pushHistory(set: any, get: () => ChatbotStore) {
  set((s: ChatbotStore) => ({ past: [...s.past.slice(-50), snapshot(get)], future: [] }))
}

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  past: [],
  future: [],
  name: "My Chatbot",
  description: "",
  welcomeMsg: "Hello! How can I help you today?",
  themeColor: "#3b82f6",
  accentColor: "#1d4ed8",
  position: "bottom-right",
  bgColor: "#ffffff",
  textColor: "#1f2937",
  status: "draft",
  logoUrl: "",
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => { pushHistory(set, get); set((s) => ({ nodes: [...s.nodes, node] })) },
  updateNode: (id, data) => { pushHistory(set, get); set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)) })) },
  updateNodePosition: (id, x, y) => set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)) })),
  removeNode: (id) => { pushHistory(set, get); set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id), edges: s.edges.filter((e) => e.source !== id && e.target !== id), selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId })) },
  addEdge: (edge) => { pushHistory(set, get); set((s) => ({ edges: [...s.edges, edge] })) },
  removeEdge: (id) => { pushHistory(set, get); set((s) => ({ edges: s.edges.filter((e) => e.id !== id), selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId })) },
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),
  setWelcomeMsg: (msg) => set({ welcomeMsg: msg }),
  setThemeColor: (color) => set({ themeColor: color }),
  setAccentColor: (color) => set({ accentColor: color }),
  setPosition: (pos) => set({ position: pos }),
  setBgColor: (color) => set({ bgColor: color }),
  setTextColor: (color) => set({ textColor: color }),
  setStatus: (status) => set({ status }),
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  undo: () => {
    const s = get()
    if (s.past.length === 0) return
    const prev = s.past[s.past.length - 1]
    set((state) => ({ past: state.past.slice(0, -1), future: [{ nodes: JSON.parse(JSON.stringify(state.nodes)), edges: JSON.parse(JSON.stringify(state.edges)) }, ...state.future], nodes: prev.nodes, edges: prev.edges }))
  },
  redo: () => {
    const s = get()
    if (s.future.length === 0) return
    const next = s.future[0]
    set((state) => ({ past: [...state.past, { nodes: JSON.parse(JSON.stringify(state.nodes)), edges: JSON.parse(JSON.stringify(state.edges)) }], future: state.future.slice(1), nodes: next.nodes, edges: next.edges }))
  },
  reset: () => set({
    nodes: initialNodes, edges: [], selectedNodeId: null, selectedEdgeId: null, past: [], future: [],
    name: "My Chatbot", description: "", welcomeMsg: "Hello! How can I help you today?",
    themeColor: "#3b82f6", accentColor: "#1d4ed8", position: "bottom-right", bgColor: "#ffffff", textColor: "#1f2937", status: "draft", logoUrl: "",
  }),
  loadFromFlowData: (flowData, fields) => {
    const parsed = JSON.parse(flowData)
    set({ nodes: parsed.nodes || initialNodes, edges: parsed.edges || [], selectedNodeId: null, selectedEdgeId: null, past: [], future: [], ...(fields || {}) })
  },
  toFlowData: () => {
    const { nodes, edges } = get()
    return JSON.stringify({ nodes, edges })
  },
}))