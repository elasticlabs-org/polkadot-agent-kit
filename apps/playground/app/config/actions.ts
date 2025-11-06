"use server"

import {
  setAgentConfig,
  setLlmConfig,
  getAgentConfig,
  getLlmConfig,
  clearSession,
  type AgentConfig,
  type LlmConfig,
} from '@/lib/session'
import { initializeAgentKit, clearAgentKit } from '@/lib/agent-manager'

export interface StoreAgentConfigResult {
  success: boolean
  error?: string
}

export async function storeAgentConfig(
  config: Omit<AgentConfig, 'isConfigured'>
): Promise<StoreAgentConfigResult> {
  try {
    if (!config.privateKey) {
      return {
        success: false,
        error: 'Private key is required',
      }
    }

    if (!config.keyType) {
      return {
        success: false,
        error: 'Key type is required',
      }
    }

    if (!config.chains || config.chains.length === 0) {
      return {
        success: false,
        error: 'At least one chain is required',
      }
    }

    const fullConfig: AgentConfig = {
      ...config,
      isConfigured: true,
    }

    await setAgentConfig(fullConfig)

    try {
      await initializeAgentKit()
    } catch (error) {
      console.error('[Config Actions] Failed to initialize agentKit:', error)
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize agent. Please check your configuration.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Config Actions] Error storing agent config:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to store agent configuration',
    }
  }
}

export interface StoreLlmConfigResult {
  success: boolean
  error?: string
}

export async function storeLlmConfig(
  config: LlmConfig
): Promise<StoreLlmConfigResult> {
  try {
    if (!config.provider) {
      return {
        success: false,
        error: 'LLM provider is required',
      }
    }

    if (!config.model) {
      return {
        success: false,
        error: 'Model is required',
      }
    }

    const needsApiKey = config.provider === 'openai' || config.provider === 'gemini'
    if (needsApiKey && !config.apiKey) {
      const envVar =
        config.provider === 'openai'
          ? 'NEXT_PUBLIC_OPENAI_KEY'
          : 'NEXT_PUBLIC_GOOGLE_API_KEY'
      const envApiKey =
        config.provider === 'openai'
          ? process.env.NEXT_PUBLIC_OPENAI_KEY
          : process.env.NEXT_PUBLIC_GOOGLE_API_KEY

      if (!envApiKey) {
        return {
          success: false,
          error: `API key is required for ${config.provider}. Provide it or set ${envVar}.`,
        }
      }
    }

    await setLlmConfig(config)

    return {
      success: true,
    }
  } catch (error) {
    console.error('[Config Actions] Error storing LLM config:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to store LLM configuration',
    }
  }
}

export async function getStoredAgentConfig(): Promise<AgentConfig | null> {
  try {
    return await getAgentConfig()
  } catch (error) {
    console.error('[Config Actions] Error getting agent config:', error)
    return null
  }
}

export async function getStoredLlmConfig(): Promise<LlmConfig | null> {
  try {
    return await getLlmConfig()
  } catch (error) {
    console.error('[Config Actions] Error getting LLM config:', error)
    return null
  }
}

export async function clearStoredConfig(): Promise<void> {
  try {
    await clearAgentKit()
    await clearSession()
  } catch (error) {
    console.error('[Config Actions] Error clearing config:', error)
  }
}

export async function checkInitializationStatus(): Promise<{
  isInitialized: boolean
  hasAgentConfig: boolean
  hasLlmConfig: boolean
}> {
  try {
    const { hasValidSession, getAgentConfig, getLlmConfig } = await import('@/lib/session')
    const { isAgentKitInitialized } = await import('@/lib/agent-manager')

    const hasSession = await hasValidSession()
    const agentKitInitialized = await isAgentKitInitialized()
    const agentConfig = await getAgentConfig()
    const llmConfig = await getLlmConfig()

    return {
      isInitialized: hasSession && agentKitInitialized,
      hasAgentConfig: !!agentConfig?.isConfigured,
      hasLlmConfig: !!llmConfig,
    }
  } catch (error) {
    console.error('[Config Actions] Error checking initialization status:', error)
    return {
      isInitialized: false,
      hasAgentConfig: false,
      hasLlmConfig: false,
    }
  }
}

