import type { PolkadotApi } from "@polkadot-agent-kit/core"
import type { PolkadotSigner } from "polkadot-api"
import {z} from "zod"

import {
  bondExtraTool,
  checkBalanceTool,
  claimRewardsTool,
  initializeChainApiTool,
  joinPoolTool,
  registerIdentityTool,
  swapTokensTool,
  transferNativeTool,
  unbondTool,
  withdrawUnbondedTool,
  xcmTransferNativeTool
} from "../langchain"
import type {
  Action,
  BalanceTool,
  BondExtraTool,
  ClaimRewardsTool,
  InitializeChainApiTool,
  JoinPoolTool,
  RegisterIdentityTool,
  SwapTokensTool,
  TransferTool,
  UnbondTool,
  WithdrawUnbondedTool,
  XcmTransferNativeAssetTool
} from "../types"
/**
 * Interface for Polkadot API implementations
 * Defines the interface that all Polkadot chain types must follow
 */
export interface IPolkadotAgentApi {
  /**
   * Returns a tool that checks the balance of a specific address
   * @param address - The address to check the balance for
   * @returns A dynamic structured tool that checks the balance of the specified address
   */
  getNativeBalanceTool(address: string): BalanceTool

  /**
   * Returns a tool that transfers native tokens to a specific address
   * @returns A dynamic structured tool that transfers native tokens to the specified address
   */
  transferNativeTool(signer: PolkadotSigner): TransferTool

  // /**
  //  * Returns a tool that transfers native tokens to a specific address via xcm
  //  * @returns A dynamic structured tool that transfers native tokens to the specified address via xcm
  //  */
  xcmTransferNativeTool(signer: PolkadotSigner, sender: string): XcmTransferNativeAssetTool

  /**
   * Returns a tool that initializes a new chain API dynamically
   * @returns A dynamic structured tool that initializes chain APIs
   */
  getInitializeChainApiTool(): InitializeChainApiTool

  /**
   * Returns a tool that swaps tokens across different chains using the Hydration DEX
   * @returns A dynamic structured tool that swaps tokens across different chains using the Hydration DEX
   */
  swapTokensTool(signer: PolkadotSigner, sender: string): SwapTokensTool

  /**
   * Returns a tool that joins a nomination pool
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that joins nomination pools
   */
  joinPoolTool(signer: PolkadotSigner): JoinPoolTool

  /**
   * Returns a tool that bonds extra tokens to a nomination pool
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that bonds extra tokens
   */
  bondExtraTool(signer: PolkadotSigner): BondExtraTool

  /**
   * Returns a tool that unbonds tokens from a nomination pool
   * @param signer - The signer to use for transactions
   * @param address - The address to unbond from
   * @returns A dynamic structured tool that unbonds tokens
   */
  unbondTool(signer: PolkadotSigner, address: string): UnbondTool

  /**
   * Returns a tool that withdraws unbonded tokens from a nomination pool
   * @param signer - The signer to use for transactions
   * @param address - The address to withdraw for
   * @returns A dynamic structured tool that withdraws unbonded tokens
   */
  withdrawUnbondedTool(signer: PolkadotSigner, address: string): WithdrawUnbondedTool

  /**
   * Returns a tool that claims rewards from a nomination pool
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that claims rewards
   */
  claimRewardsTool(signer: PolkadotSigner): ClaimRewardsTool

  /**
   * Returns a tool that registers an identity on People Chain
   * @param signer - The signer to use for transactions
   * @returns A dynamic structured tool that registers an identity on People Chain
   */
  registerIdentityTool(signer: PolkadotSigner): RegisterIdentityTool


  getActions(signer: PolkadotSigner, address: string): Action[]
}

/**
 * Implementation of the IPolkadotAgentApi interface
 * Provides access to Polkadot API methods
 */
export class PolkadotAgentApi implements IPolkadotAgentApi {
  /**
   * The Polkadot API instance
   */
  private api: PolkadotApi

  constructor(api: PolkadotApi) {
    this.api = api
  }

  getNativeBalanceTool(address: string): BalanceTool {
    return checkBalanceTool(this.api, address) as unknown as BalanceTool
  }

  transferNativeTool(signer: PolkadotSigner): TransferTool {
    return transferNativeTool(this.api, signer) as unknown as TransferTool
  }

