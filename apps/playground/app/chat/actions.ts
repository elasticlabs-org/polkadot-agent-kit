"use server"

import { getLlmConfig } from '@/lib/session'
import { getOrCreateAgentKit } from '@/lib/agent-manager'

export interface ExecuteChatMessageResult {
  success: boolean
  message: string
  error?: string
}

export async function executeChatMessage(
  userMessage: string
): Promise<ExecuteChatMessageResult> {
  try {
    if (!userMessage || !userMessage.trim()) {
      return {
        success: false,
        message: '',
        error: 'Message cannot be empty',
      }
    }

    const llmConfig = await getLlmConfig()
    if (!llmConfig) {
      return {
        success: false,
        message: '',
        error: 'LLM configuration not found. Please configure your LLM provider first.',
      }
    }

    const { agentKit } = await getOrCreateAgentKit()
    if (!agentKit) {
      return {
        success: false,
        message: '',
        error: 'Agent not initialized. Please configure your agent first.',
      }
    }

    const { getLangChainTools } = await import('@polkadot-agent-kit/sdk')
    const { AgentExecutor, createToolCallingAgent } = await import('langchain/agents')
    const { ChatPromptTemplate } = await import('@langchain/core/prompts')

    let llm: any
    if (llmConfig.provider === 'ollama') {
      const { ChatOllama } = await import('@langchain/ollama')
      llm = new ChatOllama({
        model: llmConfig.model || 'qwen3:latest',
        temperature: 0,
      })
    } else if (llmConfig.provider === 'openai') {
      const { ChatOpenAI } = await import('@langchain/openai')
      const apiKey = llmConfig.apiKey || process.env.NEXT_PUBLIC_OPENAI_KEY
      if (!apiKey) {
        return {
          success: false,
          message: '',
          error: 'OpenAI API key not found. Provide it or set NEXT_PUBLIC_OPENAI_KEY.',
        }
      }
      llm = new ChatOpenAI({
        model: llmConfig.model || 'gpt-4o-mini',
        temperature: 0,
        apiKey,
      })
    } else if (llmConfig.provider === 'gemini') {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai')
      const apiKey = llmConfig.apiKey || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
      if (!apiKey) {
        return {
          success: false,
          message: '',
          error: 'Google Generative AI API key not found. Set it in config or NEXT_PUBLIC_GOOGLE_API_KEY.',
        }
      }
      llm = new ChatGoogleGenerativeAI({
        model: llmConfig.model || 'gemini-2.0-flash',
        temperature: 0,
        apiKey,
      })
    } else {
      return {
        success: false,
        message: '',
        error: `Unsupported LLM provider: ${llmConfig.provider}`,
      }
    }

    const tools = getLangChainTools(agentKit)
    const agentPrompt = createToolCallingAgent({
      llm: llm as any,
      tools: tools as any,
      prompt: ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are a helpful Polkadot assistant. Use the available tools to help users with blockchain operations.',
        ],
        ['placeholder', '{chat_history}'],
        ['human', '{input}'],
        ['placeholder', '{agent_scratchpad}'],
      ]) as any,
    })

    const agentExecutor = new AgentExecutor({
      agent: agentPrompt,
      tools: tools as any,
      verbose: true,
      returnIntermediateSteps: true,
    })

    const result = await agentExecutor.invoke({ input: userMessage })
    let outputText =
      typeof result.output === 'string'
        ? result.output
        : JSON.stringify(result.output, null, 2)

    outputText = outputText.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    return {
      success: true,
      message: outputText,
    }
  } catch (error) {
    console.error('[Chat Actions] Error executing chat message:', error)
    return {
      success: false,
      message: '',
      error:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while processing your message',
    }
  }
}

