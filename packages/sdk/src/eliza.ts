import type { Action } from "@polkadot-agent-kit/llm"
import type { z } from "zod"

import type { PolkadotAgentKit } from "./api"

/**
 * Eliza Action interface
 * Based on the ai16z/eliza framework action structure
 */
export interface ElizaAction {
  name: string
  description: string
  similes?: string[]
  examples?: Array<Array<{ user: string; content: { text: string } }>>
  handler: (
    runtime: unknown,
    message: unknown,
    state?: unknown,
    options?: unknown,
    callback?: unknown
  ) => Promise<boolean>
  validate: (runtime: unknown, message: unknown) => Promise<boolean>
}

/**
 * Convert Polkadot Agent Kit actions to Eliza-compatible actions
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns An array of Eliza-compatible actions
 *
 * @example
 * ```typescript
 * const agentKit = new PolkadotAgentKit({ ... });
 * const elizaActions = getElizaActions(agentKit);
 *
 * // Use with Eliza runtime
 * elizaActions.forEach(action => {
 *   runtime.registerAction(action);
 * });
 * ```
 */
export function getElizaActions(polkadotAgentKit: PolkadotAgentKit): ElizaAction[] {
  const actions: Action[] = polkadotAgentKit.getActions()

  return actions.map(action => {
    const elizaAction: ElizaAction = {
      name: action.name,
      description: action.description,
      similes: generateSimiles(action.name),
      examples: generateExamples(action.name, action.description),

      // Handler function that executes the action
      handler: async (
        runtime: unknown,
        message: unknown,
        state?: unknown,
        options?: unknown,
        callback?: unknown
      ): Promise<boolean> => {
        try {
          // Extract parameters from message
          // In Eliza, the message typically contains the user input
          const params = extractParametersFromMessage(message, action.schema)

          // Execute the action
          const result = await action.invoke(params)

          // If callback is provided, send the result back
          if (callback && typeof callback === "function") {
            await callback({
              text: result,
              action: action.name
            })
          }

          return true
        } catch (error) {
          console.error(`Error executing action ${action.name}:`, error)

          if (callback && typeof callback === "function") {
            await callback({
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
              action: action.name,
              error: true
            })
          }

          return false
        }
      },

      // Validation function
      validate: async (runtime: unknown, message: unknown): Promise<boolean> => {
        try {
          // Basic validation - check if we can extract parameters
          const params = extractParametersFromMessage(message, action.schema)
          action.schema.parse(params)
          return true
        } catch {
          return false
        }
      }
    }

    return elizaAction
  })
}

/**
 * Generate similes (alternative names) for an action
 */
function generateSimiles(actionName: string): string[] {
  const similesMap: Record<string, string[]> = {
    check_balance: ["get balance", "show balance", "balance check", "my balance"],
    transfer_native: ["send tokens", "transfer tokens", "send", "transfer"],
    xcm_transfer_native_asset: [
      "cross chain transfer",
      "xcm transfer",
      "transfer cross chain",
      "send cross chain"
    ],
    swap_tokens: ["swap", "exchange tokens", "trade tokens"],
    join_pool: ["stake", "join staking pool", "start staking"],
    bond_extra: ["stake more", "add stake", "increase stake"],
    unbond: ["unstake", "withdraw stake", "unbond tokens"],
    withdraw_unbonded: ["withdraw", "claim unbonded", "get unbonded"],
    claim_rewards: ["claim rewards", "get rewards", "harvest rewards"],
    register_identity: ["set identity", "register id", "create identity"],
    mint_vdot: ["mint vdot", "create vdot", "get vdot"],
    initialize_chain_api: ["initialize chain", "setup chain", "connect to chain"]
  }

  return similesMap[actionName] || []
}

/**
 * Generate example conversations for an action
 */
function generateExamples(
  actionName: string,
  description: string
): Array<Array<{ user: string; content: { text: string } }>> {
  const examplesMap: Record<string, Array<Array<{ user: string; content: { text: string } }>>> = {
    check_balance: [
      [
        { user: "{{user1}}", content: { text: "What's my balance on Polkadot?" } },
        { user: "{{agent}}", content: { text: "Let me check your balance on Polkadot." } }
      ],
      [
        { user: "{{user1}}", content: { text: "Check my balance on Kusama" } },
        { user: "{{agent}}", content: { text: "I'll check your Kusama balance for you." } }
      ]
    ],
    transfer_native: [
      [
        { user: "{{user1}}", content: { text: "Send 1 DOT to 5GrwvaEF..." } },
        { user: "{{agent}}", content: { text: "I'll transfer 1 DOT to that address." } }
      ]
    ],
    xcm_transfer_native_asset: [
      [
        {
          user: "{{user1}}",
          content: { text: "Transfer 5 DOT from Polkadot to Asset Hub" }
        },
        {
          user: "{{agent}}",
          content: { text: "I'll initiate a cross-chain transfer for you." }
        }
      ]
    ]
  }

  return (
    examplesMap[actionName] || [
      [
        { user: "{{user1}}", content: { text: `Help me with ${actionName}` } },
        { user: "{{agent}}", content: { text: description } }
      ]
    ]
  )
}

/**
 * Extract parameters from Eliza message for action execution
 */
function extractParametersFromMessage(
  message: unknown,
  schema: z.ZodType
): Record<string, unknown> {
  // This is a simplified extraction - in a real implementation,
  // you would parse the message content and extract relevant parameters
  // based on the schema requirements

  if (!message || typeof message !== "object") {
    return {}
  }

  const msg = message as Record<string, unknown>

  // Try to extract content
  if (msg.content && typeof msg.content === "object") {
    const content = msg.content as Record<string, unknown>

    // If content has a text field, try to parse it
    if (content.text && typeof content.text === "string") {
      // For now, return the message as-is
      // In production, you'd implement proper NLU to extract parameters
      return { ...content }
    }

    // If content has structured data, use it
    return content
  }

  // If message has params field, use it directly
  if (msg.params && typeof msg.params === "object") {
    return msg.params as Record<string, unknown>
  }

  return {}
}

/**
 * Create an Eliza plugin from a PolkadotAgentKit instance
 *
 * @param polkadotAgentKit - The PolkadotAgentKit instance
 * @returns An Eliza plugin object
 *
 * @example
 * ```typescript
 * const agentKit = new PolkadotAgentKit({ ... });
 * const plugin = createElizaPlugin(agentKit);
 *
 * // Use with Eliza runtime
 * runtime.registerPlugin(plugin);
 * ```
 */
export function createElizaPlugin(polkadotAgentKit: PolkadotAgentKit) {
  return {
    name: "polkadot-agent-kit",
    description: "Polkadot blockchain operations for Eliza agents",
    actions: getElizaActions(polkadotAgentKit),
    evaluators: [],
    providers: []
  }
}
