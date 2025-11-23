import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk"

/**
 * Eliza Runtime interface (simplified)
 * Based on the ai16z/eliza framework
 */
export interface ElizaRuntime {
  character?: ElizaCharacter
  registerAction?: (action: ElizaAction) => void
  [key: string]: unknown
}

/**
 * Eliza Character interface
 */
export interface ElizaCharacter {
  name: string
  bio?: string[]
  lore?: string[]
  messageExamples?: MessageExample[][]
  postExamples?: string[]
  topics?: string[]
  adjectives?: string[]
  knowledge?: string[]
  clients?: string[]
  plugins?: string[]
  settings?: {
    secrets?: Record<string, string>
    voice?: {
      model?: string
    }
  }
  [key: string]: unknown
}

/**
 * Eliza Message interface
 */
export interface ElizaMessage {
  user?: string
  content: {
    text: string
    action?: string
    source?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Message example for training
 */
export interface MessageExample {
  user: string
  content: {
    text: string
    [key: string]: unknown
  }
}

/**
 * Eliza State interface
 */
export interface ElizaState {
  userId?: string
  agentId?: string
  roomId?: string
  [key: string]: unknown
}

/**
 * Eliza Action interface
 */
export interface ElizaAction {
  name: string
  description: string
  similes?: string[]
  examples?: MessageExample[][]
  handler: (
    runtime: ElizaRuntime,
    message: ElizaMessage,
    state?: ElizaState,
    options?: Record<string, unknown>,
    callback?: (response: ElizaResponse) => Promise<void>
  ) => Promise<boolean>
  validate: (runtime: ElizaRuntime, message: ElizaMessage, state?: ElizaState) => Promise<boolean>
}

/**
 * Eliza Response interface
 */
export interface ElizaResponse {
  text: string
  action?: string
  error?: boolean
  [key: string]: unknown
}

/**
 * Eliza Plugin interface
 */
export interface ElizaPlugin {
  name: string
  description: string
  actions?: ElizaAction[]
  evaluators?: unknown[]
  providers?: unknown[]
  services?: unknown[]
}

/**
 * Configuration for Polkadot Eliza plugin
 */
export interface PolkadotElizaPluginConfig {
  agentKit: PolkadotAgentKit
  enabledActions?: string[]
  customActionConfig?: Record<string, unknown>
}

