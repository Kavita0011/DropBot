export type NodeType = "welcome" | "message" | "options" | "input" | "condition" | "api_call" | "end";

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

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
