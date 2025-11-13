/**
 * Main exports for the Polkadot Agent Kit Langchain package
 */

import type { StructuredTool } from "@langchain/core/tools"
import { tool } from "@langchain/core/tools"
import type { Action } from "@polkadot-agent-kit/llm"
import type { z } from "zod"

import type { PolkadotAgentKit } from "./api"

/**
 * Get Langchain tools from an PolkadotAgentKit instance
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns An array of Langchain tools
 */
export function getLangChainTools(polkadotAgentKit: PolkadotAgentKit): StructuredTool[] {
  const actions: Action[] = polkadotAgentKit.getActions()
  return actions.map(action =>
    tool(
      async (arg: z.output<typeof action.schema>) => {
        const result = await action.invoke(arg)
        return result
      },
      {
        name: action.name,
        description: action.description,
        schema: action.schema
      }
    )
  )
}

export function createCustomTool<T extends z.ZodSchema>(
  name: string,
  description: string,
  schema: T,
  invoke: (args: z.infer<T>) => Promise<string>
): Action {
  return {
    name,
    description,
    schema,
    invoke
  }
}
