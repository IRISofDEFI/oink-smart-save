import Groq from 'groq-sdk';
import type { AIProvider, AIResponse, AITool, AIToolResult, ChatMessage } from './provider';

export class GroqProvider implements AIProvider {
  private client: Groq;
  private readonly model = 'llama-3.3-70b-versatile';

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  }

  async chat(messages: ChatMessage[], tools: AITool[]): Promise<AIResponse> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as unknown as Groq.Chat.ChatCompletionMessageParam[],
      tools: tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    if (!choice) throw new Error('No response from Groq');

    const msg = choice.message;
    let toolCalls: AIToolResult[] | null = null;

    if (msg.tool_calls?.length) {
      toolCalls = msg.tool_calls.map(tc => ({
        id: tc.id,
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments) as Record<string, unknown>,
      }));
    }

    return { message: msg.content ?? '', toolCalls };
  }
}
