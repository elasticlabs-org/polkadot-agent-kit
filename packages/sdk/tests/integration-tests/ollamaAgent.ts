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