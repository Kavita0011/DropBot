// The seven node types in the chatbot builder flow chart.
// Each has a distinct behavior at runtime and a distinct editor form in node-editor.tsx.
export type NodeType = "welcome" | "message" | "options" | "input" | "condition" | "api_call" | "end";

// A node on the builder canvas. data is type-specific: message/welcome stores { message }, options stores { question, choices[] },
// input stores { question, variable }, condition stores { condVariable, condOperator, condValue }, api_call stores { apiUrl, method }.
export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

// A directed connection between two nodes. label is used for condition branches (e.g., "True"/"False")
// and for routing options node choices.
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ChatbotFlow {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface ChatbotData {
  id: string;
  name: string;
  description: string;
  welcomeMsg: string;
  themeColor: string;
  accentColor: string;
  position: string;
  bgColor: string;
  textColor: string;
  flowData: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export type PlanType = "free" | "pro" | "business";

export interface SubscriptionData {
  id: string;
  plan: PlanType;
  status: string;
  currentPeriodEnd: string | null;
}
