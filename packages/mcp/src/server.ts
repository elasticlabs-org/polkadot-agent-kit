import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "mcps-logger/console";
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";

import { BalanceToolHandler, TransferToolHandler, NominationPoolsToolHandler, XcmTransferToolHandler, SwapToolHandler } from "./tools";
import type { PolkadotMCPServerConfig } from "./types/index";

export class PolkadotMCPServer {
  private server: McpServer;
  private polkadotAgent: PolkadotAgentKit;
  private balanceToolHandler: BalanceToolHandler;
  private transferToolHandler: TransferToolHandler;
  private nominationPoolsToolHandler: NominationPoolsToolHandler;
  private xcmTransferToolHandler: XcmTransferToolHandler;
  private swapToolHandler: SwapToolHandler;
  private isInitialized: boolean = false;

  constructor(config: PolkadotMCPServerConfig, polkadotAgent: PolkadotAgentKit) {
    // Initialize Polkadot Agent Kit
    this.polkadotAgent = polkadotAgent;

    // Initialize tool handlers
    this.balanceToolHandler = new BalanceToolHandler(this.polkadotAgent);
    this.transferToolHandler = new TransferToolHandler(this.polkadotAgent);
    this.nominationPoolsToolHandler = new NominationPoolsToolHandler(this.polkadotAgent);
    this.xcmTransferToolHandler = new XcmTransferToolHandler(this.polkadotAgent);
    this.swapToolHandler = new SwapToolHandler(this.polkadotAgent);

    // Create MCP server
    this.server = new McpServer({
      name: config.name,
      version: config.version,
    });

    // Register tools
    this.registerTools();
  }

