import {
  ASSETS_PROMPT,
  BIFROST_PROMPT,
  DYNAMIC_CHAIN_INITIALIZATION_PROMPT,
  IDENTITY_PROMPT,
  NOMINATION_PROMPT,
  SWAP_PROMPT,
} from "@polkadot-agent-kit/llm";
import { z } from "zod";

// Polkadot Agent Kit configuration schema
export const PolkadotAgentConfigSchema = z.object({
  privateKey: z.string(),
  keyType: z.enum(["Sr25519", "Ed25519"]).default("Sr25519"),
  chains: z.array(z.string()).optional(), // If undefined, all chains are used
});

// Agent metadata schema
export const AgentMetadataSchema = z.object({
  name: z.string(),
  provider: z.enum(["ollama", "openai"]),
  model: z.string(),
  tools: z.array(z.string()),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  polkadotConfig: PolkadotAgentConfigSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  lastUsed: z.date().optional(),
  usageCount: z.number().nonnegative().default(0),
  version: z.string().default("1.0.0"),
});

// Agent creation options schema
export const AgentCreationOptionsSchema = z.object({
  name: z.string(),
  provider: z.enum(["ollama", "openai"]),
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
  role: z.enum(["user", "assistant", "system"]),
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
export type PolkadotAgentConfig = z.infer<typeof PolkadotAgentConfigSchema>;
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
  "balance",
  "transfer",
  "xcm",
  "staking",
  "swap",
  "governance",
  "identity",
  "multisig",
] as const;

export type AvailableTool = (typeof AVAILABLE_TOOLS)[number];

// Tool descriptions for UI
export const TOOL_DESCRIPTIONS: Record<AvailableTool, string> = {
  balance: "Check token balances on various chains",
  transfer: "Transfer tokens between accounts",
  xcm: "Cross-chain transfers using XCM",
  staking: "Staking operations (nominate, bond, unbond)",
  swap: "Token swapping via DEX protocols",
  governance: "Participate in governance voting",
  identity: "Manage on-chain identity",
  multisig: "Multi-signature wallet operations",
};

export const DEFAULT_SYSTEM_PROMPT =
  ASSETS_PROMPT +
  SWAP_PROMPT +
  NOMINATION_PROMPT +
  IDENTITY_PROMPT +
  BIFROST_PROMPT +
  DYNAMIC_CHAIN_INITIALIZATION_PROMPT;
