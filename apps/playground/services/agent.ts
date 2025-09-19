"use client"

import type { AgentExecutor } from "langchain/agents"
import type { KeyType, KnownChainId } from "@polkadot-agent-kit/common"
import {ASSETS_PROMPT, SWAP_PROMPT, NOMINATION_PROMPT, IDENTITY_PROMPT, BIFROST_PROMPT} from "@polkadot-agent-kit/llm"
type AgentConfigLocal = {
  llmProvider: string
  llmModel: string
  apiKey?: string
  privateKey: string
  keyType: KeyType
  chains: KnownChainId[]
}

const SYSTEM_PROMPT = ASSETS_PROMPT + SWAP_PROMPT + NOMINATION_PROMPT + BIFROST_PROMPT;


export class AgentService {
  private static instance: AgentService | null = null
  private agentExecutor: AgentExecutor | undefined
  private initialized = false

  static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService()
    }
    return AgentService.instance
  }

  private getLocalConfig(): AgentConfigLocal {
    const raw = localStorage.getItem("polkadot-agent-config")
    if (!raw) throw new Error("Agent configuration not found. Please configure the agent first.")
    const cfg = JSON.parse(raw)
    return {
      llmProvider: cfg.llmProvider,
      llmModel: cfg.llmModel || "qwen3:latest",
      apiKey: cfg.apiKey,
      privateKey: cfg.privateKey,
      keyType: (cfg.keyType || "Sr25519") as KeyType,
      chains: (cfg.chains || ["paseo", "paseo_people"]) as KnownChainId[],
    }
  }

  async init(): Promise<void> {
    if (this.initialized) return

    const cfg = this.getLocalConfig()

    // Dynamically import heavy deps to avoid SSR/build issues
    const [{ PolkadotAgentKit, getLangChainTools }, { AgentExecutor, createToolCallingAgent }, { ChatPromptTemplate }] =
      await Promise.all([
        import("@polkadot-agent-kit/sdk").then(m => ({ PolkadotAgentKit: m.PolkadotAgentKit, getLangChainTools: m.getLangChainTools })),
        import("langchain/agents"),
        import("@langchain/core/prompts"),
      ])

    const agentKit = new PolkadotAgentKit({
      privateKey: cfg.privateKey,
      keyType: cfg.keyType,
      chains: cfg.chains,
    })
    await agentKit.initializeApi()

    // Only Ollama is supported client-side reliably (no CORS). Structure to expand later.
    if (cfg.llmProvider !== "ollama") {
      throw new Error("Only Ollama is supported in the browser for now. Please select Ollama in configuration.")
    }

    const { ChatOllama } = await import("@langchain/ollama")
    const llm = new ChatOllama({
      model: cfg.llmModel || "qwen3:latest",
      temperature: 0,
    })

    const tools = getLangChainTools(agentKit)

    const agentPrompt = createToolCallingAgent({
      llm: llm as any,
      tools: tools as any,
      prompt: ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
      ]) as any,
    })

    this.agentExecutor = new AgentExecutor({
      agent: agentPrompt,
      tools: tools as any,
      verbose: true,
      returnIntermediateSteps: true,
    })

    this.initialized = true
  }

  async ask(query: string): Promise<{ output: unknown; intermediateSteps: unknown[] }> {
    if (!this.initialized || !this.agentExecutor) {
      await this.init()
    }
    if (!this.agentExecutor) throw new Error("Agent not ready")
    console.log("[AgentService] User input:", query)
    const res: any = await this.agentExecutor.invoke({ input: query })
    console.log("[AgentService] Agent response:", res)
    return { output: res?.output, intermediateSteps: res?.intermediateSteps || [] }
  }
}


