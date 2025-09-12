import type { Action } from "@polkadot-agent-kit/llm"
import type { z } from "zod"

import type { PolkadotAgentKit } from "./api"
import { tool, type ToolSet } from "ai";

/**
 * Get Vercel AI SDK tools from an PolkadotAgentKit instance
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns An object containing Vercel AI SDK tools keyed by tool name
 */
export function getVercelAITools(polkadotAgentKit: PolkadotAgentKit): ToolSet {
  const actions: Action[] = polkadotAgentKit.getActions();
  const toolSet: Record<string, any> = {};

  for (const action of actions) {
    toolSet[action.name] = tool({
      description: action.description,
      parameters: action.schema,
      execute: async (args: z.infer<typeof action.schema>) => {
        const result = await action.invoke(args);
        return result;
      },
    });
  }

  return toolSet;
}