"use server"

import { cookies } from 'next/headers'
import { encrypt, decrypt } from './encryption'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}

const AGENT_CONFIG_COOKIE = 'agent_config'
const LLM_CONFIG_COOKIE = 'llm_config'
const SESSION_ID_COOKIE = 'session_id'

export interface AgentConfig {
  privateKey: string
  keyType: 'Sr25519' | 'Ed25519'
  chains: string[]
  isConfigured?: boolean
}

export interface LlmConfig {
  provider: string
  model: string
  apiKey: string | null
}

export async function getAgentConfig(): Promise<AgentConfig | null> {
  try {
    const cookieStore = await cookies()
    const encrypted = cookieStore.get(AGENT_CONFIG_COOKIE)?.value
    
    if (!encrypted) {
      return null
    }
    
    const decrypted = await decrypt(encrypted)
    return JSON.parse(decrypted) as AgentConfig
  } catch (error) {
    console.error('[Session] Failed to get agent config:', error)
    return null
  }
}

export async function setAgentConfig(config: AgentConfig): Promise<void> {
  try {
    const cookieStore = await cookies()
    const encrypted = await encrypt(JSON.stringify(config))
    
    cookieStore.set(AGENT_CONFIG_COOKIE, encrypted, COOKIE_OPTIONS)
  } catch (error) {
    console.error('[Session] Failed to set agent config:', error)
    throw new Error('Failed to store agent configuration')
  }
}

export async function getLlmConfig(): Promise<LlmConfig | null> {
  try {
    const cookieStore = await cookies()
    const encrypted = cookieStore.get(LLM_CONFIG_COOKIE)?.value
    
    if (!encrypted) {
      return null
    }
    
    const decrypted = await decrypt(encrypted)
    return JSON.parse(decrypted) as LlmConfig
  } catch (error) {
    console.error('[Session] Failed to get LLM config:', error)
    return null
  }
}

export async function setLlmConfig(config: LlmConfig): Promise<void> {
  try {
    const cookieStore = await cookies()
    const encrypted = await encrypt(JSON.stringify(config))
    
    cookieStore.set(LLM_CONFIG_COOKIE, encrypted, COOKIE_OPTIONS)
  } catch (error) {
    console.error('[Session] Failed to set LLM config:', error)
    throw new Error('Failed to store LLM configuration')
  }
}

export async function getSessionId(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(SESSION_ID_COOKIE)?.value || null
  } catch (error) {
    return null
  }
}

export async function setSessionId(sessionId: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_ID_COOKIE, sessionId, COOKIE_OPTIONS)
  } catch (error) {
    console.error('[Session] Failed to set session ID:', error)
  }
}

export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(AGENT_CONFIG_COOKIE)
    cookieStore.delete(LLM_CONFIG_COOKIE)
    cookieStore.delete(SESSION_ID_COOKIE)
  } catch (error) {
    console.error('[Session] Failed to clear session:', error)
  }
}

export async function hasValidSession(): Promise<boolean> {
  const agentConfig = await getAgentConfig()
  const llmConfig = await getLlmConfig()
  return !!(agentConfig?.isConfigured && llmConfig)
}

