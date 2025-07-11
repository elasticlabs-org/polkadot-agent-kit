import { ChatOllama } from "@langchain/ollama";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { SYSTEM_PROMPT, sleep } from "./utils";
import { PolkadotAgentKit } from "../../src/api";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatPromptTemplate } from '@langchain/core/prompts'

// Wrap PolkadotAgentKit tools as LangChain-compatible tools
function wrapBalanceTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "getNativeBalanceTool",
    description: "Get native token balance for an address on a specific chain",
    schema: z.object({
      chain: z.string().describe("The chain to check balance on")
    }),
    func: async ({ chain }) => {
      const tool = agentKit.getNativeBalanceTool();
      const result = await tool.call({ chain });
      return JSON.stringify(result);
    }
  });
}

function wrapTransferTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "transferNativeTool",
    description: "Transfer native tokens to an address on a specific chain",
    schema: z.object({
      to: z.string(),
      amount: z.string(),
      chain: z.string()
    }),
    func: async ({ to, amount, chain }) => {
      const tool = agentKit.transferNativeTool();
      const result = await tool.call({ to, amount, chain });
      return JSON.stringify(result);
    }
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
      destChain: z.string()
    }),
    func: async ({ to, amount, sourceChain, destChain }) => {
      const tool = agentKit.xcmTransferNativeTool();
      const result = await tool.call({ to, amount, sourceChain, destChain });
      return JSON.stringify(result);
    }
  });
}

function wrapInitializeChainApiTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "initializeChainApiTool",
    description: "Initialize a chain API when it's not available. Use this when other tools fail due to chain not being initialized.",
    schema: z.object({
      chainId: z.string().describe("The chain ID to initialize (e.g., 'west', 'polkadot', 'hydra')")
    }),
    func: async ({ chainId }) => {
      const tool = agentKit.getInitializeChainApiTool();
      const result = await tool.call({ chainId });
      return JSON.stringify(result);
    }
  });
}

function wrapSwapTokensTool(agentKit: PolkadotAgentKit) {
  return new DynamicStructuredTool({
    name: "swapTokensTool",
    description: "Swap tokens across different chains using the Hydration DEX",
    schema: z.object({
      from: z.string().describe("The source chain ID where the swap originates (e.g., 'Polkadot', 'AssetHubPolkadot', 'Hydra', 'Kusama')"),
      to: z.string().describe("The destination chain ID where the swap completes (e.g., 'Polkadot', 'AssetHubPolkadot', 'Hydra', 'Kusama')"),
      currencyFrom: z.string().describe("The symbol of the token to swap from (e.g., 'DOT', 'KSM', 'HDX')"),
      currencyTo: z.string().describe("The symbol of the token to swap to (e.g., 'DOT', 'KSM', 'HDX', 'USDT')"),
      amount: z.string().describe("The amount of the source token to swap"),
      receiver: z.string().optional().describe("The receiver address for the swap")
    }),
    func: async ({ from, to, currencyFrom, currencyTo, amount, receiver }) => {
      const tool = agentKit.swapTokensTool();
      const result = await tool.call({ from, to, currencyFrom, currencyTo, amount, receiver });
      return JSON.stringify(result);
    }
  });
}




export class OllamaAgent {
  private agentExecutor: AgentExecutor | undefined;

  constructor(
    private agentKit: PolkadotAgentKit,
    private model: string = "qwen3:latest"
  ) {}

  async init() {
    // Initialize the Ollama LLM
    const llm = new ChatOllama({
      model: this.model,
      temperature: 0,
    });

    // Prepare tools as LangChain-compatible DynamicStructuredTool instances
    const tools = [
      wrapBalanceTool(this.agentKit),
      wrapTransferTool(this.agentKit),
      wrapXcmTool(this.agentKit),
      wrapInitializeChainApiTool(this.agentKit),
      wrapSwapTokensTool(this.agentKit)
    ];

    // Use SYSTEM_PROMPT as the system message
    const agentPrompt = createToolCallingAgent({
      llm: llm as any,
      tools: tools as any,
      prompt: ChatPromptTemplate.fromMessages([
        ['system', SYSTEM_PROMPT],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}']
      ]) as any
    });

    this.agentExecutor = new AgentExecutor({
      agent: agentPrompt,
      tools: tools as any,
      verbose: true,
    });

    await sleep(2000);
  }

  async ask(query: string) {
    if (!this.agentExecutor) {
      throw new Error("OllamaAgent not initialized. Call init() first.");
    }
    return this.agentExecutor.invoke({ input: query });
  }
} 