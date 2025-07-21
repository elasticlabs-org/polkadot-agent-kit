import { z } from 'zod';

// Agent metadata schema
export const AgentMetadataSchema = z.object({
  name: z.string(),
  provider: z.enum(['ollama', 'openai']),
  model: z.string(),
  tools: z.array(z.string()),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastUsed: z.date().optional(),
  usageCount: z.number().nonnegative().default(0),
  version: z.string().default('1.0.0'),
});

// Agent creation options schema
export const AgentCreationOptionsSchema = z.object({
  name: z.string(),
  provider: z.enum(['ollama', 'openai']),
  model: z.string(),
  tools: z.array(z.string()).optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Chat message schema
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
});

// Provider status schema
export const ProviderStatusSchema = z.object({
  available: z.boolean(),
  connected: z.boolean(),
  models: z.array(z.string()),
  error: z.string().optional(),
});

// Type exports
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type AgentCreationOptions = z.infer<typeof AgentCreationOptionsSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

// Agent interface
export interface Agent {
  name: string;
  provider: string;
  model: string;
  tools: string[];
  execute(command: string): Promise<string>;
  chat(message: string): AsyncIterable<string>;
  getHistory(): ChatMessage[];
  clearHistory(): void;
}

// LLM Provider interface
export interface LLMProvider {
  name: string;
  initialize(config: any): Promise<void>;
  validateModel(model: string): Promise<boolean>;
  getAvailableModels(): Promise<string[]>;
  createAgent(tools: any[], config: AgentMetadata): Promise<Agent>;
  chat(agent: Agent, message: string): AsyncIterable<string>;
  validateConfig(config: any): Promise<boolean>;
  getStatus(): Promise<ProviderStatus>;
}

// Available tools
export const AVAILABLE_TOOLS = [
  'balance',
  'transfer',
  'xcm',
  'staking',
  'swap',
  'governance',
  'identity',
  'multisig',
] as const;

export type AvailableTool = typeof AVAILABLE_TOOLS[number];

// Tool descriptions for UI
export const TOOL_DESCRIPTIONS: Record<AvailableTool, string> = {
  balance: 'Check token balances on various chains',
  transfer: 'Transfer tokens between accounts',
  xcm: 'Cross-chain transfers using XCM',
  staking: 'Staking operations (nominate, bond, unbond)',
  swap: 'Token swapping via DEX protocols',
  governance: 'Participate in governance voting',
  identity: 'Manage on-chain identity',
  multisig: 'Multi-signature wallet operations',
};

// Default system prompts
export const DEFAULT_SYSTEM_PROMPTS = {
  general: `You are a helpful AI assistant specialized in Polkadot blockchain operations. You can help users with:
- Checking balances across different chains
- Transferring tokens
- Cross-chain operations using XCM
- Staking and nomination pool operations
- Token swapping
- Governance participation

Always be clear about what operations you're performing and ask for confirmation before executing transactions that involve spending tokens.`,

  trading: `You are a Polkadot trading assistant. You specialize in:
- Token balance monitoring
- Cross-chain asset transfers
- DEX trading and swapping
- Market analysis and recommendations

Always verify transaction details before execution and warn users about potential risks.`,

  staking: `You are a Polkadot staking specialist. You help users with:
- Nomination pool operations
- Validator selection and nomination
- Staking rewards management
- Unbonding and withdrawal processes

Always explain the implications of staking operations, including lock-up periods and risks.`,
} as const;

export type SystemPromptType = keyof typeof DEFAULT_SYSTEM_PROMPTS;
