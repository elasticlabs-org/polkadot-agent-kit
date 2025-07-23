import { z } from "zod";

// Configuration schemas
export const WalletConfigSchema = z.object({
  type: z.enum(["mnemonic", "keyring", "polkadot-js"]),
  path: z.string().optional(),
  defaultAccount: z.string().optional(),
});

export const PolkadotConfigSchema = z.object({
  defaultChain: z.string().default("polkadot"),
  rpcEndpoints: z.record(z.string()).default({}),
  walletConfig: WalletConfigSchema.optional(),
});

export const UIConfigSchema = z.object({
  colorOutput: z.boolean().default(true),
  verboseLogging: z.boolean().default(false),
  progressIndicators: z.boolean().default(true),
  autoComplete: z.boolean().default(true),
  theme: z.enum(["light", "dark", "auto"]).default("auto"),
});

export const AgentTemplateSchema = z.object({
  name: z.string(),
  description: z.string(),
  provider: z.enum(["ollama", "openai"]),
  model: z.string(),
  tools: z.array(z.string()),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
});

export const AgentConfigSchema = z.object({
  defaultTools: z.array(z.string()).default(["balance", "transfer", "xcm"]),
  storageLocation: z.string().default("~/.pak/agents"),
  maxHistory: z.number().positive().default(100),
  templates: z.array(AgentTemplateSchema).default([]),
});

export const OllamaConfigSchema = z.object({
  baseUrl: z.string().url().default("http://localhost:11434"),
  defaultModel: z.string().default("llama2"),
  timeout: z.number().positive().default(30000),
  models: z.array(z.string()).default([]),
});

export const OpenAIConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
  defaultModel: z.string().default("gpt-3.5-turbo"),
  timeout: z.number().positive().default(30000),
  models: z.array(z.string()).default([]),
});

export const LLMConfigSchema = z.object({
  defaultProvider: z.enum(["ollama", "openai"]).default("ollama"),
  ollama: OllamaConfigSchema.optional(),
  openai: OpenAIConfigSchema.optional(),
});

export const CLIConfigSchema = z.object({
  version: z.string().default("1.0.0"),
  llm: LLMConfigSchema.default({}),
  agents: AgentConfigSchema.default({}),
  ui: UIConfigSchema.default({}),
  polkadot: PolkadotConfigSchema.default({}),
});

// Type exports
export type WalletConfig = z.infer<typeof WalletConfigSchema>;
export type PolkadotConfig = z.infer<typeof PolkadotConfigSchema>;
export type UIConfig = z.infer<typeof UIConfigSchema>;
export type AgentTemplate = z.infer<typeof AgentTemplateSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type OllamaConfig = z.infer<typeof OllamaConfigSchema>;
export type OpenAIConfig = z.infer<typeof OpenAIConfigSchema>;
export type LLMConfig = z.infer<typeof LLMConfigSchema>;
export type CLIConfig = z.infer<typeof CLIConfigSchema>;

// Default configuration
export const DEFAULT_CONFIG: CLIConfig = {
  version: "1.0.0",
  llm: {
    defaultProvider: "ollama",
    ollama: {
      baseUrl: "http://localhost:11434",
      defaultModel: "llama2",
      timeout: 30000,
      models: [],
    },
    openai: {
      defaultModel: "gpt-3.5-turbo",
      timeout: 30000,
      models: [],
    },
  },
  agents: {
    defaultTools: ["balance", "transfer", "xcm"],
    storageLocation: "~/.pak/agents",
    maxHistory: 100,
    templates: [],
  },
  ui: {
    colorOutput: true,
    verboseLogging: false,
    progressIndicators: true,
    autoComplete: true,
    theme: "auto",
  },
  polkadot: {
    defaultChain: "polkadot",
    rpcEndpoints: {
      polkadot: "wss://rpc.polkadot.io",
      kusama: "wss://kusama-rpc.polkadot.io",
      westend: "wss://westend-rpc.polkadot.io",
    },
  },
};
