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
  console.log('[Config Actions] storeAgentConfig: Starting function')
  console.log('[Config Actions] storeAgentConfig: Received config - keyType:', config.keyType, 'chains:', config.chains?.length || 0)
  try {
    console.log('[Config Actions] storeAgentConfig: Validating private key')
    if (!config.privateKey) {
      console.error('[Config Actions] storeAgentConfig: Validation failed - Private key is required')
      return {
        success: false,
        error: 'Private key is required',
      }
    }
    console.log('[Config Actions] storeAgentConfig: Private key validation passed')

    console.log('[Config Actions] storeAgentConfig: Validating key type')
    if (!config.keyType) {
      console.error('[Config Actions] storeAgentConfig: Validation failed - Key type is required')
      return {
        success: false,
        error: 'Key type is required',
      }
    }
    console.log('[Config Actions] storeAgentConfig: Key type validation passed:', config.keyType)

    console.log('[Config Actions] storeAgentConfig: Validating chains')
    if (!config.chains || config.chains.length === 0) {
      console.error('[Config Actions] storeAgentConfig: Validation failed - At least one chain is required')
      return {
        success: false,
        error: 'At least one chain is required',
      }
    }
    console.log('[Config Actions] storeAgentConfig: Chains validation passed, count:', config.chains.length)

    console.log('[Config Actions] storeAgentConfig: Creating full config with isConfigured: true')
    const fullConfig: AgentConfig = {
      ...config,
      isConfigured: true,
    }
    console.log('[Config Actions] storeAgentConfig: Full config created, isConfigured:', fullConfig.isConfigured)

    console.log('[Config Actions] storeAgentConfig: Storing agent config in session')
    await setAgentConfig(fullConfig)
    console.log('[Config Actions] storeAgentConfig: Agent config stored successfully')

    console.log('[Config Actions] storeAgentConfig: Initializing agentKit')
    try {
      await initializeAgentKit()
      console.log('[Config Actions] storeAgentConfig: AgentKit initialized successfully')
    } catch (error) {
      console.error('[Config Actions] Failed to initialize agentKit:', error)
      console.error('[Config Actions] storeAgentConfig: Initialization failed, returning error')
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize agent. Please check your configuration.',
      }
    }

    console.log('[Config Actions] storeAgentConfig: All operations completed successfully')
    return {
      success: true,
    }
  } catch (error) {
    console.error('[Config Actions] Error storing agent config:', error)
    console.error('[Config Actions] storeAgentConfig: Unexpected error occurred')
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

