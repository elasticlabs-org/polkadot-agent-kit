import { ChatOllama } from "@langchain/ollama";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ASSETS_SYSTEM_PROMPT, sleep } from "./utils";
import { PolkadotAgentKit } from "../../src/api";
import { getLangChainTools } from "../../src/langchain";
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export class OllamaAgent {
  private agentExecutor: AgentExecutor | undefined;
  private isGemini: boolean;

  constructor(
    private agentKit: PolkadotAgentKit,
    private model: string = "qwen3:latest",
    private systemPrompt: string = ASSETS_SYSTEM_PROMPT
  ) {
    // Check if GEMINI_API_KEY is available
    this.isGemini = !!process.env.GEMINI_API_KEY;
  }

  async init() {
    let llm:any;

    if (this.isGemini) {
      llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        temperature: 0,
        apiKey: process.env.GEMINI_API_KEY,
      });
    } else {
      llm = new ChatOllama({
        model: this.model,
        temperature: 0,
      });
    }

    const tools = getLangChainTools(this.agentKit);

    // Use the provided system prompt
    const agentPrompt = createToolCallingAgent({
      llm: llm as any,
      tools: tools as any,
      prompt: ChatPromptTemplate.fromMessages([
        ['system', this.systemPrompt],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}']
      ]) as any
    });

    this.agentExecutor = new AgentExecutor({
      agent: agentPrompt,
      tools: tools as any,
      verbose: true,
      returnIntermediateSteps: true,
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