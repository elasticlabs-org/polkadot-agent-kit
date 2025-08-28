import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOllama } from "@langchain/ollama";
import {
  ASSETS_PROMPT,
  BIFROST_PROMPT,
  DYNAMIC_CHAIN_INITIALIZATION_PROMPT,
  IDENTITY_PROMPT,
  NOMINATION_PROMPT,
  SWAP_PROMPT,
} from "@polkadot-agent-kit/llm";
import { getLangChainTools, PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";

import type { AgentMetadata } from "../../types/agent";
import { logger } from "../../utils/logger";

export const SYSTEM_PROMPT =
  ASSETS_PROMPT +
  SWAP_PROMPT +
  NOMINATION_PROMPT +
  IDENTITY_PROMPT +
  BIFROST_PROMPT +
  DYNAMIC_CHAIN_INITIALIZATION_PROMPT;

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

      const tools = getLangChainTools(this.agentKit);

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
