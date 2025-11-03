export type AgentProvider = 'gemini' | 'ollama';

export interface AgentResponse {
  input: string;
  output: string;
  intermediateSteps?: any[];
  provider: AgentProvider;
  model: string;
}