  private registerTools(): void {
    // Register check balance tool
    this.server.tool(
      'check_balance',
      'Check native token balance for the current account on a specified blockchain network',
      {
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to check balance on")
      },
      async ({ chain }) => {
        try {
          const request = {
            params: { chain }
          };
          
          return await this.balanceToolHandler.checkBalance(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error checking balance: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register transfer native tool
    this.server.tool(
      'transfer_native',
      'Transfer native tokens to another address on a specified blockchain network',
      {
        to: z.string()
          .describe("Recipient's address in SS58 format"),
        amount: z.string()
          .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
          .describe("Amount to transfer in the native token (e.g., '1.5' for 1.5 DOT)"),
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to perform the transfer on")
      },
      async ({ to, amount, chain }) => {
        try {
          const request = {
            params: { to, amount, chain }
          };
          
          return await this.transferToolHandler.transferNative(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error transferring tokens: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register join pool tool
    this.server.tool(
      'join_pool',
      'Join a nomination pool for staking tokens on a specified blockchain network',
      {
        amount: z.string()
          .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
          .describe("Amount of tokens to join the pool with (e.g., '10' for 10 DOT)"),
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to join the pool on")
      },
      async ({ amount, chain }) => {
        try {
          const request = {
            params: { amount, chain }
          };
          
          return await this.nominationPoolsToolHandler.joinPool(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error joining pool: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register bond extra tool
    this.server.tool(
      'bond_extra',
      'Bond extra tokens to an existing nomination pool',
      {
        type: z.enum(["FreeBalance", "Rewards"]).describe("Type of bonding: 'FreeBalance' to bond from wallet, 'Rewards' to restake earned rewards"),
        amount: z.string()
          .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
          .optional()
          .describe("Amount to bond (required for FreeBalance type)"),
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to bond on")
      },
      async ({ type, amount, chain }) => {
        try {
          const request = {
            params: { type, amount, chain }
          };
          
          return await this.nominationPoolsToolHandler.bondExtra(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error bonding extra: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register unbond tool
    this.server.tool(
      'unbond',
      'Unbond tokens from a nomination pool',
      {
        amount: z.string()
          .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
          .describe("Amount of tokens to unbond (e.g., '5' for 5 DOT)"),
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to unbond from")
      },
      async ({ amount, chain }) => {
        try {
          const request = {
            params: { amount, chain }
          };
          
          return await this.nominationPoolsToolHandler.unbond(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error unbonding: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register withdraw unbonded tool
    this.server.tool(
      'withdraw_unbonded',
      'Withdraw unbonded tokens from a nomination pool',
      {
        slashingSpans: z.string().describe("The number of slashing spans (usually '0')"),
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to withdraw from")
      },
      async ({ slashingSpans, chain }) => {
        try {
          const request = {
            params: { slashingSpans, chain }
          };
          
          return await this.nominationPoolsToolHandler.withdrawUnbonded(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error withdrawing unbonded: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register claim rewards tool
    this.server.tool(
      'claim_rewards',
      'Claim rewards from a nomination pool',
      {
        chain: z.enum(["polkadot", "kusama", "westend"]).describe("The blockchain network to claim rewards from")
      },
      async ({ chain }) => {
        try {
          const request = {
            params: { chain }
          };
          
          return await this.nominationPoolsToolHandler.claimRewards(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error claiming rewards: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register XCM transfer tool
    this.server.tool(
      'xcm_transfer',
      'Transfer native tokens across chains using XCM (Cross-Consensus Messaging)',
      {
        amount: z.string()
          .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
          .describe("Amount of tokens to transfer (e.g., '1' for 1 DOT)"),
        to: z.string()
          .describe("Recipient address in SS58 format"),
        sourceChain: z.enum(["polkadot", "kusama", "westend", "polkadot_asset_hub", "west_asset_hub", "hydra"])
          .describe("Source chain to transfer from"),
        destChain: z.enum(["polkadot", "kusama", "westend", "polkadot_asset_hub", "west_asset_hub", "hydra"])
          .describe("Destination chain to transfer to")
      },
      async ({ amount, to, sourceChain, destChain }) => {
        try {
          const request = {
            params: { amount, to, sourceChain, destChain }
          };
          
          return await this.xcmTransferToolHandler.xcmTransfer(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error with XCM transfer: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Register swap tokens tool
    this.server.tool(
      'swap_tokens',
      'Swap tokens across chains or within specific DEXs',
      {
        from: z.string().optional().describe("Source chain for cross-chain swap (e.g., 'Polkadot', 'Hydra')"),
        to: z.string().optional().describe("Destination chain for cross-chain swap (e.g., 'Polkadot', 'Hydra')"),
        currencyFrom: z.string().describe("Token symbol to swap from (e.g., 'DOT', 'KSM', 'HDX')"),
        currencyTo: z.string().describe("Token symbol to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')"),
        amount: z.string()
          .regex(/^\d+(\.\d+)?$/, "Amount must be a valid number")
          .describe("Amount of source token to swap"),
        receiver: z.string()
          .optional()
          .describe("Optional receiver address (defaults to sender)"),
        dex: z.string().optional().describe("DEX name for specific DEX swaps (e.g., 'HydrationDex')")
      },
      async ({ from, to, currencyFrom, currencyTo, amount, receiver, dex }) => {
        try {
          const request = {
            params: { from, to, currencyFrom, currencyTo, amount, receiver, dex }
          };
          
          return await this.swapToolHandler.swapTokens(request as any);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error swapping tokens: ${errorMessage}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log("MCP Server already initialized");
      return;
    }
    
    console.log("Initializing Polkadot Agent Kit...");
    try {
      await this.polkadotAgent.initializeApi();
      console.log("Polkadot Agent Kit initialized successfully");
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Polkadot Agent Kit:", error);
      throw error;
    }
  }

  async start(): Promise<void> {
    console.log("Starting MCP server initialization...");
    
    // First, initialize the Polkadot Agent Kit
    await this.initialize();
    
    // Then start the MCP server transport
    console.log("Setting up MCP server transport...");
    const transport = new StdioServerTransport();
    
    console.log("Connecting MCP server...");
    await this.server.connect(transport);
    
    console.log("✅ MCP server is running and ready to accept connections");
  }

  async stop(): Promise<void> {
    await this.server.close();
  }

  // Helper method to check if the agent is initialized
  public isAgentInitialized(): boolean {
    return this.isInitialized;
  }

  // Helper method to get agent status
  public getAgentStatus(): { initialized: boolean } {
    return {
      initialized: this.isInitialized
    };
  }
}