  xcmTransferNativeTool(signer: PolkadotSigner, sender: string): XcmTransferNativeAssetTool {
    return xcmTransferNativeTool(signer, sender) as unknown as XcmTransferNativeAssetTool
  }

  getInitializeChainApiTool(): InitializeChainApiTool {
    return initializeChainApiTool(this.api) as unknown as InitializeChainApiTool
  }

  swapTokensTool(signer: PolkadotSigner, sender: string): SwapTokensTool {
    return swapTokensTool(signer, sender) as unknown as SwapTokensTool
  }

  joinPoolTool(signer: PolkadotSigner): JoinPoolTool {
    return joinPoolTool(this.api, signer) as unknown as JoinPoolTool
  }

  bondExtraTool(signer: PolkadotSigner): BondExtraTool {
    return bondExtraTool(this.api, signer) as unknown as BondExtraTool
  }

  unbondTool(signer: PolkadotSigner, address: string): UnbondTool {
    return unbondTool(this.api, signer, address) as unknown as UnbondTool
  }

  withdrawUnbondedTool(signer: PolkadotSigner, address: string): WithdrawUnbondedTool {
    return withdrawUnbondedTool(this.api, signer, address) as unknown as WithdrawUnbondedTool
  }

  claimRewardsTool(signer: PolkadotSigner): ClaimRewardsTool {
    return claimRewardsTool(this.api, signer) as unknown as ClaimRewardsTool
  }

  registerIdentityTool(signer: PolkadotSigner): RegisterIdentityTool {
    return registerIdentityTool(this.api, signer) as unknown as RegisterIdentityTool
  }


