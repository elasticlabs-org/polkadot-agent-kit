// Command option interface
export interface CommandOption {
  flags: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

// Base command interface
export interface Command {
  name: string;
  description: string;
  options: CommandOption[];
  action: (args: any, options: any) => Promise<void>;
}

// CLI Core interface
export interface CLICore {
  configManager: any; // Will be properly typed when implemented
  agentManager: any; // Will be properly typed when implemented
  llmManager: any; // Will be properly typed when implemented
  logger: any; // Will be properly typed when implemented
}

// Init command options
export interface InitOptions {
  name?: string;
  template?: string;
  llmProvider?: "ollama" | "openai";
  interactive?: boolean;
}

// Config command operations
export interface ConfigCommands {
  get: (key?: string) => void;
  set: (key: string, value: string) => void;
  list: () => void;
  reset: () => void;
  validate: () => void;
}

// Agent command options
export interface AgentCreateOptions {
  provider?: "ollama" | "openai";
  model?: string;
  tools?: string;
  description?: string;
  interactive?: boolean;
}

export interface AgentListOptions {
  provider?: string;
  format?: "table" | "json";
  filter?: string;
}

export interface AgentRunOptions {
  format?: "json" | "table" | "raw";
  timeout?: number;
  verbose?: boolean;
}

export interface AgentChatOptions {
  history?: boolean;
  save?: boolean;
  timeout?: number;
}

// Error types
export class CLIError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "CLIError";
  }
}

export class ValidationError extends CLIError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConfigurationError extends CLIError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

export class ProviderError extends CLIError {
  constructor(
    message: string,
    public provider: string,
  ) {
    super(message, "PROVIDER_ERROR");
    this.name = "ProviderError";
  }
}

export class AgentError extends CLIError {
  constructor(
    message: string,
    public agentName?: string,
  ) {
    super(message, "AGENT_ERROR");
    this.name = "AgentError";
  }
}
