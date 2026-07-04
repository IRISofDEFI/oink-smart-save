export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIToolResult {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AIResponse {
  message: string;
  toolCalls: AIToolResult[] | null;
}

export interface AIProvider {
  chat(messages: ChatMessage[], tools: AITool[]): Promise<AIResponse>;
}
