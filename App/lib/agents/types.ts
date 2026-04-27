export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentRunOptions {
  agentId: string;
  agentType?: string;
  userId: string;
  conversationId: string;
  messages: AgentMessage[];
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}

export interface AgentRunResult {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  totalTokens: number;
  model: string;
  toolCalls?: ToolCallRecord[];
}

export interface ToolCallRecord {
  toolName: string;
  input: Record<string, unknown>;
  result: unknown;
  error?: string;
}

export interface OrchestrationTask {
  task: string;
  agentIds: string[];
  userId: string;
  mode: "sequential" | "parallel" | "auto";
}

export interface OrchestrationResult {
  finalAnswer: string;
  agentResults: Array<{
    agentId: string;
    agentName: string;
    result: string;
    tokensUsed: number;
  }>;
  totalTokens: number;
}
