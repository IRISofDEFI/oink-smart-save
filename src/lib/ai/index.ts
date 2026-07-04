import { GroqProvider } from './groq-provider';
import type { AIProvider } from './provider';

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_provider) return _provider;

  const name = (import.meta.env.VITE_AI_PROVIDER as string | undefined) ?? 'groq';

  if (name === 'groq') {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
    if (!apiKey) throw new Error('VITE_GROQ_API_KEY is not set in .env');
    _provider = new GroqProvider(apiKey);
    return _provider;
  }

  throw new Error(`Unknown AI provider: "${name}". Set VITE_AI_PROVIDER=groq in .env.`);
}
