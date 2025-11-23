import type { Action } from "@polkadot-agent-kit/llm"
import type { PolkadotAgentKit } from "@polkadot-agent-kit/sdk"
import type { z } from "zod"

import type {
  ElizaAction,
  ElizaMessage,
  ElizaResponse,
  ElizaRuntime,
  ElizaState,
  MessageExample
} from "./types"

/**
 * Adapter class to convert Polkadot Agent Kit actions to Eliza actions
 */
export class PolkadotElizaAdapter {
  private agentKit: PolkadotAgentKit
  private actions: Action[]

  constructor(agentKit: PolkadotAgentKit) {
    this.agentKit = agentKit
    this.actions = agentKit.getActions()
  }

  /**
   * Convert all actions to Eliza format
   */
  public getElizaActions(): ElizaAction[] {
    return this.actions.map(action => this.convertToElizaAction(action))
  }

  /**
   * Convert a single action to Eliza format
   */
  private convertToElizaAction(action: Action): ElizaAction {
    return {
      name: action.name,
      description: action.description,
      similes: this.generateSimiles(action.name),
      examples: this.generateExamples(action.name, action.description),
      handler: this.createHandler(action),
      validate: this.createValidator(action)
    }
  }

  /**
   * Create action handler
   */
  private createHandler(
    action: Action
  ): (
    runtime: ElizaRuntime,
    message: ElizaMessage,
    state?: ElizaState,
    options?: Record<string, unknown>,
    callback?: (response: ElizaResponse) => Promise<void>
  ) => Promise<boolean> {
    return async (runtime, message, state, options, callback) => {
      try {
        // Extract parameters from the message
        const params = this.extractParameters(message, action.schema)

        // Execute the action
        const result = await action.invoke(params)

        // Send response via callback
        if (callback) {
          await callback({
            text: result,
            action: action.name
          })
        }

        return true
      } catch (error) {
        console.error(`[Polkadot Agent Kit] Error executing ${action.name}:`, error)

        if (callback) {
          await callback({
            text: `Failed to execute ${action.name}: ${error instanceof Error ? error.message : String(error)}`,
            action: action.name,
            error: true
          })
        }

        return false
      }
    }
  }

  /**
   * Create action validator
   */
  private createValidator(
    action: Action
  ): (runtime: ElizaRuntime, message: ElizaMessage, state?: ElizaState) => Promise<boolean> {
    return async (runtime, message, state) => {
      try {
        // Try to extract and validate parameters
        const params = this.extractParameters(message, action.schema)
        action.schema.parse(params)
        return true
      } catch (error) {
        console.debug(`[Polkadot Agent Kit] Validation failed for ${action.name}:`, error)
        return false
      }
    }
  }

  /**
   * Extract parameters from Eliza message
   */
  private extractParameters(message: ElizaMessage, schema: z.ZodType): Record<string, unknown> {
    const params: Record<string, unknown> = {}

    // Check if message content has structured data
    if (message.content && typeof message.content === "object") {
      // Remove 'text' field and use remaining fields as params
      const { text, action, source, ...rest } = message.content
      Object.assign(params, rest)
    }

    // If no params found, try to parse from text
    if (Object.keys(params).length === 0 && message.content.text) {
      // This is a simplified parser - in production, use proper NLU
      const text = message.content.text.toLowerCase()

      // Try to extract chain parameter
      if (text.includes("polkadot") || text.includes("dot")) {
        params.chain = "polkadot"
      } else if (text.includes("kusama") || text.includes("ksm")) {
        params.chain = "kusama"
      } else if (text.includes("westend") || text.includes("wnd")) {
        params.chain = "west"
      } else if (text.includes("paseo") || text.includes("pas")) {
        params.chain = "paseo"
      }

      // Try to extract amount
      const amountMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:dot|ksm|wnd|pas)?/i)
      if (amountMatch) {
        params.amount = amountMatch[1]
      }

      // Try to extract address
      const addressMatch = text.match(/\b(5[A-Za-z0-9]{47})\b/)
      if (addressMatch) {
        params.to = addressMatch[1]
      }
    }

    return params
  }

  /**
   * Generate similes (alternative names) for actions
   */
  private generateSimiles(actionName: string): string[] {
    const similesMap: Record<string, string[]> = {
      check_balance: ["get balance", "show balance", "balance check", "my balance", "wallet balance"],
      transfer_native: [
        "send tokens",
        "transfer tokens",
        "send",
        "transfer",
        "pay",
        "send money"
      ],
      xcm_transfer_native_asset: [
        "cross chain transfer",
        "xcm transfer",
        "transfer cross chain",
        "send cross chain",
        "bridge transfer"
      ],
      swap_tokens: ["swap", "exchange tokens", "trade tokens", "exchange", "trade"],
      join_pool: ["stake", "join staking pool", "start staking", "nominate"],
      bond_extra: ["stake more", "add stake", "increase stake", "bond more"],
      unbond: ["unstake", "withdraw stake", "unbond tokens", "stop staking"],
      withdraw_unbonded: ["withdraw", "claim unbonded", "get unbonded", "collect unbonded"],
      claim_rewards: ["claim rewards", "get rewards", "harvest rewards", "collect rewards"],
      register_identity: ["set identity", "register id", "create identity", "set name"],
      mint_vdot: ["mint vdot", "create vdot", "get vdot", "liquid stake"],
      initialize_chain_api: ["initialize chain", "setup chain", "connect to chain", "add chain"]
    }

    return similesMap[actionName] || []
  }

  /**
   * Generate example conversations
   */
  private generateExamples(actionName: string, description: string): MessageExample[][] {
    const examplesMap: Record<string, MessageExample[][]> = {
      check_balance: [
        [
          { user: "{{user1}}", content: { text: "What's my balance on Polkadot?" } },
          { user: "{{agent}}", content: { text: "Let me check your Polkadot balance." } }
        ],
        [
          { user: "{{user1}}", content: { text: "Check my balance on Kusama" } },
          { user: "{{agent}}", content: { text: "I'll check your Kusama balance right away." } }
        ],
        [
          { user: "{{user1}}", content: { text: "Show my DOT balance" } },
          { user: "{{agent}}", content: { text: "Checking your DOT balance now." } }
        ]
      ],
      transfer_native: [
        [
          { user: "{{user1}}", content: { text: "Send 1 DOT to 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY" } },
          { user: "{{agent}}", content: { text: "I'll transfer 1 DOT to that address for you." } }
        ],
        [
          { user: "{{user1}}", content: { text: "Transfer 5 KSM to Alice" } },
          { user: "{{agent}}", content: { text: "Initiating transfer of 5 KSM." } }
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
            content: { text: "I'll initiate a cross-chain transfer to Asset Hub." }
          }
        ]
      ],
      swap_tokens: [
        [
          { user: "{{user1}}", content: { text: "Swap 10 DOT for USDT" } },
          { user: "{{agent}}", content: { text: "I'll swap 10 DOT for USDT on Hydration DEX." } }
        ]
      ],
      join_pool: [
        [
          { user: "{{user1}}", content: { text: "Stake 100 DOT in a nomination pool" } },
          { user: "{{agent}}", content: { text: "I'll help you join a nomination pool with 100 DOT." } }
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
}

