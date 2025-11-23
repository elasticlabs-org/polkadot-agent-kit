import type { Action } from "@polkadot-agent-kit/llm"
import type { z } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

import type { PolkadotAgentKit } from "./api"

/**
 * Google A2A (Agent-to-Agent) Protocol Types
 */

/**
 * A2A Tool Definition
 * Following Google's Agent-to-Agent protocol specification
 */
export interface A2ATool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

/**
 * A2A Tool Call
 * Represents a request to execute a tool
 */
export interface A2AToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string // JSON stringified arguments
  }
}

/**
 * A2A Tool Response
 * The result of executing a tool
 */
export interface A2AToolResponse {
  tool_call_id: string
  role: "tool"
  name: string
  content: string
}

/**
 * A2A Message
 * Standard message format in A2A protocol
 */
export interface A2AMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  name?: string
  tool_calls?: A2AToolCall[]
  tool_call_id?: string
}

/**
 * A2A Conversation
 * A sequence of messages in an A2A conversation
 */
export interface A2AConversation {
  messages: A2AMessage[]
}

/**
 * Convert Polkadot Agent Kit actions to A2A tool format
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns Array of A2A tool definitions
 *
 * @example
 * ```typescript
 * const agentKit = new PolkadotAgentKit({ ... });
 * const a2aTools = getA2ATools(agentKit);
 *
 * // Use with Google's A2A protocol
 * const response = await a2aAgent.chat({
 *   messages: [...],
 *   tools: a2aTools
 * });
 * ```
 */
export function getA2ATools(polkadotAgentKit: PolkadotAgentKit): A2ATool[] {
  const actions: Action[] = polkadotAgentKit.getActions()

  return actions.map(action => convertActionToA2ATool(action))
}

/**
 * Convert a single action to A2A tool format
 */
function convertActionToA2ATool(action: Action): A2ATool {
  // Convert Zod schema to JSON Schema
  const jsonSchema = zodToJsonSchema(action.schema, {
    name: action.name,
    $refStrategy: "none"
  })

  // Extract parameters from the JSON schema
  const parameters = {
    type: "object",
    properties: (jsonSchema as any).properties || {},
    required: (jsonSchema as any).required || []
  }

  return {
    type: "function",
    function: {
      name: action.name,
      description: action.description,
      parameters
    }
  }
}

/**
 * Execute A2A tool calls
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @param toolCalls - Array of A2A tool calls to execute
 * @returns Array of A2A tool responses
 *
 * @example
 * ```typescript
 * const toolCalls = [
 *   {
 *     id: "call_123",
 *     type: "function",
 *     function: {
 *       name: "check_balance",
 *       arguments: JSON.stringify({ chain: "polkadot" })
 *     }
 *   }
 * ];
 *
 * const responses = await executeA2AToolCalls(agentKit, toolCalls);
 * ```
 */
export async function executeA2AToolCalls(
  polkadotAgentKit: PolkadotAgentKit,
  toolCalls: A2AToolCall[]
): Promise<A2AToolResponse[]> {
  const actions = polkadotAgentKit.getActions()
  const actionMap = new Map(actions.map(action => [action.name, action]))

  const responses = await Promise.all(
    toolCalls.map(async toolCall => {
      try {
        const action = actionMap.get(toolCall.function.name)

        if (!action) {
          return {
            tool_call_id: toolCall.id,
            role: "tool" as const,
            name: toolCall.function.name,
            content: JSON.stringify({
              success: false,
              error: `Tool '${toolCall.function.name}' not found`
            })
          }
        }

        // Parse arguments
        const args = JSON.parse(toolCall.function.arguments)

        // Execute the action
        const result = await action.invoke(args)

        return {
          tool_call_id: toolCall.id,
          role: "tool" as const,
          name: toolCall.function.name,
          content: result
        }
      } catch (error) {
        return {
          tool_call_id: toolCall.id,
          role: "tool" as const,
          name: toolCall.function.name,
          content: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    })
  )

  return responses
}

/**
 * A2A Handler class for managing A2A protocol conversations
 */
export class A2AHandler {
  private agentKit: PolkadotAgentKit
  private tools: A2ATool[]

  constructor(agentKit: PolkadotAgentKit) {
    this.agentKit = agentKit
    this.tools = getA2ATools(agentKit)
  }

  /**
   * Get all available A2A tools
   */
  public getTools(): A2ATool[] {
    return this.tools
  }

  /**
   * Handle a tool call request
   */
  public async handleToolCall(toolCall: A2AToolCall): Promise<A2AToolResponse> {
    const responses = await executeA2AToolCalls(this.agentKit, [toolCall])
    return responses[0]
  }

  /**
   * Handle multiple tool calls in parallel
   */
  public async handleToolCalls(toolCalls: A2AToolCall[]): Promise<A2AToolResponse[]> {
    return executeA2AToolCalls(this.agentKit, toolCalls)
  }

  /**
   * Process a complete A2A message with tool calls
   */
  public async processMessage(message: A2AMessage): Promise<A2AToolResponse[]> {
    if (message.role !== "assistant" || !message.tool_calls || message.tool_calls.length === 0) {
      return []
    }

    return this.handleToolCalls(message.tool_calls)
  }

  /**
   * Create an A2A tool response message
   */
  public createToolResponseMessage(
    toolCallId: string,
    toolName: string,
    content: string
  ): A2AMessage {
    return {
      role: "tool",
      content,
      name: toolName,
      tool_call_id: toolCallId
    }
  }

  /**
   * Validate a tool call
   */
  public validateToolCall(toolCall: A2AToolCall): { valid: boolean; error?: string } {
    const tool = this.tools.find(t => t.function.name === toolCall.function.name)

    if (!tool) {
      return {
        valid: false,
        error: `Tool '${toolCall.function.name}' not found`
      }
    }

    try {
      JSON.parse(toolCall.function.arguments)
      return { valid: true }
    } catch {
      return {
        valid: false,
        error: "Invalid JSON in tool arguments"
      }
    }
  }
}

/**
 * Create an A2A handler for a Polkadot Agent Kit instance
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns A2AHandler instance
 *
 * @example
 * ```typescript
 * const agentKit = new PolkadotAgentKit({ ... });
 * const a2aHandler = createA2AHandler(agentKit);
 *
 * // Get tools for agent configuration
 * const tools = a2aHandler.getTools();
 *
 * // Handle tool calls from agent
 * const responses = await a2aHandler.handleToolCalls(toolCalls);
 * ```
 */
export function createA2AHandler(polkadotAgentKit: PolkadotAgentKit): A2AHandler {
  return new A2AHandler(polkadotAgentKit)
}
