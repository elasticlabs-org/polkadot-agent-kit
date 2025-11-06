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
  try {
    let sessionId = await getSessionId()
    
    if (!sessionId) {
      sessionId = generateSessionId()
      await setSessionId(sessionId)
    }
    
    const instance = agentKitCache.get(sessionId)
    const now = Date.now()
    
    if (instance && (now - instance.lastAccessed < SESSION_EXPIRY)) {
      instance.lastAccessed = now
      return { agentKit: instance.agentKit, sessionId }
    }
    
    const agentConfig = await getAgentConfig()
    if (!agentConfig || !agentConfig.isConfigured) {
      throw new Error('Agent not configured')
    }
    
    const { PolkadotAgentKit } = await import('@polkadot-agent-kit/sdk')
    
    const agentKit = new PolkadotAgentKit({
      privateKey: agentConfig.privateKey,
      keyType: agentConfig.keyType,
      chains: agentConfig.chains as any,
    })
    
    await agentKit.initializeApi()
    
    agentKitCache.set(sessionId, {
      agentKit,
      createdAt: now,
      lastAccessed: now,
    })
    
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

