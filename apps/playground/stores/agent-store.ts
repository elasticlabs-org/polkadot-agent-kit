import { create, StoreApi } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import React from 'react'

interface AgentConfig {
  privateKey: string
  keyType: "Sr25519" | "Ed25519"
  chains: string[]
  isConfigured?: boolean
}

interface AgentState {
  // Configuration
  config: AgentConfig | null
  isConfigured: boolean
  
  // Agent instance
  agentKit: any | null
  isInitialized: boolean
  isInitializing: boolean
  
  // Session management
  sessionExpiry: number | null
  
  // Actions
  setConfig: (config: AgentConfig) => void
  initializeAgent: () => Promise<void>
  resetAgent: () => void
  setInitializing: (loading: boolean) => void
  checkSession: () => boolean
  restoreAgent: () => Promise<void>
  // Helper to get actual initialization status (considers agentKit existence)
  getIsInitialized: () => boolean
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => {
      // Check session on store initialization
      const checkAndRestoreSession = () => {
        const { sessionExpiry, isInitialized, config } = get()
        if (sessionExpiry && isInitialized && config) {
          const now = Date.now()
          if (now > sessionExpiry) {
            // Session expired, reset
            set({
              agentKit: null,
              isInitialized: false,
              sessionExpiry: null
            })
            return false
          }
          // Session is valid, but we need to reinitialize the agentKit
          // since it can't be serialized
          return true
        }
        return false
      }

      return {
      // Initial state
      config: null,
      isConfigured: false,
      agentKit: null,
      isInitialized: false,
      isInitializing: false,
      sessionExpiry: null,

      // Actions
      setConfig: (config: AgentConfig) => {

        set({ 
          config,
          isConfigured: config.isConfigured || false
        })

      },

      setInitializing: (isInitializing: boolean) => {
        set({ isInitializing })
      },

      checkSession: () => {
        const { sessionExpiry, isInitialized, config } = get()
        // If no config, no session
        if (!config) return false
        // If not initialized, no valid session
        if (!isInitialized) return false
        // If no session expiry, no valid session
        if (!sessionExpiry) return false
        
        const now = Date.now()
        if (now > sessionExpiry) {
          // Session expired, reset agent but keep config
          set({
            agentKit: null,
            isInitialized: false,
            sessionExpiry: null
          })
          return false
        }
        return true
      },

      restoreAgent: async () => {
        const { config, sessionExpiry } = get()
        if (!config || !sessionExpiry) return

        const now = Date.now()
        if (now > sessionExpiry) {
          // Session expired
          set({
            agentKit: null,
            isInitialized: false,
            sessionExpiry: null
          })
          return
        }

        try {
          set({ isInitializing: true })
          
          const { PolkadotAgentKit } = await import("@polkadot-agent-kit/sdk")
          
          const agentKit = new PolkadotAgentKit({
            privateKey: config.privateKey,
            keyType: config.keyType,
            chains: config.chains as any,
          })

          await agentKit.initializeApi()

          set({ 
            agentKit,
            isInitialized: true,
            isInitializing: false
          })

        } catch (error) {
          console.error('[AgentStore] Failed to restore agent:', error)
          set({ 
            isInitialized: false,
            isInitializing: false
          })
        }
      },

      initializeAgent: async () => {
        const { config } = get()
        if (!config || !config.isConfigured) {
          console.log('[AgentStore] Agent not configured, config:', config)
          throw new Error('Agent not configured')
        }

        set({ isInitializing: true })

        try {
          const { PolkadotAgentKit } = await import("@polkadot-agent-kit/sdk")
          
          const agentKit = new PolkadotAgentKit({
            privateKey: config.privateKey,
            keyType: config.keyType,
            chains: config.chains as any,
          })

          await agentKit.initializeApi()

          // Set session expiry to 15 minutes from now
          const sessionExpiry = Date.now() + (15 * 60 * 1000) // 15 minutes
          
          set({ 
            agentKit,
            isInitialized: true,
            isInitializing: false,
            sessionExpiry
          })

        } catch (error) {
          console.error('[AgentStore] Failed to initialize agent:', error)
          set({ 
            isInitialized: false,
            isInitializing: false
          })
          throw error
        }
      },

      resetAgent: () => {
        set({
          config: null,
          isConfigured: false,
          agentKit: null,
          isInitialized: false,
          isInitializing: false,
          sessionExpiry: null
        })
      },

      getIsInitialized: () => {
        const { agentKit, isInitialized } = get()
        // isInitialized is only true if we actually have an agentKit instance
        return isInitialized && agentKit !== null
      }
      }
    },
    {
      name: 'polkadot-agent-store',
      partialize: (state: AgentState) => ({
        config: state.config,
        isConfigured: state.isConfigured,
        isInitialized: state.isInitialized,
        sessionExpiry: state.sessionExpiry
      }),
      // Use JSON storage helper to keep the { state, version } shape correct
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state?: AgentState) => {
        // Always clear agentKit on rehydration to prevent plain object deserialization
        // This forces recreation via useAgentRestore
        if (state) {
          console.log('[AgentStore] Rehydration: Clearing agentKit to force restoration')
          state.agentKit = null
          // Keep isInitialized flag but set to false until restoration completes
          // This prevents the UI from showing "ready" before agent is actually restored
          state.isInitialized = false
        }
      }
    }
  )
)

// Hook to get the actual initialization status (considers agentKit existence)
export const useIsInitialized = () => {
  const { agentKit, isInitialized } = useAgentStore()
  // isInitialized is only true if we actually have an agentKit instance
  return isInitialized && agentKit !== null
}

// Hook to automatically restore agent on page load
export const useAgentRestore = () => {
  const { isInitialized, agentKit, config, sessionExpiry, restoreAgent } = useAgentStore()
  const [hasAttemptedRestore, setHasAttemptedRestore] = React.useState(false)
  
  React.useEffect(() => {
    // Skip if already attempted or if we already have a valid agentKit
    if (hasAttemptedRestore || (agentKit && typeof agentKit === 'object' && agentKit.getActions)) {
      return
    }
    
    // Wait for Zustand to hydrate from localStorage
    const timer = setTimeout(() => {
      // Only restore if we have config
      if (!config) {
        console.log('[useAgentRestore] No config found, skipping restoration')
        setHasAttemptedRestore(true)
        return
      }
      
      // Check if we have a session expiry that hasn't expired
      if (sessionExpiry) {
        const now = Date.now()
        if (now > sessionExpiry) {
          console.log('[useAgentRestore] Session expired, user needs to reconnect')
          setHasAttemptedRestore(true)
          return
        }
        
        // We have valid config and non-expired session, but no agentKit - restore it
        console.log('[useAgentRestore] Restoring agent from valid session')
        restoreAgent().catch((error) => {
          console.error('[useAgentRestore] Failed to restore agent:', error)
        })
      } else {
        console.log('[useAgentRestore] No session expiry, user needs to initialize')
      }
      
      setHasAttemptedRestore(true)
    }, 200) // Small delay to ensure Zustand has hydrated
    
    return () => clearTimeout(timer)
  }, [config, sessionExpiry, agentKit, hasAttemptedRestore, restoreAgent])
}
