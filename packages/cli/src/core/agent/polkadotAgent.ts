import { ChatPromptTemplate } from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatOllama } from "@langchain/ollama";
import {
  ASSETS_PROMPT,
  IDENTITY_PROMPT,
  NOMINATION_PROMPT,
  SWAP_PROMPT,
} from "@polkadot-agent-kit/llm";
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { z } from "zod";

import type { AgentMetadata } from "../../types/agent";
import { logger } from "../../utils/logger";
// System prompt for the CLI agent
const SYSTEM_PROMPT =
  ASSETS_PROMPT + SWAP_PROMPT + NOMINATION_PROMPT + IDENTITY_PROMPT;

// Wrap PolkadotAgentKit tools as LangChain-compatible tools
function wrapBalanceTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "getNativeBalanceTool",
    description: "Get native token balance for an address on a specific chain",
    schema: z.object({
      chain: z.string().describe("The chain to check balance on"),
    }),
    func: async ({ chain }: { chain: string }) => {
      const tool = agentKit.getNativeBalanceTool();
      const result = await tool.call({ chain });
      return JSON.stringify(result);
    },
  });
}

function wrapTransferTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "transferNativeTool",
    description: "Transfer native tokens to an address on a specific chain",
    schema: z.object({
      to: z.string(),
      amount: z.string(),
      chain: z.string(),
    }),
    func: async ({
      to,
      amount,
      chain,
    }: {
      to: string;
      amount: string;
      chain: string;
    }) => {
      const tool = agentKit.transferNativeTool();
      const result = await tool.call({ to, amount, chain });
      return JSON.stringify(result);
    },
  });
}

function wrapXcmTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "xcmTransferNativeTool",
    description: "Transfer native tokens across chains using XCM",
    schema: z.object({
      to: z.string(),
      amount: z.string(),
      sourceChain: z.string(),
      destChain: z.string(),
    }),
    func: async ({
      to,
      amount,
      sourceChain,
      destChain,
    }: {
      to: string;
      amount: string;
      sourceChain: string;
      destChain: string;
    }) => {
      const tool = agentKit.xcmTransferNativeTool();
      const result = await tool.call({ to, amount, sourceChain, destChain });
      return JSON.stringify(result);
    },
  });
}

function wrapInitializeChainApiTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "initializeChainApiTool",
    description:
      "Initialize a chain API when it's not available. Use this when other tools fail due to chain not being initialized.",
    schema: z.object({
      chainId: z
        .string()
        .describe(
          "The chain ID to initialize (e.g., 'west', 'polkadot', 'hydra')",
        ),
    }),
    func: async ({ chain }: { chain: string }) => {
      const tool = agentKit.getInitializeChainApiTool();
      const result = await tool.call({ chain });
      return JSON.stringify(result);
    },
  });
}

function wrapSwapTokensTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "SwapTokensTool",
    description: "Swap tokens across different chains using the Hydration DEX",
    schema: z.object({
      from: z
        .string()
        .describe(
          "The source chain ID where the swap originates (e.g., 'Polkadot', 'AssetHubPolkadot', 'Hydra', 'Kusama')",
        ),
      to: z
        .string()
        .describe(
          "The destination chain ID where the swap completes (e.g., 'Polkadot', 'AssetHubPolkadot', 'Hydra', 'Kusama')",
        ),
      currencyFrom: z
        .string()
        .describe(
          "The symbol of the token to swap from (e.g., 'DOT', 'KSM', 'HDX')",
        ),
      currencyTo: z
        .string()
        .describe(
          "The symbol of the token to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')",
        ),
      amount: z.string().describe("The amount of the source token to swap"),
      receiver: z
        .string()
        .optional()
        .describe("The receiver address for the swap"),
    }),
    func: async ({
      from,
      to,
      currencyFrom,
      currencyTo,
      amount,
      receiver,
    }: {
      from: string;
      to: string;
      currencyFrom: string;
      currencyTo: string;
      amount: string;
      receiver: string | undefined;
    }) => {
      const tool = agentKit.swapTokensTool();
      const result = await tool.call({
        from,
        to,
        currencyFrom,
        currencyTo,
        amount,
        receiver,
      });
      return JSON.stringify(result);
    },
  });
}

function wrapJoinPoolTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "joinPoolTool",
    description: "Join a nomination pool for staking",
    schema: z.object({
      amount: z.string().describe("The amount of tokens to join the pool"),
      chain: z.string().describe("The chain to join the pool on"),
    }),
    func: async ({ amount, chain }: { amount: string; chain: string }) => {
      const tool = agentKit.joinPoolTool();
      const result = await tool.call({ amount, chain });
      return JSON.stringify(result);
    },
  });
}

// function wrapBondExtraTool(agentKit: PolkadotAgentKit) {
//   return new DynamicStructuredTool({
//     name: "bondExtraTool",
//     description: "Bond extra tokens to a nomination pool. Use 'FreeBalance' to bond a specific amount from your wallet, or 'Rewards' to re-stake your earned rewards.",
//     schema: z.discriminatedUnion("type", [
//       z.object({
//         type: z.literal("FreeBalance"),
//         amount: z.string().describe("The amount of tokens to bond from your free balance."),
//         chain: z.string().describe("The chain to bond extra tokens on."),
//       }),
//       z.object({
//         type: z.literal("Rewards"),
//         chain: z.string().describe("The chain to bond rewards on."),
//       }),
//     ]),
//     func: async (input) => {
//       const tool = agentKit.bondExtraTool();
//       const result = await tool.call(input);
//       return JSON.stringify(result);
//     }
//   });
// }

function wrapUnbondTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "unbondTool",
    description: "Unbond tokens from a nomination pool",
    schema: z.object({
      amount: z.string().describe("The amount of tokens to unbond"),
      chain: z.string().describe("The chain to unbond tokens on"),
    }),
    func: async ({ amount, chain }: { amount: string; chain: string }) => {
      const tool = agentKit.unbondTool();
      const result = await tool.call({ amount, chain });
      return JSON.stringify(result);
    },
  });
}

function wrapWithdrawUnbondedTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "withdrawUnbondedTool",
    description: "Withdraw unbonded tokens from a nomination pool",
    schema: z.object({
      slashingSpans: z.string().describe("The number of slashing spans"),
      chain: z.string().describe("The chain to withdraw unbonded tokens on"),
    }),
    func: async ({
      slashingSpans,
      chain,
    }: {
      slashingSpans: string;
      chain: string;
    }) => {
      const tool = agentKit.withdrawUnbondedTool();
      const result = await tool.call({ slashingSpans, chain });
      return JSON.stringify(result);
    },
  });
}

function wrapClaimRewardsTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "claimRewardsTool",
    description: "Claim rewards from a nomination pool",
    schema: z.object({
      chain: z.string().describe("The chain to claim rewards on"),
    }),
    func: async ({ chain }: { chain: string }) => {
      const tool = agentKit.claimRewardsTool();
      const result = await tool.call({ chain });
      return JSON.stringify(result);
    },
  });
}

export class PolkadotCLIAgent {
  private agentKit: PolkadotAgentKit | null = null;
  private agentExecutor: AgentExecutor | undefined;
  private initialized = false;

  constructor(private agent: AgentMetadata) {}

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const privateKey = this.agent.polkadotConfig.privateKey;
      const model = this.agent.model;

      if (!privateKey) {
        logger.error("Private key is not set in the agent configuration");
      }
      this.agentKit = new PolkadotAgentKit({
        privateKey: privateKey,
        keyType: "Sr25519",
        chains: ["polkadot", "west", "polkadot_asset_hub", "west_asset_hub"],
      });
      await this.agentKit.initializeApi();

      // Initialize the Ollama LLM
      const llm = new ChatOllama({
        model: model,
        temperature: 0,
      });
      logger.info("llm:", llm);

      // Prepare tools as LangChain-compatible DynamicStructuredTool instances
      const tools = [];

      if (this.agent.tools.includes("balance")) {
        tools.push(wrapBalanceTool(this.agentKit));
      }

      if (this.agent.tools.includes("transfer")) {
        tools.push(wrapTransferTool(this.agentKit));
        tools.push(wrapXcmTool(this.agentKit));
      }

      if (this.agent.tools.includes("staking")) {
        tools.push(wrapJoinPoolTool(this.agentKit));
        // tools.push(wrapBondExtraTool(this.agentKit));
        tools.push(wrapUnbondTool(this.agentKit));
        tools.push(wrapWithdrawUnbondedTool(this.agentKit));
        tools.push(wrapClaimRewardsTool(this.agentKit));
      }

      if (this.agent.tools.includes("swap")) {
        tools.push(wrapSwapTokensTool(this.agentKit));
      }

      // Always include chain initialization tool
      tools.push(wrapInitializeChainApiTool(this.agentKit));

      // Create the agent with system prompt
      const agentPrompt = createToolCallingAgent({
        llm: llm as any,
        tools: tools as any,
        prompt: ChatPromptTemplate.fromMessages([
          ["system", SYSTEM_PROMPT],
          ["placeholder", "{chat_history}"],
          ["human", "{input}"],
          ["placeholder", "{agent_scratchpad}"],
        ]) as any,
      });

      this.agentExecutor = new AgentExecutor({
        agent: agentPrompt,
        tools: tools as any,
        verbose: true,
      });

      this.initialized = true;
    } catch (error) {
      logger.error(
        `Failed to initialize agent: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async ask(query: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.agentExecutor) {
      return "Agent not properly initialized. Please check your configuration and ensure Ollama is running.";
    }

    try {
      const result = await this.agentExecutor.invoke({ input: query });
      return (
        result.output || "I couldn't process your request. Please try again."
      );
    } catch (error) {
      logger.error(
        `Agent query failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Check if it's an Ollama connection error
      if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
        return "I couldn't connect to Ollama. Please make sure Ollama is running and the model is available. You can start Ollama with: `ollama serve` and pull the model with: `ollama pull qwen2.5:latest`";
      }

      return `I encountered an error processing your request: ${error instanceof Error ? error.message : String(error)}. Please try again or rephrase your question.`;
    }
  }

  async disconnect(): Promise<void> {
    if (this.agentKit) {
      await this.agentKit.disconnect();
    }
    this.initialized = false;
  }
}
