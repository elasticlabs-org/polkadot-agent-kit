

/**
 * Main exports for the Polkadot Agent Kit Langchain package
 */

import { z } from "zod";
import { StructuredTool, tool } from "@langchain/core/tools";
import { PolkadotAgentKit } from "./api";
import { Action } from "@polkadot-agent-kit/llm";

/**
 * Get Langchain tools from an PolkadotAgentKit instance
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns An array of Langchain tools
 */
export async function getLangChainTools(polkadotAgentKit: PolkadotAgentKit): Promise<StructuredTool[]> {
  const actions: Action[] = polkadotAgentKit.getActions();
  return actions.map(action =>
    tool(
      async (arg: z.output<typeof action.schema>) => {
        const result = await action.invoke(arg);
        return result;
      },
      {
        name: action.name,
        description: action.description,
        schema: action.schema,
      },
    ),
  );
}


