import { ChatOllama } from "@langchain/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { PolkadotAgentKit } from '../../../src/api';
import { getLangChainTools } from '../../../src/langchain';
import { sleep } from '../utils';
import { AgentProvider, AgentResponse } from "./types";



export class AgentTest {
  provider: AgentProvider;
  model: string;
  private agentExecutor: AgentExecutor | undefined;

  constructor(
    private agentKit: PolkadotAgentKit,
    private systemPrompt: string,
    ollamaModel: string = "qwen3:latest",
    geminiModel: string = "gemini-2.0-flash"
  ) {
    if (process.env.GEMINI_API_KEY) {
      this.provider = 'gemini';
      this.model = geminiModel;
      console.log('Using Gemini:', this.model);
    } else {
      this.provider = 'ollama';
      this.model = ollamaModel;
      console.log('Using Ollama:', this.model);
    }
  }

  async init() {
    // Create LLM based on provider
    console.log("This model:",this.model);
    
    const tools = getLangChainTools(this.agentKit);
    
    const llm = this.provider === 'gemini'
      ? new ChatGoogleGenerativeAI({
          model: this.model,
          apiKey: process.env.GEMINI_API_KEY,
          convertSystemMessageToHumanContent: true,
        })
      : new ChatOllama({
          model: this.model,
        });


    const agent = createToolCallingAgent({
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
      agent,
      tools: tools as any,
      verbose: true,
      returnIntermediateSteps: true,
      maxIterations: 15,
      earlyStoppingMethod: "generate"
    });

    await sleep(2000);
  }

  async ask(query: string): Promise<AgentResponse> {
    if (!this.agentExecutor) {
      throw new Error("Agent not initialized. Call init() first.");
    }

    const result = await this.agentExecutor.invoke({ input: query });
    return {
      input: result.input,
      output: result.output,
      intermediateSteps: result.intermediateSteps,
      provider: this.provider,
      model: this.model
    };
  }

  isReady(): boolean {
    return !!this.agentExecutor;
  }
}