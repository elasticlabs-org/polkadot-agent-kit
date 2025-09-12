/**
 * Main exports for the Polkadot Agent Kit Model Context Protocol (MCP) package
 */

import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js"
import type { Action } from "@polkadot-agent-kit/llm"
import type { PolkadotAgentKit } from "./api"
import { zodToJsonSchema } from "zod-to-json-schema"

/**
 * Interface for AgentKit MCP tools and handlers.
 *
 * Provides the structure for MCP tools and their execution handler
 * returned by the getMcpTools function.
 */
export interface AgentKitMcpTools {
  /** Array of MCP tools available for the agent */
  tools: Tool[]
  /** Handler function for executing tool calls */
  toolHandler: (name: string, args: unknown) => Promise<CallToolResult>
}

/**
 * Error thrown when a requested tool is not found
 */
export class ToolNotFoundError extends Error {
  constructor(toolName: string) {
    super(`Tool '${toolName}' not found`)
    this.name = "ToolNotFoundError"
  }
}

/**
 * Converts Polkadot Agent Kit actions to MCP tools
 *
 * @param actions - Array of actions from the PolkadotAgentKit
 * @returns Array of MCP Tool objects
 */
function convertActionsToMcpTools(actions: Action[]): Tool[] {
  return actions.map(action => {
    const schema = zodToJsonSchema(action.schema)

    return {
      name: action.name,
      description: action.description,
      inputSchema: schema
    } as Tool
  })
}

/**
 * Creates a tool handler for executing MCP tool calls
 *
 * @param actions - Array of actions from the PolkadotAgentKit
 * @returns Tool handler function
 */
function createToolHandler(actions: Action[]) {
  return async (name: string, args: unknown): Promise<CallToolResult> => {
    const action = actions.find(action => action.name === name)

    if (!action) {
      throw new ToolNotFoundError(name)
    }

    try {
      // Validate and parse arguments using the action's schema
      const parsedArgs = action.schema.parse(args)

      // Execute the action
      const result = await action.invoke(parsedArgs)

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      }
    } catch (error) {
      // Handle validation and execution errors
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: errorMessage
              },
              null,
              2
            )
          }
        ],
        isError: true
      }
    }
  }
}

/**
 * Get Model Context Protocol (MCP) tools from a Polkadot Agent Kit instance
 *
 * This function extracts all available actions from the PolkadotAgentKit and converts
 * them into MCP-compatible tools with proper schema validation and error handling.
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns Promise resolving to MCP tools and handler
 *
 */
export async function getMcpTools(polkadotAgentKit: PolkadotAgentKit): Promise<AgentKitMcpTools> {
  const actions: Action[] = polkadotAgentKit.getActions()

  return {
    tools: convertActionsToMcpTools(actions),
    toolHandler: createToolHandler(actions)
  }
}
