"use client"

import { create } from "zustand"
import type { FlowNode, FlowEdge } from "@/types"
import { generateId } from "@/lib/utils"

interface HistoryEntry {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

interface ChatbotStore {
  nodes: FlowNode[]
  edges: FlowEdge[]
  selectedNodeId: string | null
  selectedNodeIds: string[]
  selectedEdgeId: string | null
  clipboard: FlowNode[] | null
  showGrid: boolean
  snapToGrid: boolean
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
  removeSelectedNodes: () => void
  addEdge: (edge: FlowEdge) => void
  removeEdge: (id: string) => void
  selectNode: (id: string | null) => void
  toggleNodeSelection: (id: string) => void
  selectEdge: (id: string | null) => void
  duplicateNode: (id: string) => void
  copyNodes: () => void
  pasteNodes: (x?: number, y?: number) => void
  toggleGrid: () => void
  toggleSnap: () => void
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

function canConnect(nodes: FlowNode[], edges: FlowEdge[], source: string, target: string): boolean {
  if (source === target) return false
  if (edges.some((e) => e.source === source && e.target === target)) return false
  return true
}

export const useChatbotStore = create<ChatbotStore>((set, get) => ({
  nodes: initialNodes,
  edges: [],
  selectedNodeId: null,
  selectedNodeIds: [],
  selectedEdgeId: null,
  clipboard: null,
  showGrid: true,
  snapToGrid: true,
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
  past: [],
  future: [],
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => { pushHistory(set, get); set((s) => ({ nodes: [...s.nodes, node] })) },
  updateNode: (id, data) => { pushHistory(set, get); set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)) })) },
  updateNodePosition: (id, x, y) => set((s) => ({ nodes: s.nodes.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)) })),
  removeNode: (id) => { pushHistory(set, get); set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id), edges: s.edges.filter((e) => e.source !== id && e.target !== id), selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId, selectedNodeIds: s.selectedNodeIds.filter((nid) => nid !== id) })) },
  removeSelectedNodes: () => {
    const s = get()
    const ids = s.selectedNodeIds.length > 0 ? s.selectedNodeIds : (s.selectedNodeId ? [s.selectedNodeId] : [])
    if (ids.length === 0) return
    pushHistory(set, get)
    set((state) => ({ nodes: state.nodes.filter((n) => !ids.includes(n.id)), edges: state.edges.filter((e) => !ids.includes(e.source) && !ids.includes(e.target)), selectedNodeId: null, selectedNodeIds: [] }))
  },
  addEdge: (edge) => {
    const s = get()
    if (!canConnect(s.nodes, s.edges, edge.source, edge.target)) return
    pushHistory(set, get)
    set((state) => ({ edges: [...state.edges, edge] }))
  },
  removeEdge: (id) => { pushHistory(set, get); set((s) => ({ edges: s.edges.filter((e) => e.id !== id), selectedEdgeId: s.selectedEdgeId === id ? null : s.selectedEdgeId })) },
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null, selectedNodeIds: id ? [id] : [] }),
  toggleNodeSelection: (id) => set((s) => {
    const exists = s.selectedNodeIds.includes(id)
    const newIds = exists ? s.selectedNodeIds.filter((nid) => nid !== id) : [...s.selectedNodeIds, id]
    return { selectedNodeIds: newIds, selectedNodeId: newIds.length === 1 ? newIds[0] : s.selectedNodeId, selectedEdgeId: null }
  }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null, selectedNodeIds: [] }),
  duplicateNode: (id) => {
    const s = get()
    const node = s.nodes.find((n) => n.id === id)
    if (!node) return
    pushHistory(set, get)
    const newNode: FlowNode = { ...JSON.parse(JSON.stringify(node)), id: generateId(), position: { x: node.position.x + 40, y: node.position.y + 60 } }
    set((state) => ({ nodes: [...state.nodes, newNode] }))
  },
  copyNodes: () => {
    const s = get()
    const ids = s.selectedNodeIds.length > 0 ? s.selectedNodeIds : (s.selectedNodeId ? [s.selectedNodeId] : [])
    if (ids.length === 0) return
    const copied = s.nodes.filter((n) => ids.includes(n.id)).map((n) => ({ ...JSON.parse(JSON.stringify(n)), id: generateId() }))
    set({ clipboard: copied })
  },
  pasteNodes: (x?: number, y?: number) => {
    const s = get()
    if (!s.clipboard || s.clipboard.length === 0) return
    pushHistory(set, get)
    const offsetX = x || (Math.max(...s.nodes.map((n) => n.position.x)) + 60)
    const offsetY = y || (Math.max(...s.nodes.map((n) => n.position.y)) + 60)
    const minX = Math.min(...s.clipboard.map((n) => n.position.x))
    const minY = Math.min(...s.clipboard.map((n) => n.position.y))
    const pasted = s.clipboard.map((n) => ({ ...n, position: { x: n.position.x - minX + offsetX, y: n.position.y - minY + offsetY } }))
    set((state) => ({ nodes: [...state.nodes, ...pasted], selectedNodeIds: pasted.map((n) => n.id), selectedNodeId: pasted[0]?.id || null }))
  },
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
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
    nodes: initialNodes, edges: [], selectedNodeId: null, selectedNodeIds: [], selectedEdgeId: null, past: [], future: [], clipboard: null, showGrid: true, snapToGrid: true,
    name: "My Chatbot", description: "", welcomeMsg: "Hello! How can I help you today?",
    themeColor: "#3b82f6", accentColor: "#1d4ed8", position: "bottom-right", bgColor: "#ffffff", textColor: "#1f2937", status: "draft", logoUrl: "",
  }),
  loadFromFlowData: (flowData, fields) => {
    const parsed = JSON.parse(flowData)
    set({ nodes: parsed.nodes || initialNodes, edges: parsed.edges || [], selectedNodeId: null, selectedNodeIds: [], selectedEdgeId: null, past: [], future: [], ...(fields || {}) })
  },
  toFlowData: () => {
    const { nodes, edges } = get()
    return JSON.stringify({ nodes, edges })
  },
}))