    /**
   * Get all available actions as Action array
   * Returns all tools available in the PolkadotAgentKit as Action objects
   *
   * @returns Array of Action objects containing name, description, schema, and invoke function
   *
   * @example
   * ```typescript
   * // Get all available actions
   * const actions = agent.getActions();
   * 
   * // Use a specific action
   * const balanceAction = actions.find(action => action.name === "check_balance");
   * const result = await balanceAction.invoke({ chain: "polkadot" });
   * ```
   */
    getActions(signer: PolkadotSigner, address: string): Action[] {
      const actions: Action[] = []
  
      // Balance Tool
      const balanceTool = this.getNativeBalanceTool(address)
      actions.push({
        name: "check_balance",
        description: "Check balance of the wallet address on a specific chain",
        schema: z.object({
          chain: z.string().describe("The chain name to check balance on (e.g., 'polkadot', 'kusama', 'west', 'westend_asset_hub')")
        }),
        invoke: async (args: { chain: string }) => {
          const result = await balanceTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
      
      // Transfer Tool
      const transferTool = this.transferNativeTool(signer)
      actions.push({
        name: "transfer_native",
        description: "Transfer native tokens to a specific address",
        schema: z.object({
          amount: z.string().describe("The amount of tokens to transfer"),
          to: z.string().describe("The address to transfer the tokens to"),
          chain: z.string().describe("The chain to transfer the tokens to")
        }),
        invoke: async (args: { amount: string; to: string; chain: string }) => {
          const result = await transferTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // XCM Transfer Tool
      const xcmTransferTool = this.xcmTransferNativeTool(signer, address)
      actions.push({
        name: "xcm_transfer_native_asset",
        description: "Transfer native tokens to a specific address to a destination chain via xcm",
        schema: z.object({
          amount: z.string().describe("The amount of tokens to transfer"),
          to: z.string().describe("The address to transfer the tokens to"),
          sourceChain: z.string().describe("The source chain to transfer the tokens from"),
          destChain: z.string().describe("The destination chain to transfer the tokens to")
        }),
        invoke: async (args: { amount: string; to: string; sourceChain: string; destChain: string }) => {
          const result = await xcmTransferTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Swap Tokens Tool
      const swapTool = this.swapTokensTool(signer, address)
      actions.push({
        name: "swap_tokens",
        description: "Swap tokens across different chains using the Hydration DEX",
        schema: z.object({
          from: z.string().optional().describe("The source chain ID where the swap originates (e.g., 'polkadot', 'kusama', 'hydra'). Required for cross-chain swaps."),
          to: z.string().optional().describe("The destination chain ID where the swap completes (e.g., 'polkadot', 'kusama', 'hydra'). Required for cross-chain swaps."),
          currencyFrom: z.string().describe("The symbol of the token to swap from (e.g., 'DOT', 'KSM', 'HDX')"),
          currencyTo: z.string().describe("The symbol of the token to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')"),
          amount: z.string().describe("The amount of the source token to swap"),
          receiver: z.string().optional().describe("Optional receiver address (defaults to sender if not provided)"),
          dex: z.string().optional().describe("The name of the DEX to use for the swap (e.g., 'HydrationDex'). Required for DEX-specific swaps.")
        }),
        invoke: async (args: { from?: string; to?: string; currencyFrom: string; currencyTo: string; amount: string; receiver?: string; dex?: string }) => {
          const result = await swapTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Join Pool Tool
      const joinPoolTool = this.joinPoolTool(signer)
      actions.push({
        name: "join_pool",
        description: "Join a nomination pool for staking",
        schema: z.object({
          amount: z.string().describe("The amount of tokens to bond in the pool"),
          chain: z.string().describe("The chain to join the pool on")
        }),
        invoke: async (args: { amount: string; chain: string }) => {
          const result = await joinPoolTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Bond Extra Tool
      const bondExtraTool = this.bondExtraTool(signer)
      actions.push({
        name: "bond_extra",
        description: "Bond extra tokens to a nomination pool",
        schema: z.object({
          type: z.enum(["FreeBalance", "Rewards"]).describe("Type of bonding operation"),
          amount: z.string().optional().describe("Amount to bond (required for FreeBalance)"),
          chain: z.string().describe("Chain name")
        }),
        invoke: async (args: { type: "FreeBalance" | "Rewards"; amount?: string; chain: string }) => {
          const result = await bondExtraTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Unbond Tool
      const unbondTool = this.unbondTool(signer, address)
      actions.push({
        name: "unbond",
        description: "Unbond tokens from a nomination pool",
        schema: z.object({
          amount: z.string().describe("The amount of tokens to unbond"),
          chain: z.string().describe("The chain to unbond tokens on")
        }),
        invoke: async (args: { amount: string; chain: string }) => {
          const result = await unbondTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Withdraw Unbonded Tool
      const withdrawUnbondedTool = this.withdrawUnbondedTool(signer, address)
      actions.push({
        name: "withdraw_unbonded",
        description: "Withdraw unbonded tokens from a nomination pool",
        schema: z.object({
          slashingSpans: z.string().describe("The number of slashing spans"),
          chain: z.string().describe("The chain to withdraw unbonded tokens on")
        }),
        invoke: async (args: { slashingSpans: string; chain: string }) => {
          const result = await withdrawUnbondedTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Claim Rewards Tool
      const claimRewardsTool = this.claimRewardsTool(signer)
      actions.push({
        name: "claim_rewards",
        description: "Claim rewards from a nomination pool",
        schema: z.object({
          chain: z.string().describe("The chain to claim rewards on")
        }),
        invoke: async (args: { chain: string }) => {
          const result = await claimRewardsTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Register Identity Tool
      const registerIdentityTool = this.registerIdentityTool(signer)
      actions.push({
        name: "register_identity",
        description: "Register an identity on People Chain",
        schema: z.object({
          display: z.string().optional().describe("Display name for the identity"),
          legal: z.string().optional().describe("Legal name for the identity"),
          web: z.string().optional().describe("Website URL for the identity"),
          matrix: z.string().optional().describe("Matrix username for the identity"),
          email: z.string().optional().describe("Email address for the identity"),
          image: z.string().optional().describe("Image hash or URL for the identity"),
          twitter: z.string().optional().describe("Twitter handle for the identity"),
          github: z.string().optional().describe("GitHub username for the identity"),
          discord: z.string().optional().describe("Discord username for the identity")
        }),
        invoke: async (args: { display?: string; legal?: string; web?: string; matrix?: string; email?: string; image?: string; twitter?: string; github?: string; discord?: string }) => {
          const result = await registerIdentityTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      // Initialize Chain API Tool
      const initChainTool = this.getInitializeChainApiTool()
      actions.push({
        name: "initialize_chain_api",
        description: "Initialize a new blockchain API for the agent to interact with. Use this when other tools fail due to missing chain API.",
        schema: z.object({
          chainId: z.string().describe("The chain ID to initialize (e.g., 'polkadot', 'kusama', 'west', 'polkadot_asset_hub', 'west_asset_hub')")
        }),
        invoke: async (args: { chainId: string }) => {
          const result = await initChainTool.invoke(args)
          return typeof result === 'string' ? result : JSON.stringify(result)
        }
      })
  
      return actions
    }
}
