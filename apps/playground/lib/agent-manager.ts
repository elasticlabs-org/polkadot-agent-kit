"use server"

import { getAgentConfig, getSessionId, setSessionId } from './session'
import { randomBytes } from 'crypto'

interface AgentKitInstance {
  agentKit: any
  createdAt: number
  lastAccessed: number
}

const agentKitCache = new Map<string, AgentKitInstance>()
const SESSION_EXPIRY = 15 * 60 * 1000 // 15 minutes
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

function generateSessionId(): string {
  return randomBytes(16).toString('hex')
}

function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [sessionId, instance] of agentKitCache.entries()) {
    if (now - instance.lastAccessed > SESSION_EXPIRY) {
      try {
        if (instance.agentKit?.disconnect) {
          instance.agentKit.disconnect().catch(console.error)
        }
      } catch (error) {
        console.error(`[AgentManager] Error disconnecting agentKit for session ${sessionId}:`, error)
      }
      agentKitCache.delete(sessionId)
    }
  }
}

setInterval(cleanupExpiredSessions, CACHE_CLEANUP_INTERVAL)

export async function getOrCreateAgentKit(): Promise<{ agentKit: any; sessionId: string }> {
  console.log('[AgentManager] getOrCreateAgentKit: Starting function')
  try {
    console.log('[AgentManager] getOrCreateAgentKit: Getting session ID')
    let sessionId = await getSessionId()
    console.log('[AgentManager] getOrCreateAgentKit: Session ID retrieved:', sessionId || 'null')
    
    if (!sessionId) {
      console.log('[AgentManager] getOrCreateAgentKit: No session ID found, generating new one')
      sessionId = generateSessionId()
      console.log('[AgentManager] getOrCreateAgentKit: Generated session ID:', sessionId)
      await setSessionId(sessionId)
      console.log('[AgentManager] getOrCreateAgentKit: Session ID stored in cookie')
    }
    
    console.log('[AgentManager] getOrCreateAgentKit: Looking up instance in cache for session:', sessionId)
    const instance = agentKitCache.get(sessionId)
    console.log('[AgentManager] getOrCreateAgentKit: Cache lookup result:', instance ? 'found' : 'not found')
    const now = Date.now()
    console.log('[AgentManager] getOrCreateAgentKit: Current timestamp:', now)
    
    if (instance && (now - instance.lastAccessed < SESSION_EXPIRY)) {
      console.log('[AgentManager] getOrCreateAgentKit: Valid cached instance found, updating lastAccessed')
      instance.lastAccessed = now
      console.log('[AgentManager] getOrCreateAgentKit: Returning cached agentKit instance')
      return { agentKit: instance.agentKit, sessionId }
    }
    
    console.log('[AgentManager] getOrCreateAgentKit: No valid cache, creating new instance')
    console.log('[AgentManager] getOrCreateAgentKit: Getting agent config from session')
    const agentConfig = await getAgentConfig()
    console.log('[AgentManager] getOrCreateAgentKit: Agent config retrieved:', agentConfig ? 'found' : 'not found')
    if (!agentConfig || !agentConfig.isConfigured) {
      console.error('[AgentManager] getOrCreateAgentKit: Agent not configured, throwing error')
      throw new Error('Agent not configured')
    }
    console.log('[AgentManager] getOrCreateAgentKit: Agent config validated, isConfigured:', agentConfig.isConfigured)
    
    console.log('[AgentManager] getOrCreateAgentKit: Importing PolkadotAgentKit from SDK')
    const { PolkadotAgentKit } = await import('@polkadot-agent-kit/sdk')
    console.log('[AgentManager] getOrCreateAgentKit: SDK imported successfully')
    
    console.log('[AgentManager] getOrCreateAgentKit: Creating new PolkadotAgentKit instance')
    console.log('[AgentManager] getOrCreateAgentKit: Config - keyType:', agentConfig.keyType, 'chains:', agentConfig.chains)
    const agentKit = new PolkadotAgentKit({
      privateKey: agentConfig.privateKey,
      keyType: agentConfig.keyType,
      chains: agentConfig.chains as any,
    })
    console.log('[AgentManager] getOrCreateAgentKit: PolkadotAgentKit instance created')
    
    console.log('[AgentManager] getOrCreateAgentKit: Initializing API (this may take a moment)')
    await agentKit.initializeApi()
    console.log('[AgentManager] getOrCreateAgentKit: API initialized successfully')
    
    console.log('[AgentManager] getOrCreateAgentKit: Storing instance in cache')
    agentKitCache.set(sessionId, {
      agentKit,
      createdAt: now,
      lastAccessed: now,
    })
    console.log('[AgentManager] getOrCreateAgentKit: Instance cached with sessionId:', sessionId)
    
    console.log('[AgentManager] getOrCreateAgentKit: Returning new agentKit instance')
    return { agentKit, sessionId }
  } catch (error) {
    console.error('[AgentManager] Failed to get or create agentKit:', error)
    throw error
  }
}

export async function initializeAgentKit(): Promise<void> {
  try {
    await getOrCreateAgentKit()
  } catch (error) {
    console.error('[AgentManager] Failed to initialize agentKit:', error)
    throw error
  }
}

export async function clearAgentKit(sessionId?: string): Promise<void> {
  try {
    const targetSessionId = sessionId || await getSessionId()
    if (!targetSessionId) {
      return
    }
    
    const instance = agentKitCache.get(targetSessionId)
    if (instance?.agentKit?.disconnect) {
      await instance.agentKit.disconnect()
    }
    
    agentKitCache.delete(targetSessionId)
  } catch (error) {
    console.error('[AgentManager] Failed to clear agentKit:', error)
  }
}

export async function isAgentKitInitialized(): Promise<boolean> {
  try {
    const sessionId = await getSessionId()
    if (!sessionId) {
      return false
    }
    
    const instance = agentKitCache.get(sessionId)
    if (!instance) {
      return false
    }
    
    const now = Date.now()
    if (now - instance.lastAccessed > SESSION_EXPIRY) {
      await clearAgentKit(sessionId)
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

